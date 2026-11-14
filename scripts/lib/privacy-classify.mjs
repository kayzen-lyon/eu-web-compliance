// Classement de ce qu'une page dépose ou demande, en trois classes :
//   exempt-candidate  déclaré exempté par le site dans compliance/trackers.json ;
//   non-exempt        requête vers une catégorie de traceurs connue, identifiant écrit par un
//                     script tiers, cookie tiers, ou dépôt non déclaré comme exempté ;
//   to-review         indice seulement : le nom ou l'hôte évoque une finalité qui peut être
//                     exemptée, ou une catégorie dont la configuration décide.
// Le nom d'un traceur ne dit pas sa finalité : seule la déclaration du site fait passer un
// dépôt en « exempt-candidate », et cette déclaration reste à vérifier par une personne.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UsageError, readJson } from './cli.mjs';

export const HINTS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tracker-hints.json');
export const DECLARATION_PATH = path.join('compliance', 'trackers.json');
export const STORAGE_KINDS = ['cookie', 'localStorage', 'sessionStorage', 'indexedDB'];

const hostMatches = (host, pattern) => host === pattern || host.endsWith(`.${pattern}`);

export async function loadHints(file = HINTS_PATH) {
  const data = await readJson(file, 'tracker-hints');
  const compile = (list) => (list || []).map((entry) => ({ ...entry, regex: new RegExp(entry.pattern, 'i') }));
  return {
    hostCategories: data.host_categories || [],
    storagePatterns: compile(data.storage_name_patterns),
    exemptHints: compile(data.exempt_name_hints),
  };
}

function compileNameRule(entry, where) {
  const name = entry.name ?? entry.pattern;
  if (typeof name !== 'string' || !name) throw new UsageError(`${where} : « name » (chaîne) attendu`);
  const match = entry.match || (entry.pattern && !entry.name ? 'regex' : 'exact');
  let test;
  if (match === 'exact') test = (n) => n === name;
  else if (match === 'prefix') test = (n) => n.startsWith(name);
  else if (match === 'regex') {
    const regex = new RegExp(name);
    test = (n) => regex.test(n);
  } else throw new UsageError(`${where} : match doit valoir exact, prefix ou regex`);
  const kind = entry.kind || 'any';
  if (kind !== 'any' && !STORAGE_KINDS.includes(kind)) throw new UsageError(`${where} : kind inconnu « ${kind} »`);
  return { name, kind, test, purpose: entry.purpose || 'unspecified', justification: entry.justification || null };
}

// Déclaration du site. Format :
// { "exempt": [ { "name", "kind"?: "cookie|localStorage|sessionStorage|indexedDB|any",
//                 "match"?: "exact|prefix|regex", "purpose", "justification"? } ],
//   "third_parties": [ { "host", "purpose", "exempt": true|false } ] }
// Champs inconnus ignorés. Un fichier absent donne une déclaration vide.
export async function loadDeclaration(file) {
  if (!file) return { file: null, exempt: [], thirdParties: [] };
  const exists = await fs.stat(file).then(() => true, () => false);
  if (!exists) return { file: null, exempt: [], thirdParties: [] };
  const data = await readJson(file, 'déclaration des traceurs');
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new UsageError(`${file} : objet JSON attendu`);
  const exempt = (data.exempt || []).map((entry, i) => compileNameRule(entry, `${file}, exempt[${i}]`));
  const thirdParties = (data.third_parties || []).map((entry, i) => {
    if (!entry || typeof entry.host !== 'string') throw new UsageError(`${file}, third_parties[${i}] : « host » (chaîne) attendu`);
    return { host: entry.host.toLowerCase(), purpose: entry.purpose || 'unspecified', exempt: entry.exempt === true };
  });
  // Inventaire complet (forme suggérée par references/privacy/trackers.md) :
  // { "trackers": [ { "names": [...], "kind"?, "match"?, "host"?, "purpose", "exempt": true|false } ] }.
  // Seules les entrées « exempt: true » comptent ici ; les autres attendent le consentement.
  for (const [i, entry] of (Array.isArray(data.trackers) ? data.trackers : []).entries()) {
    if (!entry || entry.exempt !== true) continue;
    const names = [entry.names, entry.name].flat().filter((n) => typeof n === 'string');
    names.forEach((name, j) => exempt.push(compileNameRule({ ...entry, name, pattern: undefined }, `${file}, trackers[${i}].names[${j}]`)));
    if (typeof entry.host === 'string') thirdParties.push({ host: entry.host.toLowerCase(), purpose: entry.purpose || 'unspecified', exempt: true });
  }
  return { file, exempt, thirdParties };
}

function declaredStorage(declaration, item) {
  return declaration.exempt.find((rule) => (rule.kind === 'any' || rule.kind === item.kind) && rule.test(item.name));
}

// item : { kind, name, party: 'first-party'|'third-party', writer?: url du script qui l'a écrit }
export function classifyStorage(item, { hints, declaration, isFirstParty }) {
  const declared = declaredStorage(declaration, item);
  if (declared) {
    return { classification: 'exempt-candidate', reason: `Declared exempt in ${DECLARATION_PATH} (purpose: ${declared.purpose}).`, purpose: declared.purpose };
  }
  if (item.party === 'third-party') {
    return { classification: 'non-exempt', reason: 'Cookie set for a third-party domain: it lets that third party recognise the browser.' };
  }
  if (item.writer && !isFirstParty(item.writer)) {
    return { classification: 'non-exempt', reason: `Identifier written by a third-party script (${item.writer}).` };
  }
  const tracker = hints.storagePatterns.find((p) => p.regex.test(item.name));
  if (tracker) return { classification: tracker.verdict === 'non-exempt' ? 'non-exempt' : 'to-review', reason: tracker.why, category: tracker.category };
  const hint = hints.exemptHints.find((p) => p.regex.test(item.name));
  if (hint) {
    return { classification: 'to-review', reason: `${hint.why} Declare it in ${DECLARATION_PATH} once its purpose is confirmed.`, purpose: hint.purpose };
  }
  return { classification: 'non-exempt', reason: `Not declared as exempt in ${DECLARATION_PATH}, and its name does not suggest an exempt purpose.` };
}

// request : { url, host, kind }
export function classifyRequest(request, { hints, declaration }) {
  const declared = declaration.thirdParties.find((t) => hostMatches(request.host, t.host));
  if (declared && declared.exempt) {
    return { classification: 'exempt-candidate', reason: `Third party declared exempt in ${DECLARATION_PATH} (purpose: ${declared.purpose}).`, purpose: declared.purpose };
  }
  // Le site déclare lui-même ce tiers soumis à consentement : sa présence avant consentement est un défaut.
  if (declared) {
    return { classification: 'non-exempt', reason: `Third party declared in ${DECLARATION_PATH} as requiring consent (purpose: ${declared.purpose}), yet requested before consent.`, purpose: declared.purpose };
  }
  const category = hints.hostCategories.find((c) => (c.hosts || []).some((h) => hostMatches(request.host, h)));
  if (category) {
    return { classification: category.verdict === 'non-exempt' ? 'non-exempt' : 'to-review', reason: category.why, category: category.id };
  }
  return { classification: 'to-review', reason: 'Request to a third party: it transmits the visitor\'s IP address and the third party may read or write identifiers. Check its purpose, or declare it.' };
}
