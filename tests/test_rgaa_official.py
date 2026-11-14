"""Tests of scripts/rgaa_official.py. Run: python -m unittest discover -s tests"""

import contextlib
import hashlib
import io
import json
import re
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import rgaa_official as ro  # noqa: E402

RGAA = Path(ro.RGAA_REL)
# Values pinned for RGAA 4.1.2: update them when ACTIVE changes (see references/accessibility/rgaa/5/README.md).
VERSION = "4.1.2"
THEMES = 13
CRITERIA = 106
SHA256 = {
    "criteres.json": "25f71c18150d15514253badd883d0c62e329bc3928814779dc4b41497002a13a",
    "glossaire.json": "6855035e03fd9c47aee743976897f9958539e5b2be88996a41a1b273e29e01a4",
    "methodologies.json": "199dcd99b3c9783465c74936e721f2d905bfbd286ff6a3197358912e2ba1b84d",
}
WCAG_22_ADDED = ("2.4.11", "2.5.7", "2.5.8", "3.2.6", "3.3.7", "3.3.8")


def run(root: Path, *args: str):
    """(exit code, printed output) of the script on a given repository root."""
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = ro.main(["--root", str(root), *args])
    return code, out.getvalue() + err.getvalue()


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def source_strings(criterion: ro.Criterion):
    """Every official string of a criterion, as it stands in criteres.json."""
    def walk(value):
        if isinstance(value, str):
            yield value
        elif isinstance(value, tuple):
            for item in value:
                yield from walk(item)
    yield criterion.title
    for _, lines in criterion.tests:
        yield from lines
    for entry in criterion.special_cases + criterion.technical_notes:
        yield from (text for text in walk(entry) if text != "ul")


class CommittedFilesTest(unittest.TestCase):
    """The files committed in the repository."""

    @classmethod
    def setUpClass(cls):
        cls.base = ROOT / RGAA / VERSION
        cls.themes = ro.parse_criteria(ro.read_json(cls.base / "sources" / "criteres.json"))
        cls.criteria = [criterion for theme in cls.themes for criterion in theme.criteria]
        cls.modes = load(cls.base / "evaluation-modes.json")
        cls.mapping = load(ROOT / ro.MAPPING_REL)

    def test_active_version(self):
        self.assertEqual(ro.active_version(ROOT), VERSION)

    def test_sources_are_unmodified(self):
        for name, expected in SHA256.items():
            digest = hashlib.sha256((self.base / "sources" / name).read_bytes()).hexdigest()
            self.assertEqual(digest, expected, name)

    def test_generated_files_match_source(self):
        code, output = run(ROOT)
        self.assertEqual(code, 0, output)

    def test_themes_and_criteria_are_all_present(self):
        self.assertEqual(len(self.themes), THEMES)
        self.assertEqual(len(self.criteria), CRITERIA)
        files = sorted(self.base.glob("criteria-*.md"))
        self.assertEqual(len(files), THEMES)
        headings = [number for path in files
                    for number in re.findall(r"^## Criterion (\d+\.\d+)$", path.read_text(encoding="utf-8"), re.M)]
        self.assertEqual(headings, [criterion.number for criterion in self.criteria])

    def test_each_file_says_it_is_generated(self):
        for path in list(self.base.glob("criteria-*.md")) + [self.base / "glossary.md", self.base / "index.md"]:
            head = path.read_text(encoding="utf-8").splitlines()[:4]
            self.assertTrue(any("Do not edit by hand" in line for line in head), path.name)

    def test_generated_files_use_lf(self):
        for path in list(self.base.glob("*.md")) + [ROOT / ro.MAPPING_REL, self.base / "evaluation-modes.json"]:
            self.assertNotIn(b"\r", path.read_bytes(), path.name)

    def test_official_text_is_verbatim(self):
        for theme in self.themes:
            text = (self.base / ro.theme_file(theme)).read_text(encoding="utf-8")
            restored = text.replace("](glossary.md#", "](#")  # undo the only change made to the source
            for criterion in theme.criteria:
                for string in source_strings(criterion):
                    self.assertIn(string, restored, criterion.number)

    def test_glossary_is_verbatim_and_links_resolve(self):
        glossary = load(self.base / "sources" / "glossaire.json")["glossary"]
        text = (self.base / "glossary.md").read_text(encoding="utf-8")
        for entry in glossary:
            self.assertIn(f"## {entry['title']}\n\n{entry['body'].strip(chr(10))}\n", text, entry["title"])
        anchors = set(re.findall(r'^<a id="([^"]+)"></a>$', text, re.M))
        self.assertEqual(len(anchors), len(glossary))
        for path in self.base.glob("criteria-*.md"):
            for anchor in re.findall(r"\]\(glossary\.md#([^)]+)\)", path.read_text(encoding="utf-8")):
                self.assertIn(anchor, anchors, path.name)

    def test_every_criterion_has_exactly_one_mode(self):
        self.assertEqual(ro.check_modes(self.modes, self.themes), [])
        self.assertEqual(sorted(self.modes["criteria"]), sorted(criterion.number for criterion in self.criteria))
        for number, entry in self.modes["criteria"].items():
            self.assertIn(entry["mode"], ro.MODES, number)
        self.assertEqual(self.modes["meta"]["status"], "provisional")

    def test_mapping_matches_official_wcag_references(self):
        mapped = self.mapping["rgaa"]["criteria"]
        self.assertEqual(self.mapping["rgaa"]["version"], VERSION)
        self.assertEqual(list(mapped), [criterion.number for criterion in self.criteria])
        for criterion in self.criteria:
            entry = mapped[criterion.number]
            self.assertEqual(entry["source_labels"], list(criterion.wcag_labels), criterion.number)
            numbers = {ro.WCAG_LABEL.match(label).group(1) for label in criterion.wcag_labels}
            self.assertEqual(set(entry["wcag"]), numbers, criterion.number)
            self.assertTrue(entry["wcag"], f"{criterion.number}: the official file lists no success criterion")
            for number in entry["wcag"]:
                self.assertIn(criterion.number, self.mapping["wcag"][number]["rgaa"])

    def test_mapping_reverse_index_and_clauses(self):
        mapped = self.mapping["rgaa"]["criteria"]
        for number, entry in self.mapping["wcag"].items():
            listed = [criterion for criterion, value in mapped.items() if number in value["wcag"]]
            self.assertEqual(entry["rgaa"], listed or None, number)
            self.assertEqual(entry["rgaa_note"] is None, bool(listed), number)
            self.assertIn(entry["level"], ("A", "AA"), number)
            clause = entry["en_301_549"]["V4.1.1"]
            if entry["wcag_22_change"] == "removed":
                self.assertIsNone(clause, number)
                self.assertTrue(entry["en_301_549_note"], number)
            else:
                self.assertEqual(clause, "9." + number)  # numbering rule of clause 9

    def test_mapping_holds_the_wcag_22_additions_without_guessing(self):
        added = [number for number, entry in self.mapping["wcag"].items() if entry["wcag_22_change"] == "added"]
        self.assertEqual(tuple(added), WCAG_22_ADDED)
        for number in WCAG_22_ADDED:
            self.assertIsNone(self.mapping["wcag"][number]["rgaa"], number)
            self.assertTrue(self.mapping["wcag"][number]["rgaa_note"], number)

    def test_mapping_meta_states_its_sources(self):
        meta = self.mapping["meta"]
        for key in ("date", "sources", "official", "not_official", "en_301_549"):
            self.assertTrue(meta.get(key), key)
        registry = {source["id"] for source in load(ROOT / "references" / "sources.json")["sources"]}
        for source in meta["sources"]:
            self.assertIn(source["id"], registry)


class WorkingCopyTest(unittest.TestCase):
    """Behaviour of the script on a temporary copy of the RGAA data."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        shutil.copytree(ROOT / RGAA, self.root / RGAA)
        shutil.copy(ROOT / ro.MAPPING_REL, self.root / ro.MAPPING_REL)
        self.base = self.root / RGAA / VERSION
        self.generated = sorted(self.base.glob("criteria-*.md")) + [self.base / "glossary.md", self.base / "index.md"]

    def tearDown(self):
        self.tmp.cleanup()

    def edit_json(self, path: Path, change) -> None:
        data = load(path)
        change(data)
        path.write_bytes((json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))

    def test_generation_is_deterministic(self):
        for path in self.generated:
            path.unlink()
        self.edit_json(self.root / ro.MAPPING_REL, lambda data: data.update(rgaa={}))
        self.assertEqual(run(self.root)[0], 1)
        code, output = run(self.root, "--write")
        self.assertEqual(code, 0, output)
        for path in self.generated + [self.root / ro.MAPPING_REL]:
            committed = ROOT / path.relative_to(self.root)
            self.assertEqual(path.read_bytes(), committed.read_bytes(), path.name)
        code, output = run(self.root, "--write")
        self.assertEqual(code, 0, output)
        self.assertNotIn("written:", output)

    def test_tampered_generated_file_is_detected(self):
        for path in (self.generated[0], self.base / "glossary.md", self.base / "index.md"):
            original = path.read_bytes()
            path.write_bytes(original.replace(b"image", b"imagE", 1) if b"image" in original else original + b"x\n")
            code, output = run(self.root)
            self.assertEqual(code, 1, path.name)
            self.assertIn(f"{path.name}: differs from the source", output)
            path.write_bytes(original)
        self.assertEqual(run(self.root)[0], 0)

    def test_tampered_mapping_is_detected_and_repaired(self):
        self.edit_json(self.root / ro.MAPPING_REL,
                       lambda data: data["rgaa"]["criteria"]["1.1"]["wcag"].append("2.4.11"))
        code, output = run(self.root)
        self.assertEqual(code, 1)
        self.assertIn("mapping.json: differs from the source", output)
        self.assertEqual(run(self.root, "--write")[0], 0)
        self.assertEqual((self.root / ro.MAPPING_REL).read_bytes(), (ROOT / ro.MAPPING_REL).read_bytes())

    def test_missing_and_stray_generated_files_are_detected(self):
        self.generated[3].unlink()
        (self.base / "criteria-99-ancien.md").write_text("stray\n", encoding="utf-8")
        code, output = run(self.root)
        self.assertEqual(code, 1)
        self.assertIn(f"{self.generated[3].name}: missing", output)
        self.assertIn("criteria-99-ancien.md: generated file with no counterpart", output)

    def test_wcag_reference_absent_from_mapping_is_an_error(self):
        self.edit_json(self.root / ro.MAPPING_REL, lambda data: data["wcag"].pop("1.1.1"))
        code, output = run(self.root, "--write")
        self.assertEqual(code, 1)
        self.assertIn("WCAG 1.1.1", output)
        self.assertIn("never by guessing", output)

    def test_modes_file_is_checked(self):
        path = self.base / "evaluation-modes.json"
        cases = (
            (lambda data: data["criteria"].pop("1.1"), "criterion 1.1 has no mode"),
            (lambda data: data["criteria"].update({"99.1": {"mode": "code"}}), "criterion 99.1 is not in criteres.json"),
            (lambda data: data["criteria"]["1.2"].update(mode="automatic"), "unknown mode 'automatic'"),
            (lambda data: data["criteria"]["1.2"].update(code_proves=None), "needs `code_proves`"),
            (lambda data: data["criteria"]["1.7"].update(remains=None), "criterion 1.7 needs `remains`"),
            (lambda data: data["criteria"]["1.1"].update(remains="x"), "is `code` and carries nothing else"),
            (lambda data: data["criteria"]["1.5"].update(check=None), "names its `check`"),
            (lambda data: data["criteria"]["3.2"].update(check="colour"), "unknown check 'colour'"),
        )
        original = path.read_bytes()
        for change, message in cases:
            self.edit_json(path, change)
            code, output = run(self.root)
            self.assertEqual(code, 1, message)
            self.assertIn(message, output)
            path.write_bytes(original)

    def test_criterion_given_two_modes_is_refused(self):
        path = self.base / "evaluation-modes.json"
        text = path.read_text(encoding="utf-8")
        doubled = text.replace('"1.9": {', '"1.1": {', 1)
        self.assertNotEqual(text, doubled)
        path.write_bytes(doubled.encode("utf-8"))
        code, output = run(self.root)
        self.assertEqual(code, 2)
        self.assertIn("duplicate key(s): 1.1", output)

    def test_read_errors_give_exit_code_2(self):
        (self.root / RGAA / "ACTIVE").write_text("latest\n", encoding="utf-8")
        self.assertEqual(run(self.root)[0], 2)
        (self.root / RGAA / "ACTIVE").write_text("7\n", encoding="utf-8")
        self.assertEqual(run(self.root)[0], 2)  # no such version folder

    def test_unexpected_source_structure_is_refused(self):
        path = self.base / "sources" / "criteres.json"
        path.write_bytes(b'{"topics": [{"number": 1, "topic": "Images", "criteria": [{"criterion": {}}]}]}\n')
        code, output = run(self.root, "--write")
        self.assertEqual(code, 2)
        self.assertIn("expected structure", output)

    def test_version_comes_from_active_file(self):
        (self.root / RGAA / VERSION).rename(self.root / RGAA / "9.9")
        (self.root / RGAA / "ACTIVE").write_text("9.9\n", encoding="utf-8")
        code, output = run(self.root, "--write")
        self.assertEqual(code, 0, output)
        self.assertEqual(run(self.root)[0], 0)
        self.assertEqual(load(self.root / ro.MAPPING_REL)["rgaa"]["version"], "9.9")
        first = (self.root / RGAA / "9.9" / "criteria-01-images.md").read_text(encoding="utf-8").splitlines()[0]
        self.assertEqual(first, "# RGAA 9.9 — Theme 1: Images")


class HelpersTest(unittest.TestCase):
    def test_slug_matches_the_anchors_of_the_official_file(self):
        self.assertEqual(ro.slug("Image porteuse d’information"), "image-porteuse-d-information")
        self.assertEqual(ro.slug("Média temporel (type son, vidéo et synchronisé)"),
                         "media-temporel-type-son-video-et-synchronise")

    def test_only_links_to_known_glossary_entries_are_rewritten(self):
        anchors = frozenset({"contraste"})
        text = "Le [contraste](#contraste) et la [table](#table-descriptions-techniques)."
        self.assertEqual(ro.official(text, anchors),
                         "Le [contraste](glossary.md#contraste) et la [table](#table-descriptions-techniques).")


if __name__ == "__main__":
    unittest.main()
