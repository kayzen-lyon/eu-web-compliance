// Garde-fous du serveur MCP : les arguments d'un outil sont écrits par un modèle de langage, qui
// peut avoir lu un texte piégé (page web, fichier d'un dépôt). Ces contrôles ne font que refuser ;
// aucun n'élargit ce que les vérificateurs ont le droit de faire.
//
// 1. Une cible d'audit en URL est en http ou https, et ne désigne pas une adresse de lien local
//    (169.254.0.0/16, fe80::/10) : c'est là que répondent les services de métadonnées des
//    hébergeurs, qu'aucun site à vérifier n'occupe. Les adresses locales et privées restent
//    permises : vérifier un serveur de développement est l'usage normal de l'outil.
// 2. Si la variable EU_WEB_COMPLIANCE_MCP_ROOT est définie, tout chemin reçu (dossier à vérifier,
//    projet, profil) doit se trouver dans ce dossier.

import dns from 'node:dns/promises';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';

export const ROOT_VARIABLE = 'EU_WEB_COMPLIANCE_MCP_ROOT';

export function isLinkLocal(address) {
  const text = String(address || '').toLowerCase().replace(/^\[|\]$/g, '');
  const mapped = text.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  const ip = mapped ? mapped[1] : text;
  if (net.isIPv4(ip)) return ip.startsWith('169.254.');
  if (net.isIPv6(ip)) return /^fe[89ab][0-9a-f]:/.test(ip);
  return false;
}

async function addressesOf(hostname, lookup) {
  if (net.isIP(hostname)) return [hostname];
  try {
    return (await lookup(hostname, { all: true })).map((entry) => entry.address);
  } catch {
    return []; // nom introuvable : le vérificateur dira lui-même que le site ne répond pas
  }
}

// Refuse une cible en URL qui n'est pas en http(s) ou qui mène à une adresse de lien local.
export async function assertUrlAllowed(target, lookup = dns.lookup) {
  let url;
  try {
    url = new URL(target);
  } catch {
    throw new Error(`target "${target}" is not a valid URL`);
  }
  if (!/^https?:$/.test(url.protocol)) throw new Error(`target "${target}" is refused: only http and https URLs can be audited`);
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = await addressesOf(hostname, lookup);
  if (addresses.some(isLinkLocal)) throw new Error(`target "${target}" is refused: link-local addresses (169.254.0.0/16, fe80::/10) are never audited`);
}

async function real(file) {
  try {
    return await fs.realpath(file);
  } catch {
    return path.resolve(file); // chemin absent : comparé tel quel, check-all dira qu'il n'existe pas
  }
}

// Refuse un chemin hors du dossier désigné par EU_WEB_COMPLIANCE_MCP_ROOT, quand elle est définie.
export async function assertInsideRoot(label, value, root = process.env[ROOT_VARIABLE]) {
  if (!root || !value) return;
  const relative = path.relative(await real(root), await real(String(value)));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} "${value}" is refused: it is outside the folder allowed by ${ROOT_VARIABLE}`);
  }
}
