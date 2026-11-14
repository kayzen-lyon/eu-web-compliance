// Validation d'un document JSON contre un schéma JSON (draft 2020-12), pour le sous-ensemble de
// mots-clés employé par schemas/report.schema.json et schemas/findings.schema.json :
// type, enum, const, required, properties, additionalProperties, items, minLength, minimum,
// $ref (local « #/$defs/... » ou vers un autre schéma par son $id), $defs.
// Les autres mots-clés (description, title...) sont des annotations et sont ignorés.
// Aucune dépendance : le skill n'embarque que playwright et axe-core.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'schemas');
const SUPPORTED = new Set(['$schema', '$id', '$defs', '$ref', 'title', 'description', 'type', 'enum', 'const', 'required',
  'properties', 'additionalProperties', 'items', 'minLength', 'minimum']);

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

function typeMatches(value, expected) {
  const actual = typeOf(value);
  return actual === expected || (expected === 'number' && actual === 'integer');
}

function resolvePointer(root, pointer) {
  return pointer.replace(/^#\/?/, '').split('/').filter(Boolean)
    .reduce((node, part) => (node ? node[part.replace(/~1/g, '/').replace(/~0/g, '~')] : undefined), root);
}

function resolveRef(ref, root, registry) {
  if (ref.startsWith('#')) return { schema: resolvePointer(root, ref), root };
  const [id, fragment] = ref.split('#');
  const target = registry.get(id);
  if (!target) return { schema: undefined, root };
  return { schema: fragment ? resolvePointer(target, `#${fragment}`) : target, root: target };
}

// Renvoie la liste des erreurs, chacune « chemin : message ». Liste vide : document valide.
export function validate(value, schema, registry = new Map(), at = '$', root = schema) {
  const errors = [];
  if (schema === true || schema === undefined) return errors;
  if (schema === false) return [`${at}: no value allowed`];
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED.has(key) && !key.startsWith('x-')) errors.push(`${at}: unsupported keyword ${key}`);
  }
  if (schema.$ref) {
    const { schema: target, root: targetRoot } = resolveRef(schema.$ref, root, registry);
    if (target === undefined) return [...errors, `${at}: unresolved $ref ${schema.$ref}`];
    errors.push(...validate(value, target, registry, at, targetRoot));
  }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeMatches(value, t))) return [...errors, `${at}: expected ${types.join(' or ')}, got ${typeOf(value)}`];
  }
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    errors.push(`${at}: ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`);
  }
  if ('const' in schema && JSON.stringify(schema.const) !== JSON.stringify(value)) {
    errors.push(`${at}: expected ${JSON.stringify(schema.const)}`);
  }
  if (typeof value === 'string' && schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push(`${at}: shorter than ${schema.minLength}`);
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${at}: below ${schema.minimum}`);
  }
  if (typeOf(value) === 'object') {
    for (const key of schema.required || []) {
      if (!(key in value)) errors.push(`${at}: missing required property ${key}`);
    }
    const props = schema.properties || {};
    for (const [key, child] of Object.entries(value)) {
      if (key in props) errors.push(...validate(child, props[key], registry, `${at}.${key}`, root));
      else if (schema.additionalProperties === false) errors.push(`${at}: unexpected property ${key}`);
      else if (typeof schema.additionalProperties === 'object') {
        errors.push(...validate(child, schema.additionalProperties, registry, `${at}.${key}`, root));
      }
    }
  }
  if (Array.isArray(value) && schema.items !== undefined) {
    value.forEach((item, i) => errors.push(...validate(item, schema.items, registry, `${at}[${i}]`, root)));
  }
  return errors;
}

export async function loadSchemas(dir = SCHEMA_DIR) {
  const read = async (name) => JSON.parse(await fs.readFile(path.join(dir, name), 'utf8'));
  const finding = await read('findings.schema.json');
  const report = await read('report.schema.json');
  const registry = new Map([[finding.$id, finding], [report.$id, report]]);
  return { finding, report, registry };
}

export async function validateReport(report, dir = SCHEMA_DIR) {
  const { report: schema, registry } = await loadSchemas(dir);
  return validate(report, schema, registry);
}
