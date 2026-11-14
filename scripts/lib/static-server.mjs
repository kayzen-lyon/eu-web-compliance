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
// (même format, nom accepté par `scripts/validate.py`). Ces fichiers ne sont jamais servis.

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

function patternToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/:[A-Za-z_][\w-]*/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
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

// Démarre le serveur sur 127.0.0.1, port libre. Renvoie { server, origin, headersFile, close }.
export async function startStaticServer(root, { applyHeaders = true } = {}) {
  const base = path.resolve(root);
  const { file: headersFile, rules } = applyHeaders ? await loadHeadersRules(base) : { file: null, rules: [] };
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.resolve(base, `.${urlPath}`);
      if ((file !== base && !file.startsWith(base + path.sep)) || HEADERS_FILE_NAMES.includes(path.basename(file))) {
        res.writeHead(404).end();
        return;
      }
      const stat = await fs.stat(file).catch(() => null);
      if (stat && stat.isDirectory()) file = path.join(file, 'index.html');
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
