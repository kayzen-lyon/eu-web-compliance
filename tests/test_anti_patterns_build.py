"""Le catalogue d'anti-patterns est généré : les fichiers versionnés doivent sortir à l'identique du générateur.

Lancer : python -m unittest discover -s tests
Pour régénérer après une modification des données : python scripts/anti_patterns/build.py references/accessibility
"""

import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "scripts" / "anti_patterns" / "build.py"
REFS = ROOT / "references" / "accessibility"


class AntiPatternsBuildTest(unittest.TestCase):
    def test_generated_files_match_committed_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = subprocess.run([sys.executable, str(BUILD), tmp], capture_output=True, text=True, encoding="utf-8")
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            generated = sorted(Path(tmp).glob("anti-patterns*.md"))
            self.assertEqual(len(generated), 7)
            for path in generated:
                with self.subTest(file=path.name):
                    self.assertEqual(path.read_bytes(), (REFS / path.name).read_bytes(),
                                     f"{path.name} differs: regenerate it instead of editing it by hand")

    def test_catalogue_json_is_usable(self):
        text = (REFS / "anti-patterns.md").read_text(encoding="utf-8")
        entries = json.loads(re.search(r"```json\n(.*?)\n```", text, re.S).group(1))
        ids = [e["id"] for e in entries]
        self.assertEqual(len(ids), len(set(ids)), "duplicate anti-pattern id")
        for entry in entries:
            self.assertIn(entry["severity"], {"blocking", "major", "minor"})
            self.assertIn(entry["confidence"], {"certain", "heuristic"})
            for detector in entry["detect"]:
                if detector["type"] == "regex":
                    re.compile(detector["value"])
                    if detector.get("unless"):
                        re.compile(detector["unless"])

    def test_link_underline_detector_ignores_navigation_links(self):
        text = (REFS / "anti-patterns.md").read_text(encoding="utf-8")
        entries = json.loads(re.search(r"```json\n(.*?)\n```", text, re.S).group(1))
        entry = next(e for e in entries if e["id"] == "AP-VIS-02")
        detector = next(d for d in entry["detect"] if d["type"] == "regex")
        self.assertEqual(detector.get("page_condition"), "link-in-text-without-underline")
        rx = re.compile(detector["value"], re.I)
        flagged = [
            "a { color: #0b5fff; text-decoration: none; }",
            "a:link, a:visited { text-decoration: none }",
            "main a { text-decoration: none }",
            ".prose p > a { color: teal; text-decoration: none }",
            "@media (min-width: 40em) { a { text-decoration: none } }",
            "nav a, a { text-decoration: none }",
        ]
        ignored = [
            "nav a { text-decoration: none }",
            ".site-header a { text-decoration: none }",
            "footer a, .footer-links a { text-decoration: none }",
            ".menu li a { text-decoration: none }",
            "ul.links a { text-decoration: none }",
            "header nav a:visited { text-decoration: none }",
            "a.btn { text-decoration: none }",
            ".button-link a { text-decoration: none }",
            "[role=navigation] a { text-decoration: none }",
            "a:hover { text-decoration: none }",
            "main a { text-decoration: underline }",
        ]
        for css in flagged:
            with self.subTest(css=css):
                self.assertTrue(rx.search(".x { color: red; }\n" + css))
        for css in ignored:
            with self.subTest(css=css):
                self.assertIsNone(rx.search(".x { color: red; }\n" + css))


if __name__ == "__main__":
    unittest.main()
