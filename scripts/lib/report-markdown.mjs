// Rapport unifié en Markdown, à partir de l'objet produit par report-build.mjs.
// Une seule mise en page ; seuls les libellés changent selon la langue (TEXT.en, TEXT.fr).
// Les messages des constats, les procédures et les titres d'obligations restent dans la langue
// des vérificateurs et des fichiers de référence (anglais).

const TEXT = {
  en: {
    title: 'Compliance report',
    disclaimer: (d) => d,
    generated: 'Generated', target: 'Target', profile: 'Profile', noProfile: 'not found: the matrix was computed on an empty profile, so every obligation is "to confirm"',
    checkers: 'Checkers', status: { ran: 'ran', failed: 'failed', skipped: 'not run (--only)', unavailable: 'not available' },
    matrix: '1. Applicability', matrixMissing: 'The applicability matrix could not be computed', counts: (c) => `${c.applies || 0} apply, ${c['to-confirm'] || 0} to confirm, ${c['does-not-apply'] || 0} do not apply.`,
    applies: 'What applies', toConfirm: 'To confirm (handled as applying until confirmed)', notApply: 'Does not apply',
    assumptions: 'Assumptions', assumed: 'Assumed answer', missing: 'Missing answer (protective reading used)',
    countries: 'Countries whose national rules are not covered', beyond: 'Beyond the skill (needs a professional)',
    aiAct: 'AI Act classification (Article 50)', aiApplies: 'applies', aiConfirm: 'to confirm', aiStop: 'STOP',
    domainCol: 'Domain', obligation: 'Obligation', level: 'Level', rules: 'Reference', why: 'Why',
    findings: '2. Findings by domain', nc: 'non-conformities', nt: 'to review',
    domains: { accessibility: 'Accessibility', privacy: 'Data protection', ai: 'AI Act', security: 'Security', consumer: 'Consumer and information law' },
    none: 'None found by the checkers that ran. This does not mean that this domain conforms.',
    notRun: 'No checker covering this domain ran.',
    ncHead: 'Non-conformities', ntHead: 'To review',
    page: 'Page', element: 'Element', rule: 'Rule', source: 'Source', impact: 'Impact', fix: 'How to fix', message: 'Finding',
    skillFile: 'skill file', entry: 'entry',
    grouped: '3. Grouped fixes', groupedIntro: 'Several findings point to the same element: fixing it once may resolve all of them.',
    groupedNone: 'No element is concerned by more than one finding.', findingsCol: 'Findings', pages: 'Pages',
    notTested: '4. Not tested, and to check by a person', limits: 'Not tested by the checkers',
    person: 'To check by a person', check: 'Check', procedure: 'Procedure', reference: 'Reference',
    origins: { 'testing-by-hand': 'Accessibility checks that need a person', matrix: 'Obligations that apply and that no checker covers', 'checker-not-run': 'Checkers that did not run' },
    documents: '5. Documents to publish', document: 'Document', template: 'Template', onSite: 'Page on the site',
    docStatus: { found: 'seems to exist', 'not-found': 'not found', 'not-checked': 'not checked (remote target)' },
    documentsNone: 'The matrix requires no document from the skill templates.',
    changes: '6. What changed since the previous report', previous: 'Previous report', fixed: 'Fixed', newF: 'New', unchanged: 'Unchanged',
    actions: 'Next actions', expected: 'Expected defects (--expected-dir) reported as non-conformity',
  },
  fr: {
    title: 'Rapport de conformité',
    disclaimer: () => 'Ce rapport a été produit par un outil d\'IA (le skill eu-web-compliance) à partir de contrôles automatiques. '
      + 'Ce n\'est ni un audit d\'accessibilité, ni un audit de sécurité, ni un avis juridique. '
      + 'Les contrôles automatiques ne trouvent qu\'une partie des problèmes : l\'absence de constat ne signifie pas que le site, ou une partie du site, est conforme. '
      + 'Ce rapport ne qualifie jamais le site dans son ensemble de « conforme ». Faites relire les résultats par des personnes qualifiées avant de vous y fier.',
    generated: 'Produit le', target: 'Cible', profile: 'Profil', noProfile: 'introuvable : la matrice a été calculée sur un profil vide, toutes les obligations sont « à confirmer »',
    checkers: 'Vérificateurs', status: { ran: 'lancé', failed: 'en échec', skipped: 'non lancé (--only)', unavailable: 'absent' },
    matrix: '1. Applicabilité', matrixMissing: 'La matrice d\'applicabilité n\'a pas pu être calculée', counts: (c) => `${c.applies || 0} s'appliquent, ${c['to-confirm'] || 0} à confirmer, ${c['does-not-apply'] || 0} ne s'appliquent pas.`,
    applies: 'Ce qui s\'applique', toConfirm: 'À confirmer (traité comme applicable en attendant)', notApply: 'Ne s\'applique pas',
    assumptions: 'Hypothèses', assumed: 'Réponse supposée', missing: 'Réponse manquante (lecture la plus protectrice retenue)',
    countries: 'Pays dont les règles nationales ne sont pas couvertes', beyond: 'Hors du skill (demande un professionnel)',
    aiAct: 'Classement AI Act (article 50)', aiApplies: 's\'applique', aiConfirm: 'à confirmer', aiStop: 'ARRÊT',
    domainCol: 'Domaine', obligation: 'Obligation', level: 'Niveau', rules: 'Référence', why: 'Pourquoi',
    findings: '2. Constats par domaine', nc: 'non-conformités', nt: 'à revoir',
    domains: { accessibility: 'Accessibilité', privacy: 'Protection des données', ai: 'AI Act', security: 'Sécurité', consumer: 'Consommation et information' },
    none: 'Aucun constat des vérificateurs lancés. Cela ne signifie pas que ce domaine est conforme.',
    notRun: 'Aucun vérificateur de ce domaine n\'a été lancé.',
    ncHead: 'Non-conformités', ntHead: 'À revoir',
    page: 'Page', element: 'Élément', rule: 'Règle', source: 'Source', impact: 'Impact', fix: 'Correction', message: 'Constat',
    skillFile: 'fichier du skill', entry: 'entrée',
    grouped: '3. Corrections groupées', groupedIntro: 'Plusieurs constats portent sur le même élément : le corriger une fois peut tous les résoudre.',
    groupedNone: 'Aucun élément ne porte plus d\'un constat.', findingsCol: 'Constats', pages: 'Pages',
    notTested: '4. Non testé, et à vérifier par une personne', limits: 'Non testé par les vérificateurs',
    person: 'À vérifier par une personne', check: 'Vérification', procedure: 'Marche à suivre', reference: 'Référence',
    origins: { 'testing-by-hand': 'Vérifications d\'accessibilité qui demandent une personne', matrix: 'Obligations applicables qu\'aucun vérificateur ne couvre', 'checker-not-run': 'Vérificateurs non lancés' },
    documents: '5. Documents à publier', document: 'Document', template: 'Modèle', onSite: 'Page sur le site',
    docStatus: { found: 'semble exister', 'not-found': 'introuvable', 'not-checked': 'non recherchée (cible distante)' },
    documentsNone: 'La matrice ne demande aucun document des modèles du skill.',
    changes: '6. Ce qui a changé depuis le rapport précédent', previous: 'Rapport précédent', fixed: 'Corrigés', newF: 'Nouveaux', unchanged: 'Inchangés',
    actions: 'Prochaines actions', expected: 'Défauts attendus (--expected-dir) relevés comme non-conformité',
  },
};

const DOMAIN_CHECKERS = { accessibility: ['a11y'], privacy: ['privacy'], ai: ['content'], security: ['security'], consumer: ['content'] };

export const FOOTER = 'Report produced by eu-web-compliance, an open-source skill by Tarek BELHADJ — Kayzen (https://www.kayzen-lyon.com), author of Nexus (https://nexus.kayzen-lyon.com).';

const cell = (v) => String(v === undefined || v === null ? '' : v).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const code = (v) => (v ? `\`${String(v).replace(/`/g, "'")}\`` : '');

function fixText(f, t) {
  if (!f.fix_ref) return f.help_url ? f.help_url : '';
  return `${t.skillFile} ${code(f.fix_ref)}${f.fix_entry ? `, ${t.entry} ${f.fix_entry}` : ''}`;
}

function headerLines(r, t) {
  const lines = [`# ${t.title}`, '', `> ${t.disclaimer(r.disclaimer)}`, '',
    `- ${t.generated}: ${r.generated}`, `- ${t.target}: ${code(r.target)}`,
    `- ${t.profile}: ${code(r.profile.path)}${r.profile.found ? '' : ` (${t.noProfile})`}`,
    `- ${t.checkers}: ${r.checkers.map((c) => `${c.name} ${t.status[c.status]}${c.status === 'ran' ? ` (${c.pages} pages)` : ''}`).join(', ')}`,
    `- ${t.findings.replace(/^\d+\.\s*/, '')}: ${r.summary.non_conformities} ${t.nc}, ${r.summary.to_review} ${t.nt}`];
  for (const c of r.checkers.filter((x) => x.expected)) {
    lines.push(`- ${t.expected} (${c.name}): ${c.expected.detected}/${c.expected.total}`);
  }
  return [...lines, ''];
}

function matrixLines(r, t) {
  const a = r.applicability;
  const lines = [`## ${t.matrix}`, ''];
  if (!a || a.error) return [...lines, `${t.matrixMissing}${a && a.error ? `: ${a.error}` : '.'}`, ''];
  if (!r.profile.found) lines.push(`**${t.profile}: ${t.noProfile}.**`, '');
  lines.push(t.counts(a.counts), '');
  if (a.applies.length) {
    lines.push(`### ${t.applies}`, '', `| ${t.domainCol} | ${t.obligation} | ${t.level} | ${t.rules} |`, '|---|---|---|---|');
    for (const o of a.applies) lines.push(`| ${cell(t.domains[o.domain] || o.domain)} | ${cell(o.title)} | ${cell(o.level)} | ${o.rules_file ? code(o.rules_file) : ''} |`);
    lines.push('');
  }
  if (a.to_confirm.length) {
    lines.push(`### ${t.toConfirm}`, '', `| ${t.domainCol} | ${t.obligation} | ${t.why} |`, '|---|---|---|');
    for (const o of a.to_confirm) lines.push(`| ${cell(t.domains[o.domain] || o.domain)} | ${cell(o.title)} | ${cell((o.reasons || []).join('; '))} |`);
    lines.push('');
  }
  if (a.does_not_apply.length) lines.push(`### ${t.notApply}`, '', a.does_not_apply.map((o) => `${o.title}${o.reasons ? ` (${o.reasons.join('; ')})` : ''}`).join('; '), '');
  const assumed = (a.assumptions.assumed_answers || []);
  const missing = (a.assumptions.missing_answers || []);
  if (assumed.length || missing.length) {
    lines.push(`### ${t.assumptions}`, '');
    for (const x of assumed) lines.push(`- ${t.assumed}: ${code(x.field)} = ${code(JSON.stringify(x.value))}${x.note ? ` (${x.note})` : ''}`);
    for (const x of missing) lines.push(`- ${t.missing}: ${code(x.field)}`);
    lines.push('');
  }
  if ((a.country_coverage || []).length) lines.push(`### ${t.countries}`, '', ...a.country_coverage.map((c) => `- ${c.country}: ${c.text}`), '');
  if ((a.beyond_the_skill || []).length) lines.push(`### ${t.beyond}`, '', ...a.beyond_the_skill.map((b) => `- ${b.title}: ${b.what_to_do || ''}`), '');
  if (r.ai_act && Array.isArray(r.ai_act.features)) {
    lines.push(`### ${t.aiAct}`, '');
    const parts = [...r.ai_act.features.map((f) => [f.id, f]), ['site', r.ai_act.site || {}]];
    for (const [id, f] of parts) {
      const list = [...(f.stop || []).map((x) => `${t.aiStop} ${x.provision || x.reason || ''}`), ...(f.applies || []).map((x) => `${x.provision} ${t.aiApplies}`),
        ...(f.to_confirm || []).map((x) => `${x.provision} ${t.aiConfirm}`)];
      if (list.length) lines.push(`- ${code(id)}: ${list.join('; ')}`);
    }
    lines.push('');
  }
  return lines;
}

function findingLine(f, t) {
  const bits = [`**${f.severity}** ${code(f.rule)}`];
  if (f.element) bits.push(`${t.element} ${code(f.element)}`);
  let line = `- ${bits.join(' · ')}: ${f.message}`;
  if (f.sources.length) line += ` ${t.source}: ${f.sources.join('; ')}.`;
  if (f.impact) line += ` ${t.impact}: ${f.impact}`;
  const fix = fixText(f, t);
  if (fix) line += ` ${t.fix}: ${fix}.`;
  return line;
}

function byPage(list) {
  const pages = new Map();
  for (const f of list) {
    if (!pages.has(f.page)) pages.set(f.page, []);
    pages.get(f.page).push(f);
  }
  return pages;
}

const SEVERITY_ORDER = { blocking: 0, major: 1, minor: 2 };

function domainLines(r, t) {
  const lines = [`## ${t.findings}`, ''];
  for (const domain of Object.keys(t.domains)) {
    const c = r.summary.by_domain[domain];
    lines.push(`### ${t.domains[domain]}: ${c.non_conformities} ${t.nc}, ${c.to_review} ${t.nt}`, '');
    const ran = r.checkers.some((x) => DOMAIN_CHECKERS[domain].includes(x.name) && x.status === 'ran');
    const list = r.findings.filter((f) => f.domain === domain);
    if (!ran) { lines.push(t.notRun, ''); continue; }
    if (!list.length) { lines.push(t.none, ''); continue; }
    const nc = list.filter((f) => f.verdict === 'NC').sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    if (nc.length) {
      lines.push(`#### ${t.ncHead}`, '');
      for (const [page, items] of byPage(nc)) lines.push(`${t.page} ${code(page)}`, '', ...items.map((f) => findingLine(f, t)), '');
    }
    const nt = list.filter((f) => f.verdict === 'NT');
    if (nt.length) {
      lines.push(`#### ${t.ntHead}`, '', `| ${t.page} | ${t.rule} | ${t.element} | ${t.message} | ${t.fix} |`, '|---|---|---|---|---|');
      for (const f of nt) lines.push(`| ${cell(f.page)} | ${cell(f.rule)} | ${cell(f.element)} | ${cell(f.message)} | ${cell(fixText(f, t))} |`);
      lines.push('');
    }
  }
  return lines;
}

function groupedLines(r, t) {
  const lines = [`## ${t.grouped}`, ''];
  if (!r.grouped_fixes.length) return [...lines, t.groupedNone, ''];
  lines.push(t.groupedIntro, '', `| ${t.element} | ${t.pages} | ${t.rule} | ${t.findingsCol} | ${t.fix} |`, '|---|---|---|---|---|');
  for (const g of r.grouped_fixes) {
    lines.push(`| ${code(cell(g.element))} | ${cell(g.pages.join(', '))} | ${cell(g.rules.join(', '))} | ${g.finding_ids.length} | ${cell(g.fix_refs.join(', '))} |`);
  }
  return [...lines, ''];
}

function personLines(r, t) {
  const lines = [`## ${t.notTested}`, '', `### ${t.limits}`, ''];
  for (const l of r.not_tested) lines.push(`- ${l.checker}: ${l.wcag ? `WCAG ${l.wcag}: ` : ''}${l.text}`);
  lines.push('', `### ${t.person}`, '');
  for (const origin of ['checker-not-run', 'testing-by-hand', 'matrix']) {
    const items = r.manual_checks.filter((m) => m.origin === origin);
    if (!items.length) continue;
    lines.push(`#### ${t.origins[origin]}`, '', `| ${t.check} | ${t.procedure} | ${t.reference} |`, '|---|---|---|');
    for (const m of items) lines.push(`| ${cell(m.title)} | ${cell(m.procedure)} | ${m.reference ? code(m.reference) : ''} |`);
    lines.push('');
  }
  return lines;
}

function documentLines(r, t) {
  const lines = [`## ${t.documents}`, ''];
  if (!r.documents.length) return [...lines, t.documentsNone, ''];
  lines.push(`| ${t.document} | ${t.level} | ${t.template} | ${t.onSite} |`, '|---|---|---|---|');
  for (const d of r.documents) {
    lines.push(`| ${cell(d.title)} | ${cell(d.level)} | ${code(d.template)} | ${t.docStatus[d.status]}${d.pages.length ? `: ${cell(d.pages.join(', '))}` : ''} |`);
  }
  return [...lines, ''];
}

function changeLines(r, t) {
  const c = r.changes;
  if (!c) return [];
  const list = (ids) => (ids.length ? ids.map((id) => `  - ${code(id)}`) : []);
  return [`## ${t.changes}`, '', `${t.previous}: ${code(c.previous)}${c.previous_generated ? ` (${c.previous_generated})` : ''}`, '',
    `- ${t.fixed}: ${c.fixed.length}`, ...list(c.fixed), `- ${t.newF}: ${c.new.length}`, ...list(c.new), `- ${t.unchanged}: ${c.unchanged.length}`, ''];
}

export function toMarkdown(report, language = report.language) {
  const t = TEXT[language] || TEXT.en;
  const lines = [
    ...headerLines(report, t), ...matrixLines(report, t), ...domainLines(report, t), ...groupedLines(report, t),
    ...personLines(report, t), ...documentLines(report, t), ...changeLines(report, t),
    `## ${t.actions}`, '', ...report.next_actions.map((a, i) => `${i + 1}. ${a}`), '',
    '---', '', FOOTER, '',
  ];
  return lines.join('\n');
}
