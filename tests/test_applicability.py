"""Tests of scripts/applicability.py. Run: python -m unittest discover -s tests"""

import contextlib
import datetime as dt
import io
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import applicability as a  # noqa: E402

TABLE = a.load_json(ROOT / "references" / "scoping" / "obligations.json")
SCHEMA = a.load_json(ROOT / "schemas" / "profile.schema.json")
SOURCES = a.load_json(ROOT / "references" / "sources.json")
STATUS = (ROOT / "references" / "regulatory-status.md").read_text(encoding="utf-8")
TODAY = dt.date(2026, 11, 14)

NO_AI = {
    "ai.conversational_assistant": False, "ai.content_generation_feature": False,
    "ai.generated_content_published": False, "ai.emotion_or_biometric": False,
    "ai.decisions_about_people": False,
}
NO_SENSITIVE = {
    "data.special_categories": False, "data.health_data": False, "audience.includes_minors": False,
    "operator.regulated_sector": False,
}
MICRO_SHOP = {
    "operator.type": "company", "operator.activity_kind": "commercial", "operator.headcount": 3,
    "operator.annual_turnover_eur": 300000, "operator.balance_sheet_total_eur": 100000,
    "operator.fr_turnover_3y_average_eur": 280000, "operator.country_of_establishment": "FR",
    "market.target_countries": ["FR"], "market.sells_online": True,
    "market.sells_to_consumers": True, "market.sells_what": ["goods"],
    "market.withdrawal_right_applies": True, "eaa.sectors": ["e-commerce"],
    "data.collects_personal_data": True, "data.non_essential_trackers": True,
    "data.third_party_tool_kinds": ["analytics", "payment"], "data.transfers_outside_eu": False, "data.processes_on_behalf_of_clients": False,
    "content.hosts_user_content": False, "site.user_accounts": True, **NO_AI, **NO_SENSITIVE,
}
LARGE_RETAILER = {
    **MICRO_SHOP, "operator.headcount": 5200, "operator.annual_turnover_eur": 900000000,
    "operator.balance_sheet_total_eur": 500000000, "operator.fr_turnover_3y_average_eur": 800000000,
}
TOWN_HALL = {
    "operator.type": "public-body", "operator.activity_kind": "institutional",
    "operator.country_of_establishment": "FR", "market.target_countries": ["FR"],
    "market.sells_online": False, "market.sells_to_consumers": False,
    "market.withdrawal_right_applies": False, "eaa.sectors": [],
    "data.collects_personal_data": True, "data.non_essential_trackers": False,
    "data.third_party_tool_kinds": [], "data.transfers_outside_eu": False, "data.processes_on_behalf_of_clients": False,
    "content.hosts_user_content": False, "site.user_accounts": False, **NO_AI, **NO_SENSITIVE,
}
GERMAN_SAAS = {
    "operator.type": "company", "operator.activity_kind": "commercial", "operator.headcount": 40,
    "operator.annual_turnover_eur": 5000000, "operator.balance_sheet_total_eur": 2500000,
    "operator.country_of_establishment": "DE", "market.target_countries": ["DE", "AT"],
    "market.sells_online": True, "market.sells_to_consumers": True,
    "market.sells_what": ["subscriptions"], "market.withdrawal_right_applies": True,
    "eaa.sectors": ["e-commerce"], "data.collects_personal_data": True,
    "data.non_essential_trackers": True, "data.third_party_tool_kinds": ["analytics", "ai-api"],
    "data.transfers_outside_eu": True, "content.hosts_user_content": False,
    "site.user_accounts": True, **NO_AI, **NO_SENSITIVE,
    "ai.conversational_assistant": True, "ai.role": "provider",
}
PERSONAL_BLOG = {
    "operator.type": "individual", "operator.activity_kind": "personal",
    "operator.country_of_establishment": "FR", "market.target_countries": ["FR"],
    "market.sells_online": False, "market.sells_to_consumers": False,
    "market.withdrawal_right_applies": False, "eaa.sectors": [],
    "data.collects_personal_data": False, "data.non_essential_trackers": False,
    "data.third_party_tool_kinds": [], "data.transfers_outside_eu": False, "data.processes_on_behalf_of_clients": False,
    "content.hosts_user_content": False, "site.user_accounts": False, **NO_AI, **NO_SENSITIVE,
}
BASELINE_IDS = {"a11y-baseline-wcag22-aa", "privacy-baseline-no-tracker-before-consent",
                "sec-baseline-https-headers"}


def profile(answers, assumed=(), without=()):
    """Builds a profile from {"group.name": value}; every answer is stated unless listed."""
    result = {"schema_version": 1}
    for field, value in answers.items():
        if field in without:
            continue
        group, name = field.split(".", 1)
        basis = "assumed" if field in assumed else "stated"
        result.setdefault(group, {})[name] = {"value": value, "basis": basis}
    return result


def matrix(answers, **kwargs):
    return a.build_matrix(profile(answers, **kwargs), TABLE, SCHEMA, TODAY)


def rows(result):
    return {row["id"]: row for row in result["obligations"]}


def walk(condition):
    """Yields (operator, spec) for every node of a condition."""
    operator, spec = next(iter(condition.items()))
    yield operator, spec
    if operator in ("all", "any"):
        for item in spec:
            yield from walk(item)
    elif operator == "not":
        yield from walk(spec)


def all_conditions():
    for name, condition in TABLE["definitions"].items():
        yield f"definition {name}", condition
    for entry in TABLE["obligations"]:
        yield entry["id"], entry["applies_when"]
        if "skill_applies_when" in entry:
            yield entry["id"], entry["skill_applies_when"]
    for entry in TABLE["escalations"]:
        yield entry["id"], entry["when"]


class ProfilesTest(unittest.TestCase):
    def assert_status(self, result, expected):
        got = rows(result)
        for obligation, status in expected.items():
            self.assertEqual(got[obligation]["status"], status, obligation)

    def test_french_micro_business_shop(self):
        result = matrix(MICRO_SHOP)
        self.assert_status(result, {
            "eaa-service-accessibility": "does-not-apply", "eaa-information-duty": "does-not-apply",
            "fr-eaa-service-provider-duties": "does-not-apply", "fr-rgaa-conformity": "does-not-apply",
            "fr-accessibility-statement": "does-not-apply",
            "gdpr-principles-lawful-basis": "applies", "fr-trackers-consent": "applies",
            "privacy-baseline-no-tracker-before-consent": "applies",
            "con-order-button": "applies", "con-withdrawal-function": "applies",
            "fr-withdrawal-function": "applies", "fr-legal-notice": "applies",
            "fr-ecommerce-identification": "applies", "fr-consumer-mediator": "applies",
            "ai-prohibited-practices": "does-not-apply",
        })
        self.assertEqual(result["counts"]["to-confirm"], 0)
        baseline = rows(result)["a11y-baseline-wcag22-aa"]
        self.assertEqual((baseline["level"], baseline["level_basis"]), ("recommended", "skill"))
        self.assertIn("no legal duty", a.level_text(baseline))

    def test_microenterprise_test_is_headcount_and_turnover_or_balance(self):
        cases = [
            ({"operator.headcount": 9, "operator.annual_turnover_eur": 3000000,
              "operator.balance_sheet_total_eur": 1500000}, "does-not-apply"),
            ({"operator.headcount": 9, "operator.annual_turnover_eur": 2000000,
              "operator.balance_sheet_total_eur": 9000000}, "does-not-apply"),
            ({"operator.headcount": 9, "operator.annual_turnover_eur": 3000000,
              "operator.balance_sheet_total_eur": 3000000}, "applies"),
            ({"operator.headcount": 10, "operator.annual_turnover_eur": 500000,
              "operator.balance_sheet_total_eur": 100000}, "applies"),
        ]
        for change, status in cases:
            with self.subTest(change=change):
                result = matrix({**MICRO_SHOP, **change})
                self.assert_status(result, {"eaa-service-accessibility": status})

    def test_microenterprise_test_with_missing_figures(self):
        money = ("operator.annual_turnover_eur", "operator.balance_sheet_total_eur")
        result = matrix(MICRO_SHOP, without=money)
        row = rows(result)["eaa-service-accessibility"]
        self.assertEqual(row["status"], "to-confirm")
        self.assertTrue(any("annual_turnover_eur" in item for item in row["to_confirm"]))
        # Ten persons or more: not a microenterprise whatever the figures.
        result = matrix({**MICRO_SHOP, "operator.headcount": 12}, without=money)
        self.assert_status(result, {"eaa-service-accessibility": "applies"})

    def test_assumed_answer_gives_to_confirm_with_a_leaning(self):
        result = matrix(MICRO_SHOP, assumed=("operator.headcount",))
        row = rows(result)["eaa-service-accessibility"]
        self.assertEqual((row["status"], row["leaning"]), ("to-confirm", "does-not-apply"))
        self.assertEqual(row["level_if_confirmed"], "mandatory")
        self.assertEqual([item["field"] for item in result["assumptions"]["assumed_answers"]],
                         ["operator.headcount"])

    def test_large_french_retailer(self):
        result = matrix(LARGE_RETAILER)
        self.assert_status(result, {
            "eaa-service-accessibility": "applies", "eaa-ecommerce-functions": "applies",
            "eaa-banking-plain-language": "does-not-apply", "eaa-information-duty": "applies",
            "fr-eaa-service-provider-duties": "applies", "fr-rgaa-conformity": "applies",
            "fr-accessibility-statement": "applies", "fr-accessibility-multiannual-plan": "applies",
            "fr-accessibility-home-mention": "applies", "a11y-baseline-wcag22-aa": "applies",
        })
        baseline = rows(result)["a11y-baseline-wcag22-aa"]
        self.assertEqual((baseline["level"], baseline["level_basis"]), ("mandatory", "law"))

    def test_article_47_turnover_threshold(self):
        at_threshold = matrix({**LARGE_RETAILER, "operator.fr_turnover_3y_average_eur": 250000000})
        self.assert_status(at_threshold, {"fr-rgaa-conformity": "does-not-apply"})
        unknown = matrix(LARGE_RETAILER, without=("operator.fr_turnover_3y_average_eur",))
        self.assert_status(unknown, {"fr-rgaa-conformity": "to-confirm",
                                     "eaa-service-accessibility": "applies"})

    def test_private_body_with_public_service_mission_is_not_guessed(self):
        result = matrix({**TOWN_HALL, "operator.type": "private-public-service-mission"})
        row = rows(result)["fr-accessibility-statement"]
        self.assertEqual(row["status"], "to-confirm")
        self.assertTrue(any("Article 47" in item for item in row["to_confirm"]))

    def test_french_town_hall(self):
        result = matrix(TOWN_HALL)
        self.assert_status(result, {
            "fr-rgaa-conformity": "applies", "fr-accessibility-statement": "applies",
            "fr-accessibility-multiannual-plan": "applies", "fr-accessibility-home-mention": "applies",
            "a11y-baseline-wcag22-aa": "applies", "eaa-service-accessibility": "does-not-apply",
            "eaa-information-duty": "does-not-apply", "gdpr-information-notice": "applies",
            "sec-baseline-https-headers": "applies", "fr-legal-notice": "applies",
            "con-operator-identification": "does-not-apply", "con-order-button": "does-not-apply",
            "privacy-baseline-no-tracker-before-consent": "does-not-apply",
        })
        self.assertEqual(result["counts"]["to-confirm"], 0)
        self.assertEqual(rows(result)["fr-accessibility-statement"]["template"],
                         "templates/accessibility-statement-fr.md")

    def test_german_saas_with_chatbot(self):
        result = matrix(GERMAN_SAAS)
        self.assert_status(result, {
            "eaa-service-accessibility": "applies", "eaa-information-duty": "applies",
            "ai-prohibited-practices": "applies", "ai-literacy": "applies",
            "ai-disclose-interaction": "applies", "ai-disclosure-form": "applies",
            "ai-mark-synthetic-content": "does-not-apply", "gdpr-transfers": "applies",
            "con-withdrawal-function": "applies", "con-operator-identification": "applies",
        })
        for row in result["obligations"]:
            if row["id"].startswith("fr-"):
                self.assertEqual(row["status"], "does-not-apply", row["id"])
        notes = [note["text"] for note in result["country_coverage"]]
        self.assertIn("EU baseline applied; national rules not verified for DE.", notes)
        self.assertIn("EU baseline applied; national rules not verified for AT.", notes)
        beyond = [item["title"] for item in result["beyond_the_skill"]]
        self.assertIn("Country not covered: DE", beyond)

    def test_ai_duties_depend_on_the_role(self):
        deployer = rows(matrix({**GERMAN_SAAS, "ai.role": "deployer"}))["ai-disclose-interaction"]
        self.assertEqual((deployer["status"], deployer["level"], deployer["level_basis"]),
                         ("does-not-apply", "recommended", "skill"))
        unknown = rows(matrix(GERMAN_SAAS, without=("ai.role",)))["ai-disclose-interaction"]
        self.assertEqual(unknown["status"], "to-confirm")
        self.assertTrue(unknown["applied_by_skill_regardless"])

    def test_country_outside_the_union(self):
        result = matrix({**GERMAN_SAAS, "market.target_countries": ["DE", "US"]})
        kinds = {note["country"]: note["kind"] for note in result["country_coverage"]}
        self.assertEqual(kinds, {"DE": "not-verified", "US": "outside-eu"})

    def test_personal_blog_without_data(self):
        result = matrix(PERSONAL_BLOG)
        got = rows(result)
        mandatory = {key for key, row in got.items() if row["level"] == "mandatory"}
        self.assertEqual(mandatory, {"fr-legal-notice"})
        for key in BASELINE_IDS:
            self.assertEqual((got[key]["status"], got[key]["level"], got[key]["level_basis"]),
                             ("does-not-apply", "recommended", "skill"), key)
        self.assertEqual(result["counts"]["to-confirm"], 0)
        self.assertEqual(result["beyond_the_skill"], [])
        self.assertIn("No such case appears", a.render_markdown(result))

    def test_empty_profile(self):
        result = a.build_matrix({"schema_version": 1}, TABLE, SCHEMA, TODAY)
        always = {entry["id"] for entry in TABLE["obligations"]
                  if entry["applies_when"] == {"always": True}}
        for row in result["obligations"]:
            if row["id"] in always:
                self.assertEqual((row["status"], row["level"]), ("applies", "recommended"), row["id"])
            else:
                self.assertEqual(row["status"], "to-confirm", row["id"])
                self.assertTrue(row["to_confirm"], row["id"])
        self.assertFalse([row["id"] for row in result["obligations"] if row["level"] == "mandatory"])
        missing = {item["field"]: item for item in result["assumptions"]["missing_answers"]}
        self.assertEqual(set(missing), set(a.condition_fields(TABLE, a.schema_fields(SCHEMA))))
        self.assertIs(missing["data.non_essential_trackers"]["protective_reading"], True)
        self.assertEqual({item["state"] for item in result["beyond_the_skill"]}, {"not-ruled-out"})
        self.assertEqual(len(result["beyond_the_skill"]), len(TABLE["escalations"]))
        text = a.render_markdown(result)
        self.assertIn("`data.non_essential_trackers` (question 6): assume true", text)
        self.assertIn(a.TO_CONFIRM_RULE, text)

    def test_escalations(self):
        result = matrix({**GERMAN_SAAS, "ai.emotion_or_biometric": True, "data.health_data": True,
                         "audience.includes_minors": True, "ai.decisions_about_people": True,
                         "eaa.sectors": ["consumer-banking"]})
        flagged = {item["id"] for item in result["beyond_the_skill"] if item["state"] == "flagged"}
        self.assertEqual(flagged, {entry["id"] for entry in TABLE["escalations"]}
                         | {"esc-country-not-covered"})
        self.assert_status(result, {"ai-high-risk-screening": "to-confirm",
                                    "gdpr-children-consent": "to-confirm",
                                    "gdpr-special-categories": "applies"})


class OutputTest(unittest.TestCase):
    def test_markdown_opens_with_disclaimer_and_closes_with_referral(self):
        text = a.render_markdown(matrix(GERMAN_SAAS))
        self.assertLess(text.index("not legal advice"), text.index("## Assumptions"))
        self.assertLess(text.index("produced by an AI tool"), text.index("## Obligations"))
        self.assertLess(text.index("## Obligations"), text.index("## Beyond the skill"))
        self.assertTrue(text.rstrip().endswith("See references/scoping/out-of-scope.md."))
        self.assertIn("Consult a qualified professional", text)
        self.assertNotIn("\r", text)

    def test_cli_on_example_profile(self):
        example = ROOT / "templates" / "profile.example.json"
        self.assertEqual(a.schema_errors(a.load_json(example), SCHEMA, SCHEMA), [])
        with tempfile.TemporaryDirectory() as tmp:
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = a.main([str(example), "--format", "json", "--output-dir", tmp])
            self.assertEqual(code, 0)
            printed = json.loads(out.getvalue())
            written = json.loads((Path(tmp) / "applicability-matrix.json").read_text(encoding="utf-8"))
            self.assertEqual(printed, written)
            self.assertEqual(len(printed["obligations"]), len(TABLE["obligations"]))
            markdown = (Path(tmp) / "applicability-matrix.md").read_bytes()
            self.assertTrue(markdown.startswith(b"# Applicability matrix"))
            self.assertNotIn(b"\r\n", markdown)

    def test_cli_fails_clearly_on_bad_input(self):
        with tempfile.TemporaryDirectory() as tmp:
            bad = Path(tmp) / "profile.json"
            bad.write_text('{"schema_version": 1, "operator": {"type": {"value": "bank", "basis": "stated"}}}',
                           encoding="utf-8")
            err = io.StringIO()
            with contextlib.redirect_stderr(err):
                self.assertEqual(a.main([str(bad)]), 2)
                self.assertEqual(a.main([str(Path(tmp) / "absent.json")]), 2)
            self.assertIn("profile.operator.type.value", err.getvalue())
            self.assertIn("cannot read", err.getvalue())


class ProfileValidationTest(unittest.TestCase):
    def errors(self, value):
        return a.schema_errors(value, SCHEMA, SCHEMA)

    def test_required_and_types(self):
        self.assertTrue(any("schema_version" in e for e in self.errors({})))
        self.assertTrue(self.errors([]))
        self.assertTrue(any("unknown key" in e for e in self.errors({"schema_version": 1, "x": 1})))
        cases = {
            "basis missing": {"operator": {"headcount": {"value": 3}}},
            "basis unknown": {"operator": {"headcount": {"value": 3, "basis": "guessed"}}},
            "number as text": {"operator": {"headcount": {"value": "3", "basis": "stated"}}},
            "boolean as number": {"operator": {"headcount": {"value": True, "basis": "stated"}}},
            "negative": {"operator": {"headcount": {"value": -1, "basis": "stated"}}},
            "country code": {"operator": {"country_of_establishment": {"value": "France", "basis": "stated"}}},
            "list item": {"eaa": {"sectors": {"value": ["bank"], "basis": "stated"}}},
            "unknown field": {"operator": {"size": {"value": 3, "basis": "stated"}}},
            "bare value": {"audience": {"includes_minors": True}},
        }
        for label, body in cases.items():
            with self.subTest(label):
                self.assertTrue(self.errors({"schema_version": 1, **body}))
        with self.assertRaises(a.InputError):
            a.build_matrix({"schema_version": 2}, TABLE, SCHEMA, TODAY)

    def test_every_field_declares_question_and_protective_reading(self):
        for field, schema in a.schema_fields(SCHEMA).items():
            self.assertIn("x-protective-assumption", schema, field)
            self.assertIn("x-question", schema, field)


class TableTest(unittest.TestCase):
    def test_table_is_well_formed(self):
        self.assertEqual(a.check_table(TABLE, SCHEMA), [])
        self.assertEqual({entry["domain"] for entry in TABLE["obligations"]}, set(dict(a.DOMAINS)))
        self.assertEqual({e["id"] for e in TABLE["obligations"] if e.get("baseline")}, BASELINE_IDS)

    def test_sources_exist_in_registry(self):
        known = {source["id"] for source in SOURCES["sources"]}
        for entry in TABLE["obligations"]:
            self.assertTrue(entry["sources"], entry["id"])
            for source in entry["sources"]:
                self.assertIn(source, known, entry["id"])

    def test_status_sections_exist(self):
        headings = set(re.findall(r"^#{2,3} (\d+(?:\.\d+)?)\.? ", STATUS, re.M))
        sections = [(entry["id"], entry["status_section"])
                    for entry in TABLE["obligations"] + TABLE["escalations"]]
        for label, condition in all_conditions():
            for operator, spec in walk(condition):
                if operator in ("greater-than", "less-than"):
                    sections.append((label, spec["threshold_source"]["status_section"]))
        for label, section in sections:
            self.assertIn(section, headings, label)

    def test_conditions_only_reference_schema_fields(self):
        known = set(a.schema_fields(SCHEMA))
        seen = set()
        for label, condition in all_conditions():
            for operator, spec in walk(condition):
                if isinstance(spec, dict) and "field" in spec:
                    self.assertIn(spec["field"], known, label)
                    seen.add(spec["field"])
        self.assertEqual(sorted(seen), a.condition_fields(TABLE, a.schema_fields(SCHEMA)))

    def test_thresholds_carry_their_source(self):
        count = 0
        for label, condition in all_conditions():
            for operator, spec in walk(condition):
                if operator in ("greater-than", "less-than"):
                    count += 1
                    self.assertTrue(spec["threshold_source"].get("fact"), label)
        self.assertEqual(count, 4)

    def test_no_date_or_amount_written_as_prose(self):
        months = "January|February|March|April|May|June|July|August|September|October|November|December"
        pattern = re.compile(rf"\b\d{{1,2}} (?:{months})\b|(?:{months}) \d{{4}}|EUR|€|\bhours\b|\bmonths\b")
        for entry in TABLE["obligations"] + TABLE["escalations"]:
            for key in ("title", "requires", "note", "what_to_do"):
                self.assertIsNone(pattern.search(entry.get(key) or ""), f"{entry['id']}.{key}")

    def test_templates_exist(self):
        for entry in TABLE["obligations"]:
            if "template" in entry:
                self.assertTrue((ROOT / entry["template"]).is_file(), entry["id"])

    def test_coverage_lists(self):
        coverage = TABLE["coverage"]
        self.assertEqual(len(set(coverage["eu_member_states"])), 27)
        self.assertLessEqual(set(coverage["covered_countries"]), set(coverage["eu_member_states"]))


class ConditionLanguageTest(unittest.TestCase):
    KNOWN = a.schema_fields(SCHEMA)

    def run_condition(self, condition, answers=None, definitions=None, **kwargs):
        return a.evaluate(condition, profile(answers or {}, **kwargs), definitions or {}, self.KNOWN)

    def test_rejects_unknown_operator(self):
        for condition in ({"matches": {"field": "operator.type", "value": ".*"}},
                          {"eval": "__import__('os')"},
                          {"all": [{"equals": {"field": "operator.type", "value": "company"}},
                                   {"xor": []}]}):
            with self.subTest(condition=condition):
                with self.assertRaises(a.ConditionError) as caught:
                    self.run_condition(condition, {"operator.type": "company"})
                self.assertIn("unknown operator", str(caught.exception))

    def test_rejects_malformed_conditions(self):
        threshold = {"status_section": "1.3", "fact": "x"}
        bad = [
            {"equals": {"field": "operator.unknown", "value": 1}},
            {"equals": {"field": "operator.type"}},
            {"in": {"field": "operator.type", "values": "company"}},
            {"greater-than": {"field": "operator.headcount", "value": 10}},
            {"less-than": {"field": "operator.headcount", "value": "10", "threshold_source": threshold}},
            {"all": []},
            {"all": [], "any": []},
            {"def": "nowhere"},
            {"always": False},
            {"uncertain": ""},
            "always",
        ]
        for condition in bad:
            with self.subTest(condition=condition):
                with self.assertRaises(a.ConditionError):
                    self.run_condition(condition)
        with self.assertRaises(a.ConditionError):
            self.run_condition({"def": "loop"}, definitions={"loop": {"not": {"def": "loop"}}})
        broken = {"obligations": [{**TABLE["obligations"][0], "applies_when": {"maybe": True}}]}
        self.assertTrue(any("unknown operator" in e for e in a.check_table(broken, SCHEMA)))

    def test_three_valued_logic(self):
        yes = {"equals": {"field": "market.sells_online", "value": True}}
        no = {"equals": {"field": "market.sells_to_consumers", "value": True}}
        gone = {"equals": {"field": "audience.includes_minors", "value": True}}
        answers = {"market.sells_online": True, "market.sells_to_consumers": False}

        def result(condition, **kwargs):
            tri = self.run_condition(condition, answers, **kwargs)
            return tri.value, tri.certain

        self.assertEqual(result({"all": [yes, no, gone]}), (False, True))
        self.assertEqual(result({"any": [yes, no, gone]}), (True, True))
        self.assertEqual(result({"all": [yes, gone]}), (None, False))
        self.assertEqual(result({"any": [no, gone]}), (None, False))
        self.assertEqual(result({"not": gone}), (None, False))
        self.assertEqual(result({"not": no}), (True, True))
        self.assertEqual(result({"all": [yes, {"uncertain": "legal qualification"}]}), (None, False))
        self.assertEqual(result({"all": [no, {"uncertain": "legal qualification"}]}), (False, True))
        assumed = ("market.sells_online",)
        self.assertEqual(result({"all": [yes, {"not": no}]}, assumed=assumed), (True, False))
        self.assertEqual(result({"any": [yes, no]}, assumed=assumed), (True, False))
        self.assertEqual(result({"all": [yes, no]}, assumed=assumed), (False, True))

    def test_leaf_operators(self):
        threshold = {"status_section": "1.3", "fact": "x"}
        answers = {"operator.headcount": 10, "market.target_countries": ["FR", "BE"],
                   "operator.type": "company"}

        def value(condition):
            return self.run_condition(condition, answers).value

        self.assertFalse(value({"less-than": {"field": "operator.headcount", "value": 10,
                                              "threshold_source": threshold}}))
        self.assertFalse(value({"greater-than": {"field": "operator.headcount", "value": 10,
                                                 "threshold_source": threshold}}))
        self.assertTrue(value({"contains": {"field": "market.target_countries", "value": "BE"}}))
        self.assertFalse(value({"contains": {"field": "market.target_countries", "value": "DE"}}))
        self.assertTrue(value({"in": {"field": "operator.type", "values": ["company", "association"]}}))
        self.assertFalse(value({"equals": {"field": "operator.type", "value": "individual"}}))


if __name__ == "__main__":
    unittest.main()
