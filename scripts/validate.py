#!/usr/bin/env python3
"""Contrôles de structure du skill eu-web-compliance.

Vérifie, sans dépendance externe (Python 3.8 minimum) :

  1. la présence des fichiers obligatoires du dépôt ;
  2. l'en-tête de SKILL.md (nom, description, licence, longueur) ;
  3. les noms de fichiers, les fins de ligne et la taille des fichiers ;
  4. la validité des fichiers JSON ;
  5. le registre des sources (references/sources.json) ;
  6. l'état réglementaire (references/regulatory-status.md) : chaque fait cite
     une source du registre ;
  7. la traçabilité des règles : chaque case à cocher d'un fichier de référence
     se termine par une source entre crochets ;
  8. les liens internes des fichiers Markdown.

Usage :
    python scripts/validate.py                 # contrôle le dépôt courant
    python scripts/validate.py --strict        # les avertissements font échouer
    python scripts/validate.py --require-skill # SKILL.md devient obligatoire

Codes de sortie : 0 conforme, 1 erreur trouvée, 2 erreur d'usage.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path
from typing import Iterable, List, NamedTuple, Optional, Set

MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_SKILL_LINES = 300
MAX_REFERENCE_LINES = 500
STALE_DAYS = 90

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "compliance", ".playwright-mcp"}
TEXT_SUFFIXES = {".md", ".json", ".py", ".yml", ".yaml", ".sh", ".txt", ".html", ".css", ".js"}
REQUIRED_FILES = ("LICENSE", "README.md", "NOTICE.md", "CHANGELOG.md", "references/sources.json",
                  "references/regulatory-status.md")

NAME_LOWER = re.compile(r"^\.?[a-z0-9][a-z0-9.-]*$")
NAME_UPPER = re.compile(r"^[A-Z][A-Z0-9-]*(\.[a-z0-9]+)*$")  # README.md, LICENSE, README.fr.md
NAME_TEST = re.compile(r"^test_[a-z0-9_]+\.py$")
NAME_MODULE = re.compile(r"^[a-z][a-z0-9_]*\.py$")  # module Python importable par les tests
SKILL_NAME = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MD_LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
RULE_LINE = re.compile(r"^\s*- \[[ xX]\] ")
TRAILING_TAG = re.compile(r"\[([^\[\]]+)\]\s*$")
SRC_REF = re.compile(r"\[src:\s*([^\]]+)\]")
STATUS_DATE = re.compile(r"^Last verified:\s*(\d{4}-\d{2}-\d{2})\s*$", re.M)

SOURCE_FIELDS = ("id", "title", "publisher", "url", "kind", "version", "consulted", "licence", "proof")
SOURCE_KINDS = {"eu-law", "fr-law", "standard", "guidance", "soft-law", "tool", "upstream-skill", "licence"}
FREE_TAG = "best practice"


class Finding(NamedTuple):
    level: str  # "error", "warning" ou "info" (non compté, même avec --strict)
    path: str
    message: str


def error(path: str, message: str) -> Finding:
    return Finding("error", path, message)


def warning(path: str, message: str) -> Finding:
    return Finding("warning", path, message)


def iter_files(root: Path) -> Iterable[Path]:
    for path in sorted(root.rglob("*")):
        if path.is_file() and not SKIP_DIRS.intersection(path.relative_to(root).parts):
            yield path


def rel(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def is_generated(relpath: str) -> bool:
    """Les textes officiels générés (RGAA par version) échappent aux limites de taille."""
    return bool(re.match(r"references/accessibility/rgaa/[^/]+/", relpath))


def check_required(root: Path) -> List[Finding]:
    return [error(name, "fichier obligatoire absent") for name in REQUIRED_FILES
            if not (root / name).is_file()]


def parse_frontmatter(text: str) -> Optional[dict]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None
    fields: dict = {}
    key = None
    for line in lines[1:]:
        if line.strip() == "---":
            return fields
        match = re.match(r"^([A-Za-z][\w-]*):\s*(.*)$", line)
        if match:
            key = match.group(1)
            value = match.group(2).strip()
            fields[key] = "" if value in (">", ">-", "|", "|-") else value.strip("\"'")
        elif key and line.startswith((" ", "\t")):
            fields[key] = (fields[key] + " " + line.strip()).strip()
    return None  # en-tête jamais refermé


def check_skill(root: Path, required: bool) -> List[Finding]:
    path = root / "SKILL.md"
    if not path.is_file():
        if required:
            return [error("SKILL.md", "absent (écrit à l'étape M4)")]
        return [Finding("info", "SKILL.md", "absent (écrit à l'étape M4)")]
    text = path.read_text(encoding="utf-8")
    fields = parse_frontmatter(text)
    if fields is None:
        return [error("SKILL.md", "en-tête YAML absent ou non refermé")]
    found = []
    name = fields.get("name", "")
    if not SKILL_NAME.match(name) or len(name) > 64:
        found.append(error("SKILL.md", "name : minuscules, chiffres et tirets, 64 caractères au plus"))
    if not 1 <= len(fields.get("description", "")) <= 1024:
        found.append(error("SKILL.md", "description : entre 1 et 1024 caractères"))
    if not fields.get("license"):
        found.append(error("SKILL.md", "license : champ absent"))
    if len(text.splitlines()) > MAX_SKILL_LINES:
        found.append(error("SKILL.md", f"plus de {MAX_SKILL_LINES} lignes"))
    return found


def check_files(root: Path) -> List[Finding]:
    found = []
    for path in iter_files(root):
        relpath = rel(root, path)
        name = path.name
        if not (NAME_LOWER.match(name) or NAME_UPPER.match(name)
                or (relpath.startswith("tests/") and NAME_TEST.match(name))
                or (relpath.startswith("scripts/") and NAME_MODULE.match(name))):
            found.append(error(relpath, "nom de fichier : minuscules, chiffres, points et tirets"))
        if path.stat().st_size > MAX_FILE_BYTES:
            found.append(error(relpath, "fichier de plus de 5 Mo"))
        if path.suffix not in TEXT_SUFFIXES:
            continue
        data = path.read_bytes()
        if b"\r\n" in data:
            found.append(error(relpath, "fins de ligne CRLF (LF attendu)"))
        if path.suffix == ".json":
            try:
                json.loads(data.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                found.append(error(relpath, f"JSON invalide : {exc}"))
        if (path.suffix == ".md" and relpath.startswith("references/") and not is_generated(relpath)
                and data.count(b"\n") > MAX_REFERENCE_LINES):
            found.append(error(relpath, f"plus de {MAX_REFERENCE_LINES} lignes : découper le fichier"))
    return found


def parse_date(value: object) -> Optional[dt.date]:
    if not isinstance(value, str) or not ISO_DATE.match(value):
        return None
    try:
        return dt.date.fromisoformat(value)
    except ValueError:
        return None


def load_sources(root: Path) -> Optional[dict]:
    path = root / "references" / "sources.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) and isinstance(data.get("sources"), list) else None


def check_sources(root: Path, today: dt.date) -> List[Finding]:
    relpath = "references/sources.json"
    data = load_sources(root)
    if data is None:
        return [error(relpath, "registre illisible ou sans liste « sources »")]
    found = []
    if parse_date(data.get("last_review")) is None:
        found.append(error(relpath, "last_review : date AAAA-MM-JJ attendue"))
    seen: Set[str] = set()
    for index, source in enumerate(data["sources"]):
        label = f"{relpath} [{source.get('id', index) if isinstance(source, dict) else index}]"
        if not isinstance(source, dict):
            found.append(error(label, "entrée qui n'est pas un objet"))
            continue
        missing = [field for field in SOURCE_FIELDS if not source.get(field)]
        if missing:
            found.append(error(label, "champs absents : " + ", ".join(missing)))
            continue
        if source["id"] in seen:
            found.append(error(label, "identifiant en double"))
        seen.add(source["id"])
        if not SKILL_NAME.match(source["id"]):
            found.append(error(label, "id : minuscules, chiffres et tirets"))
        if not str(source["url"]).startswith("https://"):
            found.append(error(label, "url : adresse https attendue"))
        if source["kind"] not in SOURCE_KINDS:
            found.append(error(label, "kind inconnu : " + str(source["kind"])))
        if source["proof"] != "P":
            found.append(error(label, "proof : seules les sources vérifiées (P) entrent dans le skill"))
        consulted = parse_date(source["consulted"])
        if consulted is None:
            found.append(error(label, "consulted : date AAAA-MM-JJ attendue"))
        elif consulted > today:
            found.append(error(label, "consulted : date dans le futur"))
        elif (today - consulted).days > STALE_DAYS:
            found.append(warning(label, f"consultée il y a plus de {STALE_DAYS} jours : à re-vérifier"))
    return found


def source_ids(root: Path) -> Set[str]:
    data = load_sources(root) or {"sources": []}
    return {s["id"] for s in data["sources"] if isinstance(s, dict) and s.get("id")}


def source_tags(root: Path) -> Set[str]:
    data = load_sources(root) or {"sources": []}
    return {s["tag"] for s in data["sources"] if isinstance(s, dict) and s.get("tag")}


def check_status(root: Path, today: dt.date) -> List[Finding]:
    relpath = "references/regulatory-status.md"
    path = root / relpath
    if not path.is_file():
        return []
    text = path.read_text(encoding="utf-8")
    found = []
    match = STATUS_DATE.search(text)
    checked = parse_date(match.group(1)) if match else None
    if checked is None:
        found.append(error(relpath, "ligne « Last verified: AAAA-MM-JJ » absente"))
    elif (today - checked).days > STALE_DAYS:
        found.append(warning(relpath, f"vérifié il y a plus de {STALE_DAYS} jours"))
    known = source_ids(root)
    for number, line in enumerate(text.splitlines(), 1):
        if not line.startswith("- "):
            continue
        refs = [ref.strip() for group in SRC_REF.findall(line) for ref in group.split(",")]
        if not refs:
            found.append(error(f"{relpath}:{number}", "fait sans source : ajouter [src: identifiant]"))
        for ref in refs:
            if ref not in known:
                found.append(error(f"{relpath}:{number}", f"source inconnue du registre : {ref}"))
    return found


def check_rules(root: Path) -> List[Finding]:
    tags = source_tags(root)
    found = []
    for path in iter_files(root):
        relpath = rel(root, path)
        if path.suffix != ".md" or not relpath.startswith("references/") or is_generated(relpath):
            continue
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if not RULE_LINE.match(line):
                continue
            match = TRAILING_TAG.search(line[RULE_LINE.match(line).end():])
            where = f"{relpath}:{number}"
            if not match:
                found.append(error(where, "règle sans source entre crochets en fin de ligne"))
                continue
            tag = match.group(1).strip()
            if tag != FREE_TAG and not any(tag == t or tag.startswith(t + " ") for t in tags):
                found.append(error(where, f"source non déclarée dans le registre : [{tag}]"))
    return found


def check_links(root: Path) -> List[Finding]:
    found = []
    for path in iter_files(root):
        if path.suffix != ".md":
            continue
        relpath = rel(root, path)
        in_fence = False
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if line.lstrip().startswith("```"):
                in_fence = not in_fence
                continue
            if in_fence:
                continue
            for target in MD_LINK.findall(re.sub(r"`[^`]*`", "", line)):
                if re.match(r"^(https?:|mailto:|#)", target):
                    continue
                target_path = target.split("#", 1)[0]
                if target_path and not (path.parent / target_path).exists():
                    found.append(error(f"{relpath}:{number}", f"lien interne cassé : {target}"))
    return found


def validate(root: Path, today: Optional[dt.date] = None, require_skill: bool = False) -> List[Finding]:
    today = today or dt.date.today()
    return (check_required(root) + check_skill(root, require_skill) + check_files(root)
            + check_sources(root, today) + check_status(root, today) + check_rules(root)
            + check_links(root))


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Contrôles de structure du skill.")
    parser.add_argument("root", nargs="?", default=str(Path(__file__).resolve().parent.parent))
    parser.add_argument("--strict", action="store_true", help="les avertissements font échouer")
    parser.add_argument("--require-skill", action="store_true", help="SKILL.md obligatoire")
    parser.add_argument("--today", help="date de référence AAAA-MM-JJ (pour les tests)")
    args = parser.parse_args(argv)
    if hasattr(sys.stdout, "reconfigure"):  # accents lisibles dans une console Windows
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    root = Path(args.root)
    today = parse_date(args.today) if args.today else dt.date.today()
    if not root.is_dir() or today is None:
        print("usage : dossier introuvable ou date invalide", file=sys.stderr)
        return 2
    findings = validate(root, today, args.require_skill)
    for finding in findings:
        label = {"error": "ERREUR", "warning": "AVERT."}.get(finding.level, "INFO  ")
        print(f"{label}  {finding.path} : {finding.message}")
    errors = sum(1 for f in findings if f.level == "error")
    warnings = sum(1 for f in findings if f.level == "warning")
    print(f"{errors} erreur(s), {warnings} avertissement(s)")
    return 1 if errors or (args.strict and warnings) else 0


if __name__ == "__main__":
    sys.exit(main())
