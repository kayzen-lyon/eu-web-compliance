#!/usr/bin/env node
// Outil en ligne de commande du skill eu-web-compliance.
//
//   eu-web-compliance audit <dossier|URL> [options de scripts/check-all.mjs]
//   eu-web-compliance init [--project <dossier>] [--lang en|fr] [--defaults] [--force]
//   eu-web-compliance qualify [profil] [--format markdown|json] [--output-dir <dossier>]
//   eu-web-compliance template [nom] [--out <fichier>] [--force]
//   eu-web-compliance rule <étiquette> [--json]
//   eu-web-compliance mcp
//
// Chaque sous-commande passe par scripts/check-all.mjs, scripts/applicability.py, templates/ et
// references/ (voir scripts/lib/skill-api.mjs) : rien n'est recopié ici.
//
// Codes de sortie : ceux de check-all pour `audit` (0, 1 non-conformité, 2 erreur) ; sinon
// 0 réussite, 2 erreur d'usage ou d'exécution.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { CHECK_ALL, SKILL_ROOT, SkillError, findRules, getTemplate, listTemplates, qualifyProject, skillVersion } from '../scripts/lib/skill-api.mjs';
import { python } from '../scripts/lib/process.mjs';
import { buildProfile, loadQuestions, parseAnswer, shouldAsk } from '../scripts/lib/profile-init.mjs';

const TEXT = {
  en: {
    help: `eu-web-compliance: checks a website against the EU rules of the eu-web-compliance skill.
It never certifies compliance: results are an aid, not an audit and not legal advice.

Usage:
  eu-web-compliance audit <folder|URL> [--project <dir>] [--profile <file>] [--out <dir>]
                          [--only a11y,privacy,security,content] [--lang en|fr]
                          [--timeout <minutes>] [--no-fail]
      Runs the four checkers and writes the report (Markdown and JSON) in <project>/compliance/reports/.
  eu-web-compliance init [--project <dir>] [--lang en|fr] [--defaults] [--force]
      Asks the scoping questions and writes <project>/compliance/profile.json.
  eu-web-compliance qualify [profile] [--format markdown|json] [--output-dir <dir>]
      Prints the applicability matrix of a profile (default: compliance/profile.json).
  eu-web-compliance template [name] [--out <file>] [--force]
      Lists the templates, or prints one (or copies it to --out).
  eu-web-compliance rule <tag> [--json]
      Finds the rules that cite a source, for example "RGAA 11.1" or "GDPR art. 7(3)".
  eu-web-compliance mcp
      Starts the MCP server on standard input and output.

Browser checks need Chromium once: npx playwright install chromium. The matrix needs Python 3.8+.`,
    unknownCommand: (c) => `unknown command: ${c} (see eu-web-compliance --help)`,
    exists: (f) => `${f} already exists: use --force to replace it`,
    initIntro: 'Scoping questions. Press Enter (or type ?) when you do not know: a yes/no question then gets the protective answer, marked "assumed"; a figure or a country stays unanswered. Nothing is invented.',
    yesNo: 'yes/no', number: 'number', listHint: 'comma-separated; "none" for an empty list', choiceHint: 'number or value',
    choicesHint: 'numbers or values, comma-separated; "none" for none of them',
    errors: { 'yes-no': 'Answer yes or no, or press Enter if you do not know.', number: 'A number is expected.',
      choice: 'Choose among the values listed.', pattern: 'The format is not the expected one.' },
    projectName: 'Name of the project (optional)',
    written: (f) => `profile written: ${f}`,
    counts: (c) => `matrix: ${c.applies} obligation(s) apply, ${c['to-confirm']} to confirm, ${c['does-not-apply']} do not apply`,
    matrixFiles: (d) => `matrix written in ${d} (applicability-matrix.md and .json)`,
    matrixFailed: (m) => `the profile is written, but the matrix could not be computed: ${m}`,
    reminder: 'This profile and its matrix are an aid, not legal advice: have them checked by a qualified professional. Every "to-confirm" row is handled as if it applied.',
    noRules: (q) => `no rule cites "${q}".`, knownTags: 'Known tags',
    officialText: 'Official text', templateCopied: (n, f) => `template ${n} copied to ${f}`,
  },
  fr: {
    help: `eu-web-compliance : vérifie un site web au regard des règles européennes du skill eu-web-compliance.
Il ne certifie jamais la conformité : ses résultats sont une aide, ni un audit ni un avis juridique.

Usage :
  eu-web-compliance audit <dossier|URL> [--project <dossier>] [--profile <fichier>] [--out <dossier>]
                          [--only a11y,privacy,security,content] [--lang en|fr]
                          [--timeout <minutes>] [--no-fail]
      Lance les quatre vérificateurs et écrit le rapport (Markdown et JSON) dans <projet>/compliance/reports/.
  eu-web-compliance init [--project <dossier>] [--lang en|fr] [--defaults] [--force]
      Pose les questions de qualification et écrit <projet>/compliance/profile.json.
  eu-web-compliance qualify [profil] [--format markdown|json] [--output-dir <dossier>]
      Affiche la matrice d'applicabilité d'un profil (défaut : compliance/profile.json).
  eu-web-compliance template [nom] [--out <fichier>] [--force]
      Liste les modèles, ou en affiche un (ou le copie vers --out).
  eu-web-compliance rule <étiquette> [--json]
      Trouve les règles qui citent une source, par exemple "RGAA 11.1" ou "GDPR art. 7(3)".
  eu-web-compliance mcp
      Démarre le serveur MCP sur l'entrée et la sortie standard.

Les vérifications dans le navigateur demandent Chromium, une fois : npx playwright install chromium.
La matrice demande Python 3.8 ou plus récent.`,
    unknownCommand: (c) => `commande inconnue : ${c} (voir eu-web-compliance --help)`,
    exists: (f) => `${f} existe déjà : utiliser --force pour le remplacer`,
    initIntro: 'Questions de qualification. Appuyez sur Entrée (ou tapez ?) quand vous ne savez pas : une question oui/non reçoit alors la réponse protectrice, marquée « assumed » ; un chiffre ou un pays reste sans réponse. Rien n\'est inventé.',
    yesNo: 'oui/non', number: 'nombre', listHint: 'séparés par des virgules ; « aucun » pour une liste vide', choiceHint: 'numéro ou valeur',
    choicesHint: 'numéros ou valeurs, séparés par des virgules ; « aucun » pour aucun',
    errors: { 'yes-no': 'Répondez oui ou non, ou appuyez sur Entrée si vous ne savez pas.', number: 'Un nombre est attendu.',
      choice: 'Choisissez parmi les valeurs listées.', pattern: 'Le format n\'est pas celui attendu.' },
    projectName: 'Nom du projet (facultatif)',
    written: (f) => `profil écrit : ${f}`,
    counts: (c) => `matrice : ${c.applies} obligation(s) applicable(s), ${c['to-confirm']} à confirmer, ${c['does-not-apply']} non applicable(s)`,
    matrixFiles: (d) => `matrice écrite dans ${d} (applicability-matrix.md et .json)`,
    matrixFailed: (m) => `le profil est écrit, mais la matrice n'a pas pu être calculée : ${m}`,
    reminder: 'Ce profil et sa matrice sont une aide, pas un avis juridique : faites-les vérifier par un professionnel qualifié. Toute ligne « to-confirm » est traitée comme si elle s\'appliquait.',
    noRules: (q) => `aucune règle ne cite « ${q} ».`, knownTags: 'Étiquettes connues',
    officialText: 'Texte officiel', templateCopied: (n, f) => `modèle ${n} copié vers ${f}`,
  },
};

function defaultLang() {
  const env = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || '';
  return env.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

// Options d'une sous-commande : { values: ['--out'], flags: ['--force'] } → { out, force, rest: [] }.
function options(argv, spec) {
  const result = { rest: [] };
  const key = (option) => option.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (spec.values.includes(arg)) {
      if (i + 1 >= argv.length) throw new SkillError(`${arg}: value missing`);
      i += 1;
      result[key(arg)] = argv[i];
    } else if (spec.flags.includes(arg)) result[key(arg)] = true;
    else if (arg.startsWith('--')) throw new SkillError(`unknown option: ${arg}`);
    else result.rest.push(arg);
  }
  if (result.lang && !TEXT[result.lang]) throw new SkillError('--lang: en or fr');
  return result;
}

const out = (text) => process.stdout.write(`${text}\n`);

// Sortie coupée par le lecteur (`| head`) : on s'arrête sans trace d'erreur.
process.stdout.on('error', (error) => { if (error.code === 'EPIPE') process.exit(0); });

function audit(argv) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CHECK_ALL, ...argv], { stdio: 'inherit' });
    child.on('error', (error) => { process.stderr.write(`${error.message}\n`); resolve(2); });
    child.on('close', (code) => resolve(code === null ? 2 : code));
  });
}

async function qualify(argv) {
  const opts = options(argv, { values: ['--format', '--output-dir'], flags: [] });
  const args = [path.join(SKILL_ROOT, 'scripts', 'applicability.py'), opts.rest[0] || path.join('compliance', 'profile.json')];
  if (opts.format) args.push('--format', opts.format);
  if (opts.outputDir) args.push('--output-dir', opts.outputDir);
  const result = await python(args);
  if (result.spawnError === 'ENOENT') throw new SkillError('Python 3.8+ not found (set the PYTHON variable to its path if it is installed elsewhere)');
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  return result.code === 0 ? 0 : 2;
}

function promptOf(question, t, lang) {
  const lines = [`\n[${question.field}] ${(question.label && (question.label[lang] || question.label.en)) || question.description || question.field}`];
  if (question.choices) question.choices.forEach((choice, i) => lines.push(`  ${i + 1}. ${choice}`));
  const hint = { boolean: t.yesNo, number: t.number, list: t.listHint, choice: t.choiceHint, choices: t.choicesHint }[question.kind];
  return `${lines.join('\n')}\n${hint ? `(${hint}) ` : ''}> `;
}

async function init(argv) {
  const opts = options(argv, { values: ['--project', '--lang'], flags: ['--defaults', '--force'] });
  const lang = opts.lang || defaultLang();
  const t = TEXT[lang];
  const dir = path.join(path.resolve(opts.project || process.cwd()), 'compliance');
  const file = path.join(dir, 'profile.json');
  if (existsSync(file) && !opts.force) throw new SkillError(t.exists(file));
  const questions = await loadQuestions();
  const answers = {};
  let projectName = null;
  if (opts.defaults) {
    for (const question of questions) answers[question.field] = { unknown: true };
  } else {
    const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
    const lines = rl[Symbol.asyncIterator]();
    // Une entrée terminée (fin d'un fichier redirigé) vaut « je ne sais pas » pour le reste.
    const ask = async (prompt) => {
      process.stdout.write(prompt);
      const next = await lines.next();
      return next.done ? '' : next.value;
    };
    out(t.initIntro);
    projectName = (await ask(`\n${t.projectName}\n> `)).trim() || null;
    for (const question of questions) {
      if (!shouldAsk(question, answers)) continue;
      for (let attempt = 0; ; attempt += 1) {
        const parsed = parseAnswer(question, await ask(promptOf(question, t, lang)));
        if (!parsed.error) { answers[question.field] = parsed; break; }
        out(t.errors[parsed.error]);
        if (attempt >= 4) { answers[question.field] = { unknown: true }; break; }
      }
    }
    rl.close();
  }
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(buildProfile(answers, questions, { projectName }), null, 2)}\n`);
  out(`\n${t.written(file)}`);
  try {
    const matrix = await qualifyProject(file, { outputDir: dir });
    out(t.counts(matrix.counts));
    out(t.matrixFiles(dir));
  } catch (error) {
    out(t.matrixFailed(error.message));
  }
  out(t.reminder);
  return 0;
}

async function template(argv) {
  const opts = options(argv, { values: ['--out', '--lang'], flags: ['--force', '--list'] });
  const t = TEXT[opts.lang || defaultLang()];
  if (opts.list || !opts.rest.length) {
    for (const item of await listTemplates()) out(item.title ? `${item.name}  (${item.title})` : item.name);
    return 0;
  }
  const found = await getTemplate(opts.rest[0]);
  if (!opts.out) {
    process.stdout.write(found.content);
    return 0;
  }
  const target = path.resolve(opts.out);
  if (existsSync(target) && !opts.force) throw new SkillError(t.exists(target));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, found.content);
  out(t.templateCopied(found.name, target));
  return 0;
}

async function rule(argv) {
  const opts = options(argv, { values: ['--lang'], flags: ['--json'] });
  const t = TEXT[opts.lang || defaultLang()];
  const result = await findRules(opts.rest.join(' '));
  if (opts.json) {
    out(JSON.stringify(result, null, 2));
    return 0;
  }
  if (result.official_text) out(`${t.officialText} (${result.official_text.file}:${result.official_text.line})\n\n${result.official_text.text}\n`);
  for (const r of result.rules) out(`${r.file}:${r.line}  ${r.section}\n  - ${r.rule} [${r.tag}]`);
  if (!result.rules.length) {
    out(t.noRules(result.query));
    if (result.known_tags) out(`${t.knownTags}: ${result.known_tags.join(', ')}`);
  }
  return 0;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const t = TEXT[defaultLang()];
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    out(t.help);
    return command ? 0 : 2;
  }
  if (command === '--version' || command === '-v' || command === 'version') {
    out(await skillVersion());
    return 0;
  }
  if (command === 'audit') return audit(rest);
  if (command === 'init') return init(rest);
  if (command === 'qualify') return qualify(rest);
  if (command === 'template') return template(rest);
  if (command === 'rule') return rule(rest);
  if (command === 'mcp') {
    const { startStdio } = await import('../mcp/server.mjs');
    await startStdio();
    return null; // le serveur garde le processus ouvert
  }
  throw new SkillError(t.unknownCommand(command));
}

main().then((code) => { if (code !== null) process.exitCode = code; }).catch((error) => {
  if (error instanceof SkillError) process.stderr.write(`eu-web-compliance: ${error.message}\n`);
  else process.stderr.write(`eu-web-compliance: ${error.stack || error}\n`);
  process.exitCode = 2;
});
