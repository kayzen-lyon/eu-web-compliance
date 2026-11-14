#!/usr/bin/env python3
"""Applicability matrix of the eu-web-compliance skill.

Reads a project profile (compliance/profile.json, see schemas/profile.schema.json)
and the decision table references/scoping/obligations.json, and says for each
obligation whether a legal text concerns the operator:

    applies          the profile triggers the text
    does-not-apply   the profile rules it out
    to-confirm       an answer is missing or only assumed, or the legal
                     qualification cannot be decided from the profile

Standard library only, Python 3.8 or later.

Usage:
    python scripts/applicability.py compliance/profile.json
    python scripts/applicability.py compliance/profile.json --format json
    python scripts/applicability.py compliance/profile.json --output-dir compliance

Exit codes: 0 matrix produced, 2 unreadable or invalid input.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, FrozenSet, List, NamedTuple, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TABLE = ROOT / "references" / "scoping" / "obligations.json"
DEFAULT_SCHEMA = ROOT / "schemas" / "profile.schema.json"

DOMAINS = (("accessibility", "Accessibility"), ("privacy", "Data protection and trackers"),
           ("ai", "Artificial intelligence"), ("security", "Security"),
           ("consumer", "Consumer and information law"))
LEVELS = ("mandatory", "recommended")
NATURES = ("legal-text", "official-recommendation", "skill-practice")
JURISDICTIONS = ("EU", "FR")
OBLIGATION_KEYS = ("id", "domain", "jurisdiction", "title", "requires", "applies_when", "level",
                   "nature", "sources", "status_section", "rules_file")
OPERATORS = ("all", "any", "not", "equals", "in", "contains", "greater-than", "less-than",
             "def", "uncertain", "always")

DISCLAIMER = (
    "This matrix was produced by an AI tool (the eu-web-compliance skill) from the answers "
    "listed below. It is not legal advice and it is not an audit. It says which texts appear "
    "to concern the project; it does not say that the site complies with them. Have it "
    "checked by a qualified professional before relying on it."
)
TO_CONFIRM_RULE = (
    "Every row marked to-confirm is handled as if it applied until the answer is confirmed."
)


class InputError(Exception):
    """Unreadable or invalid profile, schema or decision table."""


class ConditionError(InputError):
    """A condition of the decision table cannot be evaluated."""


class Tri(NamedTuple):
    """Result of a condition: value is True, False or None (unknown)."""
    value: Optional[bool]
    certain: bool
    pending: FrozenSet[Tuple[str, str]]  # ("missing" | "assumed" | "uncertain", field or reason)
    fields: FrozenSet[str]


def load_json(path: Path) -> Any:
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except OSError as exc:
        raise InputError(f"cannot read {path}: {exc.strerror or exc}") from exc
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise InputError(f"{path} is not valid JSON: {exc}") from exc


# --- Profile validation (the subset of JSON Schema the profile schema uses) ---

TYPE_CHECKS = {
    "object": lambda v: isinstance(v, dict),
    "array": lambda v: isinstance(v, list),
    "string": lambda v: isinstance(v, str),
    "boolean": lambda v: isinstance(v, bool),
    "integer": lambda v: isinstance(v, int) and not isinstance(v, bool),
    "number": lambda v: isinstance(v, (int, float)) and not isinstance(v, bool),
}


def _resolve(schema: dict, root: dict) -> dict:
    ref = schema.get("$ref")
    if not ref:
        return schema
    if not ref.startswith("#/"):
        raise InputError(f"schema: unsupported $ref {ref}")
    target: Any = root
    for part in ref[2:].split("/"):
        target = target[part]
    merged = dict(target)
    for key, value in schema.items():
        if key == "properties":
            merged["properties"] = {**target.get("properties", {}), **value}
        elif key != "$ref":
            merged[key] = value
    return merged


def schema_errors(value: Any, schema: dict, root: dict, where: str = "profile") -> List[str]:
    schema = _resolve(schema, root)
    expected = schema.get("type")
    if expected and not TYPE_CHECKS[expected](value):
        return [f"{where}: expected {expected}, found {json.dumps(value)[:60]}"]
    found: List[str] = []
    if "enum" in schema and value not in schema["enum"]:
        allowed = ", ".join(json.dumps(item) for item in schema["enum"])
        found.append(f"{where}: {json.dumps(value)} is not allowed (expected one of: {allowed})")
    if "pattern" in schema and isinstance(value, str) and not re.search(schema["pattern"], value):
        found.append(f"{where}: {json.dumps(value)} does not match {schema['pattern']}")
    if "minimum" in schema and TYPE_CHECKS["number"](value) and value < schema["minimum"]:
        found.append(f"{where}: {value} is below the minimum {schema['minimum']}")
    if isinstance(value, dict):
        properties = schema.get("properties", {})
        for name in schema.get("required", []):
            if name not in value:
                found.append(f"{where}: required key \"{name}\" is missing")
        for name, item in value.items():
            if name in properties:
                found.extend(schema_errors(item, properties[name], root, f"{where}.{name}"))
            elif schema.get("additionalProperties") is False:
                found.append(f"{where}: unknown key \"{name}\"")
    if isinstance(value, list) and "items" in schema:
        for index, item in enumerate(value):
            found.extend(schema_errors(item, schema["items"], root, f"{where}[{index}]"))
    return found


def schema_fields(schema: dict) -> Dict[str, dict]:
    """Answer fields of the profile schema, keyed by "group.name"."""
    fields: Dict[str, dict] = {}
    for group, group_schema in schema.get("properties", {}).items():
        if group_schema.get("type") != "object":
            continue
        for name, field_schema in group_schema.get("properties", {}).items():
            fields[f"{group}.{name}"] = field_schema
    return fields


def read_answer(profile: dict, field: str) -> Optional[dict]:
    group, name = field.split(".", 1)
    answer = profile.get(group, {}).get(name)
    return answer if isinstance(answer, dict) and "value" in answer else None


# --- Condition language ---

def _leaf(profile: dict, known: Dict[str, dict], spec: Any, test) -> Tri:
    if not isinstance(spec, dict) or not isinstance(spec.get("field"), str):
        raise ConditionError(f"condition without a field: {json.dumps(spec)}")
    field = spec["field"]
    if field not in known:
        raise ConditionError(f"condition on a field the profile schema does not define: {field}")
    answer = read_answer(profile, field)
    fields = frozenset([field])
    if answer is None:
        return Tri(None, False, frozenset([("missing", field)]), fields)
    try:
        value = bool(test(answer["value"]))
    except TypeError as exc:
        raise ConditionError(f"condition on {field} cannot be computed: {exc}") from exc
    if answer.get("basis") == "assumed":
        return Tri(value, False, frozenset([("assumed", field)]), fields)
    return Tri(value, True, frozenset(), fields)


def _combine(results: List[Tri], decisive: bool) -> Tri:
    """'any' when decisive is True, 'all' when it is False."""
    fields = frozenset().union(*[r.fields for r in results]) if results else frozenset()
    if any(r.certain and r.value is decisive for r in results):
        return Tri(decisive, True, frozenset(), fields)
    if all(r.certain for r in results):
        return Tri(not decisive, True, frozenset(), fields)
    values = [r.value for r in results]
    leaning = decisive if decisive in values else (None if None in values else not decisive)
    pending = frozenset().union(*[r.pending for r in results if not r.certain])
    return Tri(leaning, False, pending, fields)


def evaluate(condition: Any, profile: dict, definitions: Dict[str, Any],
             known: Dict[str, dict], _stack: Tuple[str, ...] = ()) -> Tri:
    if not isinstance(condition, dict) or len(condition) != 1:
        raise ConditionError(f"a condition is an object with one operator: {json.dumps(condition)}")
    operator, spec = next(iter(condition.items()))
    if operator not in OPERATORS:
        raise ConditionError(f"unknown operator \"{operator}\" (known: {', '.join(OPERATORS)})")

    def sub(item: Any) -> Tri:
        return evaluate(item, profile, definitions, known, _stack)

    if operator in ("all", "any"):
        if not isinstance(spec, list) or not spec:
            raise ConditionError(f"\"{operator}\" needs a non-empty list of conditions")
        return _combine([sub(item) for item in spec], decisive=(operator == "any"))
    if operator == "not":
        inner = sub(spec)
        return inner._replace(value=None if inner.value is None else not inner.value)
    if operator == "def":
        if spec not in definitions:
            raise ConditionError(f"unknown definition \"{spec}\"")
        if spec in _stack:
            raise ConditionError(f"definition \"{spec}\" refers to itself")
        return evaluate(definitions[spec], profile, definitions, known, _stack + (spec,))
    if operator == "uncertain":
        if not isinstance(spec, str) or not spec:
            raise ConditionError("\"uncertain\" needs a reason")
        return Tri(None, False, frozenset([("uncertain", spec)]), frozenset())
    if operator == "always":
        if spec is not True:
            raise ConditionError("\"always\" only accepts true")
        return Tri(True, True, frozenset(), frozenset())
    if not isinstance(spec, dict):
        raise ConditionError(f"\"{operator}\" needs an object: {json.dumps(spec)}")
    if operator == "in":
        if not isinstance(spec.get("values"), list):
            raise ConditionError("\"in\" needs a list of values")
        return _leaf(profile, known, spec, lambda v: v in spec["values"])
    if "value" not in spec:
        raise ConditionError(f"\"{operator}\" needs a value")
    if operator == "equals":
        return _leaf(profile, known, spec, lambda v: v == spec["value"])
    if operator == "contains":
        return _leaf(profile, known, spec, lambda v: isinstance(v, list) and spec["value"] in v)
    if not TYPE_CHECKS["number"](spec["value"]):
        raise ConditionError(f"\"{operator}\" needs a numeric value")
    if not isinstance(spec.get("threshold_source"), dict):
        raise ConditionError(f"\"{operator}\" on {spec.get('field')} needs a threshold_source")
    if operator == "greater-than":
        return _leaf(profile, known, spec, lambda v: v > spec["value"])
    return _leaf(profile, known, spec, lambda v: v < spec["value"])


def check_table(table: Any, schema: dict) -> List[str]:
    """Structural errors of the decision table. Conditions are evaluated on an empty profile."""
    if not isinstance(table, dict) or not isinstance(table.get("obligations"), list):
        return ["decision table: no \"obligations\" list"]
    known = schema_fields(schema)
    definitions = table.get("definitions", {})
    found: List[str] = []
    seen = set()
    conditions = [(f"definition {name}", cond) for name, cond in definitions.items()]
    for entry in table["obligations"]:
        label = f"obligation {entry.get('id', '?')}"
        missing = [key for key in OBLIGATION_KEYS if key not in entry]
        if missing:
            found.append(f"{label}: missing keys: {', '.join(missing)}")
            continue
        if entry["id"] in seen:
            found.append(f"{label}: duplicate id")
        seen.add(entry["id"])
        if entry["domain"] not in dict(DOMAINS):
            found.append(f"{label}: unknown domain {entry['domain']}")
        if entry["level"] not in LEVELS:
            found.append(f"{label}: unknown level {entry['level']}")
        if entry["nature"] not in NATURES:
            found.append(f"{label}: unknown nature {entry['nature']}")
        if entry["jurisdiction"] not in JURISDICTIONS:
            found.append(f"{label}: unknown jurisdiction {entry['jurisdiction']}")
        conditions.append((label, entry["applies_when"]))
        if "skill_applies_when" in entry:
            conditions.append((label, entry["skill_applies_when"]))
    for entry in table.get("escalations", []):
        conditions.append((f"escalation {entry.get('id', '?')}", entry.get("when")))
    for label, condition in conditions:
        try:
            evaluate(condition, {}, definitions, known)
        except ConditionError as exc:
            found.append(f"{label}: {exc}")
    return found


# --- Matrix ---

def _show(profile: dict, field: str) -> str:
    answer = read_answer(profile, field)
    if answer is None:
        return f"{field}: no answer"
    return f"{field} = {json.dumps(answer['value'], ensure_ascii=False)} ({answer.get('basis')})"


def _pending_text(profile: dict, pending: FrozenSet[Tuple[str, str]]) -> List[str]:
    lines = []
    for kind, item in sorted(pending):
        if kind == "missing":
            lines.append(f"no answer for {item}")
        elif kind == "assumed":
            lines.append(f"{_show(profile, item)} is an assumption")
        else:
            lines.append(item)
    return lines


def assess(entry: dict, profile: dict, definitions: Dict[str, Any], known: Dict[str, dict]) -> dict:
    result = evaluate(entry["applies_when"], profile, definitions, known)
    skill = bool(entry.get("baseline"))
    if not skill and "skill_applies_when" in entry:
        skill = evaluate(entry["skill_applies_when"], profile, definitions, known).value is True
    if result.certain and result.value:
        status, level = "applies", entry["level"]
        basis = {"legal-text": "law", "official-recommendation": "official-recommendation",
                 "skill-practice": "skill"}[entry["nature"]]
    elif result.certain:
        status = "does-not-apply"
        level, basis = ("recommended", "skill") if skill else ("not-applicable", None)
    else:
        status, level, basis = "to-confirm", "to-confirm", None
    leaning = None
    if status == "to-confirm" and result.value is not None:
        leaning = "applies" if result.value else "does-not-apply"
    return {
        "id": entry["id"], "domain": entry["domain"], "jurisdiction": entry["jurisdiction"],
        "title": entry["title"], "requires": entry["requires"],
        "status": status, "level": level, "level_basis": basis,
        "level_if_confirmed": entry["level"] if status == "to-confirm" else None,
        "applied_by_skill_regardless": skill,
        "leaning": leaning,
        "to_confirm": _pending_text(profile, result.pending) if status == "to-confirm" else [],
        "answers_read": [_show(profile, field) for field in sorted(result.fields)],
        "sources": list(entry["sources"]),
        "dates_and_amounts": f"references/regulatory-status.md, section {entry['status_section']}",
        "rules_file": entry["rules_file"],
        "rules_file_exists": (ROOT / entry["rules_file"]).is_file(),
        "template": entry.get("template"),
        "note": entry.get("note"),
    }


def country_notes(profile: dict, coverage: dict) -> List[dict]:
    covered = set(coverage.get("covered_countries", []))
    members = set(coverage.get("eu_member_states", []))
    notes: List[dict] = []
    countries: List[str] = []
    establishment = read_answer(profile, "operator.country_of_establishment")
    targets = read_answer(profile, "market.target_countries")
    if establishment is None:
        notes.append({"country": None, "kind": "to-confirm",
                      "text": "Country of establishment unknown: national rules to confirm."})
    else:
        countries.append(establishment["value"])
    if targets is None:
        notes.append({"country": None, "kind": "to-confirm",
                      "text": "Target countries unknown: national rules to confirm."})
    else:
        countries.extend(targets["value"])
    for code in sorted(set(countries)):
        if code in covered:
            continue
        if code in members:
            notes.append({"country": code, "kind": "not-verified",
                          "text": f"EU baseline applied; national rules not verified for {code}."})
        else:
            notes.append({"country": code, "kind": "outside-eu",
                          "text": f"{code} is outside the European Union: its law is not covered "
                                  "by this skill."})
    return notes


def condition_fields(table: dict, known: Dict[str, dict]) -> List[str]:
    """Profile fields read by at least one condition of the table."""
    definitions = table.get("definitions", {})
    conditions = [entry["applies_when"] for entry in table["obligations"]]
    conditions += [entry["skill_applies_when"] for entry in table["obligations"]
                   if "skill_applies_when" in entry]
    conditions += [entry["when"] for entry in table.get("escalations", [])]
    fields: set = set()
    for condition in conditions:
        fields |= evaluate(condition, {}, definitions, known).fields
    return sorted(fields)


def build_matrix(profile: dict, table: dict, schema: dict, today: Optional[dt.date] = None) -> dict:
    errors = schema_errors(profile, schema, schema)
    if errors:
        raise InputError("invalid profile:\n  " + "\n  ".join(errors))
    errors = check_table(table, schema)
    if errors:
        raise InputError("invalid decision table:\n  " + "\n  ".join(errors))
    known = schema_fields(schema)
    definitions = table.get("definitions", {})
    rows = [assess(entry, profile, definitions, known) for entry in table["obligations"]]

    assumed, missing = [], []
    for field in sorted(known):
        answer = read_answer(profile, field)
        if answer is not None and answer.get("basis") == "assumed":
            assumed.append({"field": field, "value": answer["value"], "note": answer.get("note")})
    for field in condition_fields(table, known):
        if read_answer(profile, field) is None:
            missing.append({"field": field,
                            "protective_reading": known[field].get("x-protective-assumption"),
                            "question": known[field].get("x-question")})

    escalations = []
    for entry in table.get("escalations", []):
        result = evaluate(entry["when"], profile, definitions, known)
        if result.certain and not result.value:
            continue
        escalations.append({
            "id": entry["id"], "title": entry["title"],
            "state": "flagged" if result.certain else "not-ruled-out",
            "to_confirm": _pending_text(profile, result.pending),
            "what_to_do": entry["what_to_do"],
        })
    countries = country_notes(profile, table.get("coverage", {}))
    for note in countries:
        if note["kind"] != "to-confirm":
            escalations.append({
                "id": "esc-country-not-covered", "title": f"Country not covered: {note['country']}",
                "state": "flagged", "to_confirm": [],
                "what_to_do": note["text"] + " Consult a local lawyer for that country.",
            })
    counts = {status: sum(1 for row in rows if row["status"] == status)
              for status in ("applies", "does-not-apply", "to-confirm")}
    return {
        "schema_version": 1,
        "generated": (today or dt.date.today()).isoformat(),
        "project_name": profile.get("project_name"),
        "disclaimer": DISCLAIMER,
        "to_confirm_rule": TO_CONFIRM_RULE,
        "assumptions": {"assumed_answers": assumed, "missing_answers": missing},
        "country_coverage": countries,
        "counts": counts,
        "obligations": rows,
        "beyond_the_skill": escalations,
        "closing": ("Consult a qualified professional (lawyer, data protection officer, "
                    "accessibility auditor) for every case listed under \"Beyond the skill\" and "
                    "before relying on this matrix. See references/scoping/out-of-scope.md."),
    }


LEVEL_TEXT = {
    ("applies", "mandatory"): "Mandatory: a legal text requires it",
    ("applies", "recommended", "official-recommendation"): "Recommended by a regulator or an official guide",
    ("applies", "recommended", "skill"): "Recommended by the skill",
    ("does-not-apply", "recommended"): "Recommended by the skill; no legal duty identified",
    ("does-not-apply", "not-applicable"): "Not applicable",
}


def level_text(row: dict) -> str:
    if row["status"] == "to-confirm":
        text = "Legal duty to confirm" if row["level_if_confirmed"] == "mandatory" \
            else "To confirm (a recommendation, not a legal duty)"
        if row["applied_by_skill_regardless"]:
            text += "; applied by the skill in any case"
        return text
    return (LEVEL_TEXT.get((row["status"], row["level"], row["level_basis"]))
            or LEVEL_TEXT[(row["status"], row["level"])])


def _cell(text: str) -> str:
    return text.replace("|", "\\|").replace("\n", " ")


def render_markdown(matrix: dict) -> str:
    out: List[str] = ["# Applicability matrix", ""]
    if matrix.get("project_name"):
        out += [f"Project: {matrix['project_name']}", ""]
    out += [f"Generated: {matrix['generated']}", "", f"> {matrix['disclaimer']}", ""]
    out += ["## Assumptions", "", matrix["to_confirm_rule"], ""]
    assumed = matrix["assumptions"]["assumed_answers"]
    missing = matrix["assumptions"]["missing_answers"]
    if not assumed and not missing:
        out += ["No answer was assumed and none is missing.", ""]
    if assumed:
        out += ["Answers recorded as assumptions (nobody confirmed them):", ""]
        for item in assumed:
            note = f" ({item['note']})" if item.get("note") else ""
            out.append(f"- `{item['field']}` = {json.dumps(item['value'], ensure_ascii=False)}{note}")
        out.append("")
    if missing:
        out += ["Answers missing, with the protective reading used until someone answers:", ""]
        for item in missing:
            reading = item["protective_reading"]
            if not isinstance(reading, str):
                reading = f"assume {json.dumps(reading)}"
            out.append(f"- `{item['field']}` (question {item['question']}): {reading}")
        out.append("")
    if matrix["country_coverage"]:
        out += ["## Country coverage", ""]
        out += [f"- {note['text']}" for note in matrix["country_coverage"]]
        out.append("")
    counts = matrix["counts"]
    out += ["## Obligations", "",
            f"{counts['applies']} apply, {counts['does-not-apply']} do not apply, "
            f"{counts['to-confirm']} to confirm. \"Legal status\" says whether a legal text or an "
            "official recommendation concerns the operator. \"Level for you\" keeps what the law "
            "requires apart from what the skill recommends.", ""]
    for key, label in DOMAINS:
        rows = [row for row in matrix["obligations"] if row["domain"] == key]
        if not rows:
            continue
        out += [f"### {label}", "",
                "| Obligation | Law | Legal status | Level for you | Why | Sources | Dates and amounts | Rules |",
                "|---|---|---|---|---|---|---|---|"]
        for row in rows:
            if row["status"] == "to-confirm":
                why = "To confirm: " + "; ".join(row["to_confirm"])
                if row["leaning"]:
                    why += f". Under the assumptions made it {row['leaning'].replace('-', ' ')}"
            else:
                why = "; ".join(row["answers_read"]) or "Applies to every site"
            rules = f"`{row['rules_file']}`" + ("" if row["rules_file_exists"] else " (planned)")
            if row["template"]:
                rules += f"; template `{row['template']}`"
            section = row["dates_and_amounts"].split("section ")[1]
            out.append("| " + " | ".join(_cell(cell) for cell in (
                f"**{row['title']}** (`{row['id']}`). {row['requires']}",
                row["jurisdiction"], row["status"], level_text(row), why,
                ", ".join(f"`{source}`" for source in row["sources"]),
                f"`regulatory-status.md` section {section}", rules)) + " |")
        out.append("")
    out += ["## Beyond the skill", ""]
    if matrix["beyond_the_skill"]:
        out += ["The skill stops on these points and refers to a professional:", ""]
        for item in matrix["beyond_the_skill"]:
            state = "" if item["state"] == "flagged" else \
                " (not ruled out: " + "; ".join(item["to_confirm"]) + ")"
            out.append(f"- **{item['title']}**{state}. {item['what_to_do']}")
    else:
        out.append("No such case appears from the profile. The agent still stops if it meets "
                   "one while working.")
    out += ["", matrix["closing"], ""]
    return "\n".join(out)


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Applicability matrix of a project profile.")
    parser.add_argument("profile", help="path to the profile, usually compliance/profile.json")
    parser.add_argument("--obligations", default=str(DEFAULT_TABLE), help="decision table")
    parser.add_argument("--schema", default=str(DEFAULT_SCHEMA), help="profile schema")
    parser.add_argument("--format", choices=("markdown", "json"), default="markdown",
                        help="format printed on standard output")
    parser.add_argument("--output-dir", help="also write applicability-matrix.md and .json there")
    args = parser.parse_args(argv)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    try:
        profile = load_json(Path(args.profile))
        matrix = build_matrix(profile, load_json(Path(args.obligations)), load_json(Path(args.schema)))
    except InputError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    markdown = render_markdown(matrix)
    as_json = json.dumps(matrix, ensure_ascii=False, indent=2) + "\n"
    if args.output_dir:
        target = Path(args.output_dir)
        target.mkdir(parents=True, exist_ok=True)
        (target / "applicability-matrix.md").write_bytes(markdown.encode("utf-8"))
        (target / "applicability-matrix.json").write_bytes(as_json.encode("utf-8"))
    sys.stdout.write(as_json if args.format == "json" else markdown)
    return 0


if __name__ == "__main__":
    sys.exit(main())
