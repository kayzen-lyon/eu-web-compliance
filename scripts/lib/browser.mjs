// Lancement du navigateur et interception réseau, partagés par les vérificateurs.
//
// Règles de sûreté :
//   - toute requête vers un hôte tiers est relevée puis interrompue, sauf si l'appelant demande
//     explicitement le contraire (allowNetwork). Les tests ne touchent ainsi jamais le réseau ;
//   - toute requête qui pourrait modifier des données (méthode autre que GET, HEAD ou OPTIONS :
//     envoi de formulaire, POST d'un script) est interrompue, même vers le site vérifié et même
//     avec allowNetwork : un vérificateur ne doit jamais rien envoyer à la place d'un visiteur.
//
// Navigateur : variable d'environnement EWC_BROWSER_PATH (exécutable d'un navigateur Chromium),
// sinon Chromium de Playwright, sinon Edge, sinon Chrome.

import { chromium } from 'playwright';

export const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export async function launchBrowser() {
  const custom = process.env.EWC_BROWSER_PATH;
  const attempts = custom ? [[`EWC_BROWSER_PATH (${custom})`, { executablePath: custom }]]
    : [['playwright-chromium', {}], ['msedge', { channel: 'msedge' }], ['chrome', { channel: 'chrome' }]];
  const errors = [];
  for (const [name, options] of attempts) {
    try {
      return { browser: await chromium.launch(options), browserName: name };
    } catch (error) {
      errors.push(`${name}: ${String(error.message || error).split('\n')[0]}`);
    }
  }
  throw new Error(`aucun navigateur utilisable. Installer Chromium avec « npx playwright install chromium ».\n${errors.join('\n')}`);
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

// « Site » d'un nom d'hôte : les deux derniers libellés (approximation sans liste des suffixes
// publics : `example.co.uk` et `other.co.uk` seraient vus comme le même site).
export function siteOf(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host || IPV4.test(host) || host.includes(':') || !host.includes('.')) return host;
  return host.split('.').slice(-2).join('.');
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

// Fabrique un prédicat « cet hôte est-il du même site que la page ? ».
export function firstPartyPredicate(pageUrl) {
  const site = siteOf(hostOf(pageUrl));
  return (hostOrUrl) => {
    const host = /^[a-z]+:\/\//i.test(hostOrUrl) ? hostOf(hostOrUrl) : String(hostOrUrl).replace(/^\./, '').toLowerCase();
    return siteOf(host) === site;
  };
}

// Statut HTTP d'une adresse, en ne suivant une redirection que si elle reste sur le même site :
// une redirection vers un hôte tiers n'est jamais suivie (aucune requête ne part vers lui) et son
// statut 3xx est rendu tel quel. `get(url)` rend { status, location } sans suivre de redirection.
export async function statusWithinSite(get, url, maxRedirects = 5) {
  const isFirstParty = firstPartyPredicate(url);
  let current = url;
  for (let hop = 0; ; hop += 1) {
    const { status, location } = await get(current);
    if (status < 300 || status >= 400 || !location || hop >= maxRedirects) return status;
    let next;
    try {
      next = new URL(location, current);
    } catch {
      return status;
    }
    if (!/^https?:$/.test(next.protocol) || !isFirstParty(next.href)) return status;
    current = next.href;
  }
}

// Type de requête lisible dans les rapports.
export function requestKind(request, page) {
  const type = request.resourceType();
  if (type === 'document') return page && request.frame() !== page.mainFrame() ? 'iframe' : 'document';
  if (type === 'ping') return 'beacon';
  if (type === 'xhr' || type === 'fetch') return 'xhr/fetch';
  if (type === 'image') return 'image/pixel';
  return type;
}

// Intercepte toutes les requêtes d'un contexte. `onThirdParty(entry)` reçoit
// { url, host, kind, method } pour chaque requête tierce, qui est ensuite interrompue
// sauf si allowNetwork est vrai. Les WebSockets tiers sont relevés et fermés. Une requête
// d'une autre méthode que GET, HEAD ou OPTIONS est toujours interrompue ; `onBlockedWrite(entry)`
// la reçoit (une requête tierce passe aussi par onThirdParty).
export async function routeThirdParty(context, { pageUrl, allowNetwork = false, onThirdParty, onBlockedWrite, getPage }) {
  const isFirstParty = firstPartyPredicate(pageUrl);
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method().toUpperCase();
    const web = /^https?:/i.test(url);
    const entry = () => ({ url, host: hostOf(url), kind: requestKind(request, getPage ? getPage() : null), method });
    if (web && !isFirstParty(url)) onThirdParty(entry());
    if (web && !SAFE_METHODS.has(method)) {
      if (onBlockedWrite) onBlockedWrite(entry());
      await route.abort('blockedbyclient').catch(() => {});
      return;
    }
    if (!web || isFirstParty(url)) {
      await route.continue().catch(() => {});
      return;
    }
    if (allowNetwork) await route.continue().catch(() => {});
    else await route.abort('blockedbyclient').catch(() => {});
  });
  if (typeof context.routeWebSocket === 'function') {
    await context.routeWebSocket(/.*/, (ws) => {
      const url = ws.url();
      if (isFirstParty(url.replace(/^ws/i, 'http'))) {
        ws.connectToServer();
        return;
      }
      onThirdParty({ url, host: hostOf(url.replace(/^ws/i, 'http')), kind: 'websocket', method: 'GET' });
      if (allowNetwork) ws.connectToServer();
      else ws.close();
    });
  }
  return isFirstParty;
}

// Raison pour laquelle une page chargée ne peut pas être analysée (pas de réponse, statut
// HTTP d'erreur), ou null. Une page d'erreur (403 d'un pare-feu, 404, 500) ne doit jamais
// donner un résultat « sans constat ».
export function loadProblem(response) {
  if (!response) return 'no response';
  const status = response.status();
  return status >= 400 ? `HTTP ${status}` : null;
}

// Nouveau contexte sans état : pas de cookie, pas de stockage, service workers bloqués
// (ils pourraient contourner l'interception).
export async function freshContext(browser, options = {}) {
  return browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', ...options });
}
