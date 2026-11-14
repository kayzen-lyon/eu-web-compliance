// Assemblage du rapport unifié (schemas/report.schema.json) à partir des sorties déjà produites :
// matrice d'applicabilité, classement AI Act, rapports bruts des vérificateurs, index des pages du
// site et rapport précédent. Aucune entrée-sortie ici : la fonction est testable sans navigateur.

import { DOMAINS, CHECKERS, normaliseReport, limitsOf, isGroupable } from './report-normalise.mjs';
import { matrixSummary, parseTestingByHand, uncoveredObligations, documentsToPublish } from './report-matrix.mjs';

export const DISCLAIMER = 'This report was produced by an AI tool (the eu-web-compliance skill) running automated checks. '
  + 'It is not an accessibility audit, not a security audit and not legal advice. '
  + 'Automated checks find only part of the problems: an absence of findings does not mean that the site, or any part of it, conforms. '
  + 'This report never describes the site as a whole as "conformant". Have the results reviewed by qualified people before relying on them.';

export const GENERATOR = {
  name: 'eu-web-compliance',
  author: 'Tarek BELHADJ - Kayzen',
  homepage: 'https://www.kayzen-lyon.com',
  related: 'https://nexus.kayzen-lyon.com',
};

const count = (list) => ({ non_conformities: list.filter((f) => f.verdict === 'NC').length, to_review: list.filter((f) => f.verdict === 'NT').length });

export function groupFixes(findings) {
  const groups = new Map();
  for (const f of findings) {
    if (!isGroupable(f.element)) continue;
    // Un sélecteur positionnel ne désigne pas le même élément d'une page à l'autre : il n'est
    // regroupé que dans sa page. Les autres (id, en-tête, cookie, hôte) le sont sur tout le site.
    const key = /:nth-(child|of-type)/.test(f.element) ? `${f.page}\u0000${f.element}` : f.element;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }
  const out = [];
  for (const list of groups.values()) {
    const { element } = list[0];
    if (list.length < 2) continue;
    const uniq = (values) => [...new Set(values.filter(Boolean))].sort();
    out.push({ element, pages: uniq(list.map((f) => f.page)), rules: uniq(list.map((f) => f.rule)),
      domains: uniq(list.map((f) => f.domain)), finding_ids: list.map((f) => f.id), fix_refs: uniq(list.map((f) => f.fix_ref)) });
  }
  return out.sort((a, b) => b.finding_ids.length - a.finding_ids.length || a.element.localeCompare(b.element));
}

// Comparaison avec le rapport précédent. Un constat disparu ne compte comme corrigé que si son
// vérificateur a tourné les deux fois.
export function diffReports(previous, findings, checkerStatus) {
  if (!previous || !Array.isArray(previous.findings)) return null;
  const ranBefore = new Set((previous.checkers || []).filter((c) => c.status === 'ran').map((c) => c.name));
  const now = new Set(findings.map((f) => f.id));
  const before = new Set(previous.findings.map((f) => f.id));
  const fixed = previous.findings.filter((f) => !now.has(f.id) && ranBefore.has(f.checker) && checkerStatus[f.checker] === 'ran').map((f) => f.id);
  return {
    previous: previous.file_name || 'previous report',
    previous_generated: previous.generated || null,
    fixed: fixed.sort(),
    new: findings.filter((f) => !before.has(f.id)).map((f) => f.id).sort(),
    unchanged: findings.filter((f) => before.has(f.id)).map((f) => f.id).sort(),
  };
}

function nextActions({ profile, checkers, summary, applicability, documents, manualChecks }) {
  const actions = [];
  if (!profile.found) {
    actions.push(`Create the project profile ${profile.path} (Qualify mode: answer the scoping questions). Until then every obligation is "to confirm" and handled as if it applied.`);
  }
  for (const c of checkers.filter((x) => x.status === 'failed')) actions.push(`Make the ${c.name} checker run (it failed: ${String(c.error || 'no report').split('\n')[0]}), then run check-all again.`);
  if (summary.non_conformities) actions.push(`Fix the ${summary.non_conformities} non-conformities, blocking ones first, then the grouped fixes.`);
  if (applicability && applicability.to_confirm.length) actions.push(`Confirm the answers behind the ${applicability.to_confirm.length} obligations marked "to confirm".`);
  const missing = documents.filter((d) => d.status === 'not-found');
  if (missing.length) actions.push(`Publish the missing documents from their templates: ${missing.map((d) => d.title).join('; ')}.`);
  if (summary.to_review) actions.push(`Have a person review the ${summary.to_review} items marked "to review".`);
  if (manualChecks.length) actions.push(`Have a person perform the ${manualChecks.length} checks listed under "To check by a person".`);
  if (applicability && applicability.beyond_the_skill.length) actions.push('Consult a qualified professional for the cases listed under "Beyond the skill".');
  return actions;
}

// input : { target, language, generated, profile, matrix, matrixError, aiAct, checkerRuns, siteIndex,
//           testingByHandText, previous, ctx }
export function buildReport(input) {
  const used = new Set();
  const runs = CHECKERS.map((name) => input.checkerRuns.find((r) => r.name === name) || { name, status: 'skipped' });
  const checkerStatus = Object.fromEntries(runs.map((r) => [r.name, r.status]));
  const findings = runs.filter((r) => r.status === 'ran').flatMap((r) => normaliseReport(r.name, r.raw, input.ctx, used));
  const notTested = runs.filter((r) => r.status === 'ran').flatMap((r) => limitsOf(r.name, r.raw));
  const seen = new Set();
  const uniqueNotTested = notTested.filter((l) => (seen.has(l.text) ? false : seen.add(l.text)));

  const applicability = input.matrix ? matrixSummary(input.matrix) : null;
  const manualChecks = [...parseTestingByHand(input.testingByHandText), ...uncoveredObligations(input.matrix, checkerStatus)];
  const documents = documentsToPublish(input.matrix, input.siteIndex);

  const total = count(findings);
  const failed = runs.some((r) => r.status === 'failed');
  const summary = {
    ...total,
    by_domain: Object.fromEntries(DOMAINS.map((d) => [d, count(findings.filter((f) => f.domain === d))])),
    exit_code: failed ? 2 : (total.non_conformities ? 1 : 0),
  };
  const checkers = runs.map((r) => ({
    name: r.name, status: r.status, exit_code: Number.isInteger(r.exit_code) ? r.exit_code : null,
    pages: r.raw && Array.isArray(r.raw.pages) ? r.raw.pages.length : 0,
    summary: r.status === 'ran' ? count(findings.filter((f) => f.checker === r.name)) : { non_conformities: 0, to_review: 0 },
    browser: (r.raw && r.raw.browser) || null, raw_report: r.raw_report || null, error: r.error || null,
    expected: (r.raw && r.raw.expected) || null,
  }));
  const report = {
    schema_version: 1,
    tool: 'eu-web-compliance check-all',
    generator: { ...GENERATOR },
    disclaimer: DISCLAIMER,
    generated: input.generated || new Date().toISOString(),
    target: String(input.target),
    language: input.language === 'fr' ? 'fr' : 'en',
    profile: { ...input.profile },
    summary,
    applicability: applicability || (input.matrixError ? { counts: {}, applies: [], to_confirm: [], does_not_apply: [],
      assumptions: {}, country_coverage: [], beyond_the_skill: [], error: String(input.matrixError) } : null),
    ai_act: input.aiAct || null,
    checkers,
    findings,
    grouped_fixes: groupFixes(findings),
    not_tested: uniqueNotTested,
    manual_checks: manualChecks,
    documents,
    changes: diffReports(input.previous, findings, checkerStatus),
    next_actions: [],
  };
  report.next_actions = nextActions({ profile: report.profile, checkers, summary, applicability: report.applicability, documents, manualChecks });
  return report;
}
