// Lancement du navigateur et interception réseau, partagés par les vérificateurs.
//
// Règle de sûreté : toute requête vers un hôte tiers est relevée puis interrompue, sauf
// si l'appelant demande explicitement le contraire (allowNetwork). Les tests ne
// touchent ainsi jamais le réseau.

import { chromium } from 'playwright';

// Chromium de Playwright d'abord ; à défaut, un navigateur Chromium déjà installé (Edge, Chrome).
export async function launchBrowser() {
  const attempts = [['playwright-chromium', {}], ['msedge', { channel: 'msedge' }], ['chrome', { channel: 'chrome' }]];
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
// sauf si allowNetwork est vrai. Les WebSockets tiers sont relevés et fermés.
export async function routeThirdParty(context, { pageUrl, allowNetwork = false, onThirdParty, getPage }) {
  const isFirstParty = firstPartyPredicate(pageUrl);
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    if (!/^https?:/i.test(url) || isFirstParty(url)) {
      await route.continue().catch(() => {});
      return;
    }
    onThirdParty({ url, host: hostOf(url), kind: requestKind(request, getPage ? getPage() : null), method: request.method() });
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

// Nouveau contexte sans état : pas de cookie, pas de stockage, service workers bloqués
// (ils pourraient contourner l'interception).
export async function freshContext(browser, options = {}) {
  return browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', ...options });
}
