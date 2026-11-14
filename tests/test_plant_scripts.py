"""Les scripts de plantation (scripts/examples/plant_*.py) suppriment examples/<site>/faulty/ avant de
le reconstruire : ils doivent refuser de le faire quand l'argument manque ou ne désigne pas le
dossier examples du skill.

Lancer : python -m unittest discover -s tests
"""

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = sorted((ROOT / "scripts" / "examples").glob("plant_*.py"))


def site_name(script):
    text = script.read_text(encoding="utf-8")
    return text.split('Path(sys.argv[1]) / "', 1)[1].split('"', 1)[0]


class PlantScriptsTest(unittest.TestCase):
    def test_there_are_planting_scripts(self):
        self.assertGreaterEqual(len(SCRIPTS), 6)

    def test_missing_argument_is_a_usage_error(self):
        for script in SCRIPTS:
            with self.subTest(script=script.name):
                result = subprocess.run([sys.executable, str(script)], capture_output=True, text=True, encoding="utf-8")
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("usage", (result.stderr + result.stdout).lower())

    def test_faulty_is_kept_when_fixed_is_missing(self):
        for script in SCRIPTS:
            with self.subTest(script=script.name), tempfile.TemporaryDirectory() as tmp:
                faulty = Path(tmp) / site_name(script) / "faulty"
                faulty.mkdir(parents=True)
                (faulty / "keep.txt").write_text("keep", encoding="utf-8")
                result = subprocess.run([sys.executable, str(script), tmp], capture_output=True, text=True, encoding="utf-8")
                self.assertNotEqual(result.returncode, 0)
                self.assertTrue((faulty / "keep.txt").exists(), "faulty/ was deleted although fixed/ is missing")


if __name__ == "__main__":
    unittest.main()
