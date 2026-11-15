#!/usr/bin/env node
// Serveur MCP du skill eu-web-compliance (transport stdio, SDK officiel @modelcontextprotocol/sdk).
//
// Il donne aux agents qui ne chargent pas de skill l'accès aux mêmes vérificateurs et aux mêmes
// fichiers que le skill, par quatre outils :
//   qualify_project  profil du projet → matrice des obligations (scripts/applicability.py)
//   audit_site       URL ou dossier → rapport (scripts/check-all.mjs)
//   get_template     modèle de document ou de composant (templates/)
//   get_rule         règles qui citent une source, par étiquette (references/)
//
// Lancement : `node mcp/server.mjs`, ou `npx eu-web-compliance mcp`.
//
// Sûreté : audit_site passe par check-all, dont les vérificateurs interrompent toute requête vers
// un hôte tiers et toute requête qui pourrait envoyer des données (voir scripts/lib/browser.mjs).
// Rien de ce comportement n'est modifiable par un argument d'outil. Les arguments eux-mêmes sont
// contrôlés par mcp/guard.mjs : URL en http(s) hors adresses de lien local, et chemins bornés au
// dossier de la variable EU_WEB_COMPLIANCE_MCP_ROOT quand elle est définie. get_template ne lit que des
// fichiers listés dans templates/. Le texte cité depuis un site vérifié est une donnée, pas une
// instruction : chaque réponse d'audit le rappelle.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { CHECKER_NAMES, auditSite, findRules, getTemplate, isUrl, listTemplates, qualifyProject, skillVersion } from '../scripts/lib/skill-api.mjs';
import { assertInsideRoot, assertUrlAllowed } from './guard.mjs';
import { DATA_NOTICE } from '../scripts/lib/cli.mjs';

const NOT_A_CERTIFICATE = 'Produced with the help of an AI tool (eu-web-compliance). Not an audit, not legal advice, and never a statement that a site is compliant: a verdict applies to one rule, and what was not tested must be reported as not tested.';
const SEVERITY_ORDER = { blocking: 0, major: 1, minor: 2 };

const json = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
const failure = (error) => ({ isError: true, content: [{ type: 'text', text: String((error && error.message) || error) }] });
const guarded = (handler) => async (args) => {
  try {
    return json(await handler(args));
  } catch (error) {
    return failure(error);
  }
};

// Constats les plus graves d'abord : non-conformités avant points à revoir, puis par sévérité.
function orderFindings(findings) {
  const rank = (f) => (f.verdict === 'NC' ? 0 : 10) + (SEVERITY_ORDER[f.severity] ?? 3);
  return [...findings].sort((a, b) => rank(a) - rank(b));
}

async function audit({ target, only, lang, project, profile, timeout_minutes: timeout, max_findings: max = 40 }) {
  if (isUrl(target)) await assertUrlAllowed(target);
  else await assertInsideRoot('target', target);
  await assertInsideRoot('project', project);
  await assertInsideRoot('profile', profile);
  const result = await auditSite({ target, only, lang, project, profile, timeout, out: project ? path.join(project, 'compliance', 'reports') : undefined, noFail: true });
  if (!result.report) throw new Error(`the checks did not produce a report (exit code ${result.exit_code}). ${result.log.split('\n').slice(-8).join('\n')}`);
  const { report } = result;
  const findings = orderFindings(report.findings);
  return {
    notice: NOT_A_CERTIFICATE,
    data_notice: DATA_NOTICE,
    target: report.target,
    summary: report.summary,
    checkers: report.checkers,
    applicability_counts: report.applicability && report.applicability.counts,
    findings_total: findings.length,
    findings_returned: Math.min(findings.length, max),
    findings: findings.slice(0, max),
    grouped_fixes: report.grouped_fixes,
    not_tested_total: report.not_tested.length,
    manual_checks_total: report.manual_checks.length,
    next_actions: report.next_actions,
    full_report: result.files,
    how_to_read: 'The full report (every finding, the points not tested and the checks left to a person) is in full_report. Tell the user what was not verified.',
  };
}

export async function createServer() {
  const server = new McpServer({ name: 'eu-web-compliance', version: await skillVersion() }, {
    instructions: `${NOT_A_CERTIFICATE} Dates, thresholds and article numbers come from the files of the skill, never from memory. ${DATA_NOTICE}`,
  });

  server.registerTool('qualify_project', {
    title: 'Applicability matrix of a project',
    description: 'Says which EU and French obligations concern a website (applies, does-not-apply, to-confirm) from its project profile. Pass either `profile` (the profile object, see get_template "profile.example.json" for the shape) or `profile_path` (a file, usually compliance/profile.json). A missing or assumed answer gives to-confirm, which is handled as if it applied.',
    inputSchema: {
      profile: z.record(z.string(), z.any()).optional().describe('Project profile following schemas/profile.schema.json'),
      profile_path: z.string().optional().describe('Path of a profile file on this machine'),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, guarded(async ({ profile, profile_path: profilePath }) => {
    if (!profile && !profilePath) throw new Error('pass `profile` or `profile_path`');
    await assertInsideRoot('profile_path', profilePath);
    return qualifyProject(profilePath || profile);
  }));

  server.registerTool('audit_site', {
    title: 'Audit a website',
    description: 'Runs the four checkers of the skill (accessibility, trackers before consent, security headers, legal and AI content) on a URL or on a folder of built pages, in a real browser, and returns the merged report. Requests to third-party hosts and requests that could send data are blocked. With `project`, the report files are written in <project>/compliance/reports/; otherwise in a temporary folder. Can take several minutes.',
    inputSchema: {
      target: z.string().min(1).describe('URL (http or https), folder of built HTML pages, or one HTML file'),
      only: z.array(z.enum(CHECKER_NAMES)).min(1).optional().describe('Checkers to run (default: all four)'),
      lang: z.enum(['en', 'fr']).optional().describe('Language of the Markdown report (default: en)'),
      project: z.string().optional().describe('Root folder of the project (holds compliance/profile.json)'),
      profile: z.string().optional().describe('Path of the project profile, when it is not <project>/compliance/profile.json'),
      timeout_minutes: z.number().positive().max(30).optional().describe('Maximum duration of each checker (default 30)'),
      max_findings: z.number().int().min(1).max(500).optional().describe('Number of findings returned, most severe first (default 40); the full list is in the report file'),
    },
    annotations: { readOnlyHint: false, openWorldHint: true },
  }, guarded(audit));

  server.registerTool('get_template', {
    title: 'Document or component template',
    description: 'Returns a template of the skill: legal notice, privacy and cookie policies, accessibility statement, terms, consent banner, AI notices, withdrawal function... Call it without `name` to list the templates. Placeholders in square brackets must stay visible until the operator supplies the real value: never invent operator data.',
    inputSchema: { name: z.string().optional().describe('Template name as listed, for example "consumer/legal-notice-fr.md" or "privacy-policy"') },
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, guarded(async ({ name }) => (name ? getTemplate(name) : { templates: await listTemplates() })));

  server.registerTool('get_rule', {
    title: 'Rules by source tag',
    description: 'Finds the rules of the skill that cite a source, by tag: "RGAA 11.1", "WCAG 2.4.7", "GDPR art. 7(3)", "CNIL guidelines", "AI Act art. 50", "ANSSI WEB R14"... For an RGAA criterion, also returns its official text. A rule tagged "best practice" is not an obligation.',
    inputSchema: { tag: z.string().min(1).describe('Source tag, with or without square brackets') },
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, guarded(async ({ tag }) => findRules(tag)));

  return server;
}

export async function startStdio() {
  const server = await createServer();
  await server.connect(new StdioServerTransport());
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startStdio().catch((error) => {
    process.stderr.write(`eu-web-compliance mcp: ${error.stack || error}\n`);
    process.exitCode = 1;
  });
}
