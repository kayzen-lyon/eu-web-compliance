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


if __name__ == "__main__":
    unittest.main()
