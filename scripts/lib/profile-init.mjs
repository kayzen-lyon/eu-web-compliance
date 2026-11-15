// Questions de qualification posées dans le terminal par `eu-web-compliance init`.
//
// Les champs, leurs types, leurs valeurs permises et leur lecture protectrice viennent de
// schemas/profile.schema.json ; seuls les libellés courts des questions (anglais et français)
// sont dans init-questions.json. Les réponses sont enregistrées comme le demande
// references/scoping/questionnaire.md : `stated` pour ce que la personne a répondu ; pour un
// oui/non laissé sans réponse, la lecture protectrice avec `assumed` ; pour un chiffre, un pays
// ou une forme juridique sans réponse, rien (la matrice dira « to-confirm »).

import fs from 'node:fs/promises';
import path from 'node:path';
import { SKILL_ROOT } from './skill-api.mjs';

export const STATED_NOTE = 'Answered in the terminal (eu-web-compliance init)';
export const ASSUMED_NOTE = 'Not answered in eu-web-compliance init; protective reading';

function kindOf(valueSchema) {
  if (valueSchema.type === 'boolean') return 'boolean';
  if (valueSchema.type === 'number' || valueSchema.type === 'integer') return 'number';
  if (valueSchema.type === 'array') return valueSchema.items && valueSchema.items.enum ? 'choices' : 'list';
  if (valueSchema.enum) return 'choice';
  return 'text';
}

// Questions dans l'ordre du questionnaire (x-question), puis dans l'ordre du schéma.
export async function loadQuestions() {
  const schema = JSON.parse(await fs.readFile(path.join(SKILL_ROOT, 'schemas', 'profile.schema.json'), 'utf8'));
  const labels = JSON.parse(await fs.readFile(path.join(SKILL_ROOT, 'scripts', 'lib', 'init-questions.json'), 'utf8'));
  const questions = [];
  for (const [group, groupSchema] of Object.entries(schema.properties)) {
    if (groupSchema.type !== 'object') continue;
    for (const [name, fieldSchema] of Object.entries(groupSchema.properties || {})) {
      const field = `${group}.${name}`;
      if (labels.not_asked.includes(field)) continue;
      const valueSchema = (fieldSchema.properties && fieldSchema.properties.value) || {};
      const protective = fieldSchema['x-protective-assumption'];
      questions.push({
        field, group, name, number: fieldSchema['x-question'] || 99, kind: kindOf(valueSchema),
        choices: valueSchema.enum || (valueSchema.items && valueSchema.items.enum) || null,
        pattern: valueSchema.pattern || (valueSchema.items && valueSchema.items.pattern) || null,
        minimum: valueSchema.minimum, description: fieldSchema.description || '',
        // Seule une lecture protectrice booléenne peut être écrite ; les autres sont des phrases.
        protective: typeof protective === 'boolean' ? protective : undefined,
        label: labels.questions[field] || null,
      });
    }
  }
  return questions.map((q, index) => ({ ...q, index })).sort((a, b) => a.number - b.number || a.index - b.index);
}

const YES = new Set(['y', 'yes', 'o', 'oui', 'true', '1']);
const NO = new Set(['n', 'no', 'non', 'false', '0']);
const NONE = new Set(['none', 'aucun', 'aucune', '-']);
const UNKNOWN = new Set(['', '?']);

function pickChoice(question, token) {
  const text = token.trim().toLowerCase();
  if (/^\d+$/.test(text)) return question.choices[Number(text) - 1];
  return question.choices.find((choice) => choice.toLowerCase() === text);
}

// Renvoie { unknown: true }, { value } ou { error }.
export function parseAnswer(question, raw) {
  const text = String(raw === undefined || raw === null ? '' : raw).trim();
  if (UNKNOWN.has(text)) return { unknown: true };
  const lower = text.toLowerCase();
  if (question.kind === 'boolean') {
    if (YES.has(lower)) return { value: true };
    if (NO.has(lower)) return { value: false };
    return { error: 'yes-no' };
  }
  if (question.kind === 'number') {
    const digits = text.replace(/[\s_  ]/g, '').replace(',', '.');
    // Chiffres seulement : « 0x10 » ou « 1e3 » sont des fautes de frappe, pas des montants.
    const value = /^-?\d+(\.\d+)?$/.test(digits) ? Number(digits) : NaN;
    if (!Number.isFinite(value) || value < (question.minimum === undefined ? -Infinity : question.minimum)) return { error: 'number' };
    return { value };
  }
  if (question.kind === 'choice') {
    const value = pickChoice(question, text);
    return value === undefined ? { error: 'choice' } : { value };
  }
  const tokens = NONE.has(lower) ? [] : text.split(',').map((t) => t.trim()).filter(Boolean);
  if (question.kind === 'choices') {
    const values = tokens.map((t) => pickChoice(question, t));
    return values.includes(undefined) ? { error: 'choice' } : { value: [...new Set(values)] };
  }
  const shaped = (token) => (question.pattern === '^[A-Z]{2}$' ? token.toUpperCase() : token);
  const values = (question.kind === 'list' ? tokens : [text]).map(shaped);
  if (question.pattern && values.some((v) => !new RegExp(question.pattern).test(v))) return { error: 'pattern' };
  return { value: question.kind === 'list' ? values : values[0] };
}

const AI_FLAGS = ['ai.conversational_assistant', 'ai.content_generation_feature', 'ai.generated_content_published',
  'ai.emotion_or_biometric', 'ai.decisions_about_people'];

// Questions sans objet d'après les réponses déjà données (jamais d'après une absence de réponse).
export function shouldAsk(question, answers) {
  const stated = (field) => (answers[field] && 'value' in answers[field] ? answers[field].value : undefined);
  if (question.field === 'operator.fr_turnover_3y_average_eur') {
    const country = stated('operator.country_of_establishment');
    return country === undefined || country === 'FR';
  }
  if (question.field === 'market.sells_what' || question.field === 'market.withdrawal_right_applies') return stated('market.sells_online') !== false;
  if (question.field === 'ai.role') return !AI_FLAGS.every((field) => stated(field) === false);
  return true;
}

// answers : { 'operator.type': { value } | { unknown: true }, ... }. Un champ absent de `answers`
// (question sans objet) n'est pas écrit.
export function buildProfile(answers, questions, { projectName = null, today = new Date() } = {}) {
  const pad = (n) => String(n).padStart(2, '0');
  const profile = { schema_version: 1 };
  if (projectName) profile.project_name = projectName;
  profile.updated = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  for (const question of [...questions].sort((a, b) => a.index - b.index)) {
    const answer = answers[question.field];
    if (!answer) continue;
    let entry = null;
    if ('value' in answer) entry = { value: answer.value, basis: 'stated', note: STATED_NOTE };
    else if (question.protective !== undefined) entry = { value: question.protective, basis: 'assumed', note: ASSUMED_NOTE };
    if (!entry) continue;
    profile[question.group] = { ...(profile[question.group] || {}), [question.name]: entry };
  }
  return profile;
}
