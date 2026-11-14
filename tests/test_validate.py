"""Tests de scripts/validate.py. Lancer : python -m unittest discover -s tests"""

import datetime as dt
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import validate as v  # noqa: E402

TODAY = dt.date(2026, 11, 14)

SOURCE = {
    "id": "wcag-22", "title": "WCAG 2.2", "publisher": "W3C", "url": "https://www.w3.org/TR/WCAG22/",
    "kind": "standard", "version": "2024-12-12", "consulted": "2026-11-14",
    "licence": "W3C Document License", "proof": "P", "tag": "WCAG",
}
STATUS = "# État\n\nLast verified: 2026-11-14\n\n- WCAG 2.2 est une recommandation. [src: wcag-22]\n"


def write(root: Path, name: str, text: str) -> None:
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(text.encode("utf-8"))


def make_repo(root: Path, sources=None, status: str = STATUS) -> Path:
    for name in ("LICENSE", "README.md", "NOTICE.md", "CHANGELOG.md"):
        write(root, name, "contenu\n")
    registry = {"schema_version": 1, "last_review": "2026-11-14",
                "sources": [SOURCE] if sources is None else sources}
    write(root, "references/sources.json", json.dumps(registry) + "\n")
    write(root, "references/regulatory-status.md", status)
    return root


class ValidateTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def run_checks(self, **kwargs):
        return v.validate(self.root, TODAY, **kwargs)

    def errors(self, **kwargs):
        return [f for f in self.run_checks(**kwargs) if f.level == "error"]

    def assert_error(self, fragment, **kwargs):
        messages = [f"{f.path} {f.message}" for f in self.errors(**kwargs)]
        self.assertTrue(any(fragment in m for m in messages), messages)

    def test_valid_repo_has_no_error(self):
        make_repo(self.root)
        self.assertEqual(self.errors(), [])
        self.assertEqual([f.path for f in self.run_checks()], ["SKILL.md"])  # avertissement seul

    def test_missing_required_file(self):
        make_repo(self.root)
        (self.root / "NOTICE.md").unlink()
        self.assert_error("NOTICE.md fichier obligatoire absent")

    def test_unverified_source_is_rejected(self):
        make_repo(self.root, sources=[dict(SOURCE, proof="S")])
        self.assert_error("seules les sources vérifiées")

    def test_source_missing_field_and_bad_url(self):
        make_repo(self.root, sources=[dict(SOURCE, licence=""), dict(SOURCE, id="autre", url="http://x")])
        self.assert_error("champs absents : licence")
        self.assert_error("adresse https attendue")

    def test_stale_source_warns_and_strict_fails(self):
        make_repo(self.root, sources=[dict(SOURCE, consulted="2026-01-01")])
        self.assertEqual(self.errors(), [])
        self.assertTrue(any("à re-vérifier" in f.message for f in self.run_checks()))
        args = [str(self.root), "--today", "2026-11-14"]
        self.assertEqual(v.main(args), 0)
        self.assertEqual(v.main(args + ["--strict"]), 1)

    def test_status_fact_needs_known_source(self):
        make_repo(self.root, status=STATUS + "- Fait sans source.\n- Autre fait. [src: inconnue]\n")
        self.assert_error("fait sans source")
        self.assert_error("source inconnue du registre : inconnue")

    def test_status_needs_date_line(self):
        make_repo(self.root, status="# État\n\n- Fait. [src: wcag-22]\n")
        self.assert_error("Last verified")

    def test_rule_traceability(self):
        make_repo(self.root)
        write(self.root, "references/accessibility/rules.md",
              "- [ ] Focus visible [WCAG 2.4.7]\n- [ ] Conseil maison [best practice]\n"
              "- [ ] Règle sans source\n- [ ] Règle mal sourcée [RGPD art. 7]\n- puce ordinaire\n")
        errors = [f.path for f in self.errors()]
        self.assertEqual(errors, ["references/accessibility/rules.md:3", "references/accessibility/rules.md:4"])

    def test_links(self):
        make_repo(self.root)
        write(self.root, "docs/guide.md",
              "[ok](../README.md) [web](https://example.org) [ancre](#titre)\n"
              "[cassé](absent.md)\n```\n[ignoré](dans-un-bloc.md)\n```\n")
        self.assertEqual([f.path for f in self.errors()], ["docs/guide.md:2"])

    def test_crlf_and_bad_names(self):
        make_repo(self.root)
        write(self.root, "docs/crlf.md", "ligne\r\n")
        write(self.root, "docs/Mon Fichier.md", "x\n")
        self.assert_error("docs/crlf.md fins de ligne CRLF")
        self.assert_error("docs/Mon Fichier.md nom de fichier")

    def test_invalid_json_and_long_reference(self):
        make_repo(self.root)
        write(self.root, "schemas/casse.json", "{")
        write(self.root, "references/long.md", "ligne\n" * 501)
        write(self.root, "references/accessibility/rgaa/4.1.2/criteres.md", "ligne\n" * 501)
        self.assert_error("schemas/casse.json JSON invalide")
        self.assert_error("references/long.md plus de 500 lignes")
        self.assertFalse(any("rgaa/4.1.2" in f.path for f in self.errors()))

    def test_skill_frontmatter(self):
        make_repo(self.root)
        write(self.root, "SKILL.md", "---\nname: Mauvais Nom\ndescription: >-\n  Texte\n  suite\n---\n# Titre\n")
        self.assert_error("SKILL.md name")
        self.assert_error("SKILL.md license")
        write(self.root, "SKILL.md", "---\nname: eu-web-compliance\ndescription: Texte\nlicense: MIT\n---\n")
        self.assertEqual(self.run_checks(require_skill=True), [])

    def test_skill_required_flag(self):
        make_repo(self.root)
        self.assert_error("SKILL.md absent", require_skill=True)


if __name__ == "__main__":
    unittest.main()
