// Serveur statique local, partagé par les vérificateurs, qui applique les en-têtes
// déclarés dans un fichier de style Netlify à la racine du dossier servi.
//
// Format du fichier d'en-têtes (comme `_headers` chez Netlify ou Cloudflare Pages) :
//
//   # commentaire
//   /*
//     X-Content-Type-Options: nosniff
//     Referrer-Policy: strict-origin-when-cross-origin
//   /compte/connexion.html
//     Set-Cookie: sid=abc; Path=/; Secure; HttpOnly; SameSite=Lax
//
// Une ligne non indentée est un motif de chemin : chemin exact, `*` pour « n'importe quelle
// suite de caractères » (`/*`, `/dossier/*`), `:nom` pour un segment. Les lignes indentées
// qui suivent sont des en-têtes `Nom: valeur`. Tous les blocs dont le motif correspond
// s'appliquent, dans l'ordre du fichier ; un même en-tête répété est joint par « , »,
// sauf Set-Cookie qui reste une liste.
//
// Noms de fichier reconnus, dans cet ordre : `_headers` (nom Netlify), puis `.headers`
// (même format, nom accepté par `scripts/validate.py`). Ces fichiers ne sont jamais servis, pas
// plus que les fichiers et dossiers cachés (.env, .git/), sauf .well-known/, ni un lien
// symbolique qui sort du dossier servi.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

export const HEADERS_FILE_NAMES = ['_headers', '.headers'];

export const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.vtt': 'text/vtt; charset=utf-8',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.wav': 'audio/wav',
};

// Motif d'un fichier d'en-têtes : « * » vaut n'importe quelle suite de caractères, « :nom » un
// segment sans barre oblique. La comparaison avance caractère par caractère sur l'ensemble des
// positions possibles du motif : son coût reste proportionnel à motif × chemin, quel que soit le
// motif (une expression régulière à plusieurs « .* » peut, elle, bloquer le serveur).
export function patternToRegExp(pattern) {
  const tokens = (pattern.match(/\*+|:[A-Za-z_][\w-]*|[\s\S]/g) || []).map((part) => {
    if (part[0] === '*') return { star: true };
    if (part.length > 1 && part[0] === ':') return { param: true };
    return { char: part };
  });
  const close = (states) => {
    for (const index of states) if (tokens[index] && tokens[index].star) states.add(index + 1);
    return states;
  };
  return {
    test(text) {
      let states = close(new Set([0]));
      for (const character of String(text)) {
        const next = new Set();
        for (const index of states) {
          const token = tokens[index];
          if (!token) continue;
          if (token.star) next.add(index);
          else if (token.param) { if (character !== '/') { next.add(index); next.add(index + 1); } }
          else if (token.char === character) next.add(index + 1);
        }
        if (!next.size) return false;
        states = close(next);
      }
      return states.has(tokens.length);
    },
  };
}

// Analyse le texte d'un fichier d'en-têtes. Lève une erreur claire sur une ligne mal formée.
export function parseHeadersFile(text) {
  const rules = [];
  let current = null;
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('#')) return;
    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), regex: patternToRegExp(line.trim()), headers: [] };
      rules.push(current);
      return;
    }
    const match = line.trim().match(/^([A-Za-z0-9!#$%&'*+.^_`|~-]+)\s*:\s*(.*)$/);
    if (!current || !match) throw new Error(`fichier d'en-têtes, ligne ${index + 1} : « ${line.trim()} » n'est ni un motif de chemin ni un en-tête « Nom: valeur »`);
    // Valeur qu'un serveur HTTP peut envoyer : caractères visibles ASCII, espaces et tabulations.
    if (!/^[\t\x20-\x7e]*$/.test(match[2])) {
      throw new Error(`fichier d'en-têtes, ligne ${index + 1} : la valeur de ${match[1]} contient un caractère non ASCII ou de contrôle, qu'un en-tête HTTP ne peut pas porter`);
    }
    current.headers.push([match[1], match[2]]);
  });
  return rules;
}

// En-têtes à appliquer pour un chemin d'URL. Renvoie un objet { nom en minuscules: valeur | [valeurs] }.
export function headersForPath(rules, urlPath) {
  const candidates = [urlPath];
  if (urlPath.endsWith('/index.html')) candidates.push(urlPath.slice(0, -'index.html'.length));
  const out = {};
  for (const rule of rules) {
    if (!candidates.some((p) => rule.regex.test(p))) continue;
    for (const [name, value] of rule.headers) {
      const key = name.toLowerCase();
      if (key === 'set-cookie') out[key] = [...(out[key] || []), value];
      else out[key] = out[key] === undefined ? value : `${out[key]}, ${value}`;
    }
  }
  return out;
}

export async function loadHeadersRules(root) {
  for (const name of HEADERS_FILE_NAMES) {
    const text = await fs.readFile(path.join(root, name), 'utf8').catch(() => null);
    if (text !== null) return { file: name, rules: parseHeadersFile(text) };
  }
  return { file: null, rules: [] };
}

// Un fichier peut être servi s'il est dans la racine (comparaison par path.relative, juste aussi
// quand la racine est un lecteur ou « / »), s'il n'est pas un fichier d'en-têtes, et si aucun
// segment du chemin n'est caché (.env, .git/), sauf .well-known (security.txt...).
function servable(base, file) {
  const relative = path.relative(base, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return false;
  const segments = relative.split(path.sep).filter(Boolean);
  if (segments.length && HEADERS_FILE_NAMES.includes(segments[segments.length - 1])) return false;
  return segments.every((s, i) => !s.startsWith('.') || (i === 0 && s === '.well-known'));
}

// Démarre le serveur sur 127.0.0.1, port libre. Renvoie { server, origin, headersFile, close }.
export async function startStaticServer(root, { applyHeaders = true } = {}) {
  const base = path.resolve(root);
  const { file: headersFile, rules } = applyHeaders ? await loadHeadersRules(base) : { file: null, rules: [] };
  const realBase = await fs.realpath(base);
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.resolve(base, `.${urlPath}`);
      if (!servable(base, file)) {
        res.writeHead(404).end();
        return;
      }
      const stat = await fs.stat(file).catch(() => null);
      if (stat && stat.isDirectory()) file = path.join(file, 'index.html');
      // Lien symbolique qui mène hors du dossier servi : refusé.
      if (!servable(realBase, await fs.realpath(file))) {
        res.writeHead(404).end();
        return;
      }
      const body = await fs.readFile(file);
      const headers = { 'content-type': CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        ...headersForPath(rules, urlPath) };
      res.writeHead(200, headers);
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    server, headersFile, origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    }),
  };
}
