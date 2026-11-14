// Tests du vérificateur de contenu scripts/check-content.mjs et de scripts/lib/content-rules.mjs.
// Lancement : node --test tests/content.test.mjs
//
// tests/fixtures/content/good : une page correcte par règle (aucun constat attendu) ;
// tests/fixtures/content/bad  : chaque règle en échec au moins une fois (expected-defects.json) ;
// tests/fixtures/content/bare : pas de compliance/site.json ;
// tests/fixtures/content/hidden-step, hidden-step-empty : étape finale et confirmation masquées au chargement.
// Les tests de bout en bout lancent un navigateur (Chromium de Playwright, sinon Edge ou Chrome) ;
// toute requête vers un hôte tiers est interrompue.

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyActionLabel, classifyWithdrawalEntry, classifyPreTicked, isConfirmshaming, parseCountdown, missingNoticeCategories,
  labelRequirement, normaliseSite, cite, legalNoticeLinkVerdict, REDUCTION, SCARCITY, AI_TERM,
} from '../scripts/lib/content-rules.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = path.join(ROOT, 'tests', 'fixtures', 'content');

function runChecker(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts', 'check-content.mjs'), ...args], { cwd: ROOT });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function runReport(args) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ewc-content-'));
  const out = path.join(dir, 'report.json');
  const md = path.join(dir, 'report.md');
  const result = await runChecker([...args, '--out', out, '--md', md]);
  assert.ok(result.code === 0 || result.code === 1, `check-content a échoué (code ${result.code}) : ${result.stderr}`);
  const report = JSON.parse(await fs.readFile(out, 'utf8'));
  const markdown = await fs.readFile(md, 'utf8');
  await fs.rm(dir, { recursive: true, force: true });
  return { ...result, report, markdown };
}

const pageOf = (report, name) => {
  const page = report.pages.find((p) => p.page === name);
  assert.ok(page, `page ${name} absente du rapport`);
  return page;
};
const rules = (page, verdict) => page.findings.filter((f) => !verdict || f.verdict === verdict).map((f) => f.rule);

// ---- Règles sans navigateur ----------------------------------------------------------------

describe('content-rules: libellés imposés par la loi', () => {
  test('bouton de commande : libellé de la loi, vague, autre', () => {
    assert.equal(classifyActionLabel('Commande avec obligation de paiement', 'order'), 'legal');
    assert.equal(classifyActionLabel('  Order with obligation to pay ', 'order'), 'legal');
    for (const vague of ['Valider', 'Valider ma commande', 'Continue', 'Confirm', 'Submit', 'Place the order', 'Commander']) {
      assert.equal(classifyActionLabel(vague, 'order'), 'vague', vague);
    }
    assert.equal(classifyActionLabel('Payer maintenant', 'order'), 'other');
    assert.equal(classifyActionLabel('Buy now', 'order'), 'other');
    assert.equal(classifyActionLabel('', 'order'), 'missing');
  });

  test('confirmation de rétractation', () => {
    assert.equal(classifyActionLabel('Confirmer la rétractation', 'confirm'), 'legal');
    assert.equal(classifyActionLabel('Confirm withdrawal', 'confirm'), 'legal');
    assert.equal(classifyActionLabel('Envoyer ma demande', 'confirm'), 'vague');
    assert.equal(classifyActionLabel('Je me rétracte', 'confirm'), 'other');
  });

  test('point d\'entrée de la rétractation', () => {
    assert.equal(classifyWithdrawalEntry('Renoncer au contrat ici'), 'legal');
    assert.equal(classifyWithdrawalEntry('Withdraw from contract here'), 'legal');
    assert.equal(classifyWithdrawalEntry('Retourner un article'), 'other');
    assert.equal(classifyWithdrawalEntry('Droit de rétractation'), 'other');
    assert.equal(classifyWithdrawalEntry('Mentions légales'), null);
  });
});

describe('content-rules: motifs de texte', () => {
  test('options cochées : payante, marketing, autre', () => {
    assert.deepEqual(classifyPreTicked('Assurance casse (+2,90 €)'), { kind: 'paid', verdict: 'NC' });
    assert.deepEqual(classifyPreTicked('Gift wrap'), { kind: 'paid', verdict: 'NC' });
    assert.equal(classifyPreTicked('Recevoir notre newsletter').kind, 'marketing');
    assert.equal(classifyPreTicked('Se souvenir de moi'), null);
  });

  test('options cochées : NC seulement sur le libellé propre de la case, avec un prix ou un supplément net', () => {
    // Indice faible (« express », « protection ») : à revoir.
    assert.deepEqual(classifyPreTicked('Livraison express'), { kind: 'paid', verdict: 'NT' });
    assert.deepEqual(classifyPreTicked('Protection des données activée'), { kind: 'paid', verdict: 'NT' });
    // Libellé deviné depuis le texte voisin : à revoir, même avec un prix.
    assert.deepEqual(classifyPreTicked('Panier : 49,90 € Se souvenir de moi', { ownLabel: false }), { kind: 'paid', verdict: 'NT' });
    // Consentement marketing coché : à revoir (il peut s'agir d'une opposition offerte à un client).
    assert.deepEqual(classifyPreTicked('Recevoir les offres de nos partenaires'), { kind: 'marketing', verdict: 'NT' });
  });

  test('lien vers la page d\'identification absent : NC seulement pour un site déclaré en anglais ou en français', () => {
    assert.equal(legalNoticeLinkVerdict(null, 'fr'), 'NT');
    assert.equal(legalNoticeLinkVerdict(normaliseSite({ language: 'fr' }), 'de'), 'NC');
    assert.equal(legalNoticeLinkVerdict(normaliseSite({}), 'en-GB'), 'NC');
    assert.equal(legalNoticeLinkVerdict(normaliseSite({ language: 'de' }), 'de'), 'NT');
    assert.equal(legalNoticeLinkVerdict(normaliseSite({}), null), 'NT');
  });

  test('culpabilisation, rareté, réduction, compte à rebours', () => {
    assert.ok(isConfirmshaming('Non merci, je préfère payer plein tarif'));
    assert.ok(isConfirmshaming("No thanks, I don't like saving money"));
    assert.ok(!isConfirmshaming('Non merci'));
    assert.ok(!isConfirmshaming('No thanks'));
    assert.ok(SCARCITY.test('Plus que 2 en stock !'));
    assert.ok(SCARCITY.test('Only 3 left in stock'));
    assert.ok(!SCARCITY.test('En stock'));
    assert.ok(REDUCTION.test('-30 %'));
    assert.ok(REDUCTION.test('Réduction de 25 %'));
    assert.ok(!REDUCTION.test('TVA à 20 %'));
    assert.equal(parseCountdown('09:59'), 599);
    assert.equal(parseCountdown('1:00:05'), 3605);
    assert.equal(parseCountdown('2 h 5 min'), 7500);
    assert.equal(parseCountdown('demain'), null);
  });

  test('« AI » et « IA » reconnus en capitales seulement', () => {
    assert.ok(AI_TERM.test('Assistant IA'));
    assert.ok(AI_TERM.test('an AI assistant'));
    assert.ok(AI_TERM.test("intelligence artificielle"));
    assert.ok(!AI_TERM.test('OpenAI'));
    assert.ok(!AI_TERM.test('via la boutique'));
  });

  test('catégories de la page d\'identification selon le pays déclaré', () => {
    const site = normaliseSite({ operator: { country: 'FR', registered: true } });
    const missing = missingNoticeCategories('Édité par Exemple SAS, 12 rue X, 00000 Ville. contact@exemple.test. RCS 1', site).map((c) => c.key);
    assert.deepEqual(missing, ['telephone', 'publication_director', 'host']);
    assert.deepEqual(missingNoticeCategories('Service provider: X Ltd, 4 Harbour Row. hello@x.example', normaliseSite({})).map((c) => c.key), []);
  });
});

describe('content-rules: compliance/site.json', () => {
  test('valeurs par défaut et champs inconnus ignorés', () => {
    const site = normaliseSite({ futur: 1, ai: { content: [{ page: 'a.html', selector: '#x', kind: 'text' }] } });
    assert.equal(site.ai.content[0].ai_use, 'generated');
    assert.deepEqual(site.ai.chat_widgets, []);
    assert.equal(site.online_platform, false);
  });

  test('erreur claire sur une déclaration mal formée', () => {
    assert.throws(() => normaliseSite([]), /objet JSON attendu/);
    assert.throws(() => normaliseSite({ operator: { country: 'France' } }), /operator.country/);
    assert.throws(() => normaliseSite({ pages: { panier: 'x.html' } }), /pages.panier/);
    assert.throws(() => normaliseSite({ ai: { content: [{ page: 'a.html', selector: '#x', kind: 'gif' }] } }), /kind/);
  });

  test('ce que l\'article 50(4) demande pour un contenu déclaré', () => {
    assert.equal(labelRequirement({ kind: 'image', ai_use: 'generated' }).need, 'label');
    assert.equal(labelRequirement({ kind: 'image', ai_use: 'modified', deep_fake: false }).need, 'none');
    assert.equal(labelRequirement({ kind: 'text', ai_use: 'generated', public_interest: true }).need, 'label');
    assert.equal(labelRequirement({ kind: 'text', ai_use: 'generated', editorial_review: true }).need, 'none');
    assert.equal(labelRequirement({ kind: 'text', ai_use: 'generated', public_interest: false }).need, 'none');
    assert.equal(labelRequirement({ kind: 'text', ai_use: 'translated' }).need, 'review');
  });

  test('sources : nationales quand le pays est la France, DSA pour une plateforme', () => {
    assert.match(cite('order-button', normaliseSite({ operator: { country: 'FR' } })).source, /\[C\. conso L\. 221-14\]/);
    assert.doesNotMatch(cite('order-button', normaliseSite({})).source, /C\. conso/);
    assert.match(cite('urgency', normaliseSite({ online_platform: true })).source, /\[DSA art\. 25\]/);
    assert.match(cite('withdrawal', normaliseSite({ operator: { country: 'FR' } })).source, /\[CRD 11a\] \[C\. conso L\. 221-21\]/);
  });
});

// ---- Vérificateur de bout en bout ----------------------------------------------------------

describe('check-content sur tests/fixtures/content/good', () => {
  let run;
  before(async () => { run = await runReport([path.join(FIXTURES, 'good')]); });

  test('aucun constat, code de sortie 0, limites et avertissement présents', () => {
    assert.equal(run.code, 0);
    assert.deepEqual(run.report.pages.flatMap((p) => p.findings.map((f) => `${p.page} ${f.rule}`)), []);
    assert.equal(run.report.site_declaration, 'tests/fixtures/content/good/compliance/site.json');
    assert.ok(run.report.limits.some((l) => /watermark/.test(l)));
    assert.match(run.markdown, /not legal advice/);
    assert.match(run.markdown, /## Limits/);
  });

  test('la fenêtre de discussion masquée est ouverte et son annonce lue', () => {
    const chat = pageOf(run.report, 'index.html').chats[0];
    assert.equal(chat.opened, true);
    assert.equal(chat.ai_visible, true);
    assert.match(chat.messages[0], /Assistant IA/);
  });
});

describe('check-content sur tests/fixtures/content/bad', () => {
  let run;
  before(async () => {
    run = await runReport([path.join(FIXTURES, 'bad'), '--expected', path.join(FIXTURES, 'bad', 'expected-defects.json')]);
  });

  test('chaque défaut attendu est trouvé, comme NC ou à revoir', () => {
    assert.equal(run.code, 1);
    const missed = run.report.expected.defects.filter((d) => !d.detected && !d.flagged_for_review).map((d) => d.id);
    assert.deepEqual(missed, []);
  });

  test('chaque constat cite une source entre crochets', () => {
    for (const page of run.report.pages) {
      for (const f of page.findings) assert.match(f.source, /^\[[^\]]+\]/, `${page.page} ${f.rule}`);
    }
  });

  test('fenêtre de discussion : NC sans annonce, à revoir si le libellé est ambigu ou l\'annonce ailleurs', () => {
    assert.ok(rules(pageOf(run.report, 'index.html'), 'NC').includes('ai-chat-no-disclosure'));
    const aide = pageOf(run.report, 'aide.html');
    assert.ok(!rules(aide, 'NC').some((r) => r.startsWith('ai-chat')));
    assert.ok(rules(aide, 'NT').includes('ai-chat-ambiguous-label'));
    assert.ok(rules(aide, 'NT').includes('ai-chat-disclosure-outside-widget'));
    assert.equal(aide.findings.find((f) => f.rule === 'ai-chat-ambiguous-label').detail, 'conseillère');
  });

  test('étiquettes de contenu IA : absente (NC), seulement dans alt ou title (NC), cachée ou tardive (à revoir)', () => {
    const index = pageOf(run.report, 'index.html');
    assert.match(index.findings.find((f) => f.rule === 'ai-content-label-missing').message, /alt text/);
    const article = pageOf(run.report, 'article.html');
    assert.match(article.findings.find((f) => f.rule === 'ai-content-label-missing').message, /tooltip/);
    assert.ok(rules(article, 'NT').includes('ai-content-label-late'));
    assert.ok(rules(article, 'NT').includes('ai-content-label-not-accessible'));
    assert.ok(rules(article, 'NT').includes('ai-content-review'));
  });

  test('consommation : bouton vague et confirmation vague (NC), autre formulation (à revoir)', () => {
    assert.ok(rules(pageOf(run.report, 'commande.html'), 'NC').includes('order-button-label'));
    const withdrawal = pageOf(run.report, 'retractation.html');
    assert.ok(rules(withdrawal, 'NC').includes('withdrawal-confirm-button'));
    assert.ok(rules(withdrawal, 'NT').includes('withdrawal-statement-extra-fields'));
    assert.ok(rules(pageOf(run.report, 'panier.html'), 'NT').includes('withdrawal-function-label'));
  });

  test('compte à rebours qui repart au rechargement : NC, avec les trois valeurs relevées', () => {
    const timer = pageOf(run.report, 'index.html').timers[0];
    assert.equal(timer.ticking, true);
    assert.equal(timer.resets, true);
  });

  test('sources : droit français cité pour un exploitant établi en France', () => {
    const f = pageOf(run.report, 'commande.html').findings.find((x) => x.rule === 'order-button-label');
    assert.equal(f.source, '[CRD art. 8(2)] [C. conso L. 221-14]');
    assert.deepEqual(f.refs, ['consumer-rights-directive', 'fr-code-consommation']);
  });
});

describe('check-content : étape finale masquée au chargement (panier vide)', () => {
  test('libellés de la loi lus dans le DOM malgré le masquage : aucun constat', async () => {
    const run = await runReport([path.join(FIXTURES, 'hidden-step')]);
    assert.equal(run.code, 0);
    assert.deepEqual(run.report.pages.flatMap((p) => p.findings.map((f) => `${p.page} ${f.rule}`)), []);
  });

  test('libellés vides au chargement : à vérifier à la main (NT), jamais de NC', async () => {
    const run = await runReport([path.join(FIXTURES, 'hidden-step-empty')]);
    assert.equal(run.code, 0);
    assert.deepEqual(run.report.pages.flatMap((p) => rules(p, 'NC')), []);
    const order = pageOf(run.report, 'commande.html').findings.find((f) => f.rule === 'order-button-not-reachable');
    assert.equal(order.verdict, 'NT');
    assert.match(order.message, /could not reach the final order step/);
    assert.ok(!rules(pageOf(run.report, 'commande.html')).includes('order-button-label'));
    assert.ok(rules(pageOf(run.report, 'retractation.html'), 'NT').includes('withdrawal-confirm-not-reachable'));
  });
});

describe('check-content sans compliance/site.json', () => {
  test('les règles qui en dépendent sont signalées à revoir, sans NC', async () => {
    const run = await runReport([path.join(FIXTURES, 'bare')]);
    assert.equal(run.code, 0);
    const page = pageOf(run.report, 'index.html');
    assert.deepEqual(rules(page, 'NC'), []);
    assert.ok(rules(page, 'NT').includes('site-declaration-missing'));
    assert.ok(rules(page, 'NT').includes('legal-notice-link-missing'));
  });

  test('--site introuvable : erreur d\'usage (code 2)', async () => {
    const result = await runChecker([path.join(FIXTURES, 'bare'), '--site', path.join(FIXTURES, 'absent.json')]);
    assert.equal(result.code, 2);
    assert.match(result.stderr, /introuvable/);
  });
});
