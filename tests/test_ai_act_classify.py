"""Tests of scripts/ai_act_classify.py. Run: python -m unittest discover -s tests

Cases 1 and 2 port the two classification examples of morellid/ai-act-skill
(examples/classify-customer-service-chatbot, examples/classify-hr-emotion-recognition;
MIT, Copyright (c) 2026 Davide Morelli) to the website profile used by this skill.
The other cases are the website situations listed in references/ai-act/transparency.md.
"""

import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import ai_act_classify as c  # noqa: E402


def ans(value, basis="stated"):
    return {"value": value, "basis": basis}


def profile(features=None, role=None, activity="commercial", **flags):
    ai = {name: ans(flags.get(name, False)) for name, _ in c.KIND_FROM_FLAG}
    if role:
        ai["role"] = ans(role)
    if features is not None:
        ai["features"] = features
    return {"schema_version": 1, "operator": {"activity_kind": ans(activity)}, "ai": ai}


def provisions(result_feature, key):
    return [x["provision"] for x in result_feature[key]]


def only_feature(p):
    result = c.classify(p)
    assert len(result["features"]) == 1, result["features"]
    return result["features"][0], result


class MorelliExamples(unittest.TestCase):
    def test_customer_service_chatbot_built_on_api_under_own_name(self):
        # ShopAssist: LLM chatbot on a third-party model API, operated under the retailer's name.
        f, result = only_feature(profile(features=[{
            "id": "shopassist", "kind": "chatbot", "role": "provider", "audience": "public",
            "description": "Customer-service chatbot on a third-party model API"}]))
        self.assertEqual(f["stop"], [])
        self.assertIn("AI Act art. 50(1)", provisions(f, "applies"))
        self.assertIn("AI Act art. 50(2)", provisions(f, "applies"))
        self.assertIn("AI Act art. 50(5)", provisions(f, "applies"))
        self.assertIn("AI Act art. 50(3)", provisions(f, "does_not_apply"))
        self.assertIn("AI Act art. 50(4)", provisions(f, "does_not_apply"))
        self.assertIn("AI Act art. 4", provisions(result["site"], "applies"))
        first = [x for x in f["applies"] if x["provision"] == "AI Act art. 50(1)"][0]
        self.assertEqual(first["addressee"], "provider (the operator)")
        self.assertIn(c.CHAT, first["read"])

    def test_hr_emotion_recognition_is_a_stop(self):
        # TalentSignal: emotion inference on interview videos and employees' webcams, used by the employer.
        f_list = [
            {"id": "talentsignal", "kind": "emotion-recognition", "role": "deployer",
             "uses_biometric_data": True, "workplace_or_education": True, "medical_or_safety": False},
            {"id": "applicant-score", "kind": "decision-support", "role": "deployer",
             "annex_iii_area": "employment"},
        ]
        result = c.classify(profile(features=f_list))
        emotion, decision = result["features"]
        self.assertIn("AI Act art. 5(1)(f)", provisions(emotion, "stop"))
        self.assertIn("AI Act Annex III area 1", provisions(emotion, "stop"))
        # Transparency does not cure a prohibition: 50(3) is not presented as the answer.
        self.assertNotIn("AI Act art. 50(3)", provisions(emotion, "applies"))
        self.assertIn("AI Act art. 50(3)", provisions(emotion, "to_confirm"))
        self.assertIn("AI Act Annex III area 4 (employment and workers management)",
                      provisions(decision, "stop"))
        self.assertIn("GDPR art. 22(1)", provisions(decision, "to_confirm"))


class WebsiteCases(unittest.TestCase):
    def test_news_site_ai_articles_without_review_are_labelled(self):
        f, _ = only_feature(profile(features=[{
            "id": "news", "kind": "published-content", "role": "deployer", "modalities": ["text"],
            "public_interest_text": True, "editorial_review": False}]))
        self.assertIn("AI Act art. 50(4) text", provisions(f, "applies"))
        self.assertIn("AI Act art. 50(5)", provisions(f, "applies"))
        self.assertIn("AI Act art. 50(2)", provisions(f, "does_not_apply"))  # vendor's duty
        self.assertEqual(f["stop"], [])

    def test_news_site_ai_articles_with_editorial_review_need_no_label(self):
        f, _ = only_feature(profile(features=[{
            "id": "news", "kind": "published-content", "role": "deployer", "modalities": ["text"],
            "public_interest_text": True, "editorial_review": True}]))
        self.assertIn("AI Act art. 50(4) text", provisions(f, "does_not_apply"))
        self.assertNotIn("AI Act art. 50(4) text", provisions(f, "applies"))
        # The exception has a condition the site must show: editorial responsibility published.
        self.assertIn("AI Act Guidelines point 138", provisions(f, "applies"))

    def test_shop_ai_product_photos_are_to_confirm(self):
        f, _ = only_feature(profile(features=[{
            "id": "product-photos", "kind": "published-content", "role": "deployer",
            "modalities": ["image"], "realistic": True}]))
        self.assertIn("AI Act art. 50(4) deep fake", provisions(f, "to_confirm"))
        self.assertNotIn("AI Act art. 50(4) deep fake", provisions(f, "applies"))
        item = [x for x in f["to_confirm"] if x["provision"] == "AI Act art. 50(4) deep fake"][0]
        self.assertIn(c.LABEL, item["read"])

    def test_shop_photos_that_could_mislead_are_labelled(self):
        f, _ = only_feature(profile(features=[{
            "id": "product-photos", "kind": "published-content", "role": "deployer",
            "modalities": ["image"], "realistic": True, "could_appear_authentic": True}]))
        self.assertIn("AI Act art. 50(4) deep fake", provisions(f, "applies"))

    def test_shop_photos_with_only_background_retouching(self):
        f, _ = only_feature(profile(features=[{
            "id": "packshots", "kind": "published-content", "role": "deployer",
            "modalities": ["image"], "minor_edits_only": True}]))
        self.assertIn("AI Act art. 50(4) deep fake", provisions(f, "does_not_apply"))
        self.assertEqual(f["applies"], [])

    def test_ai_translation_only_nothing_applies(self):
        f, _ = only_feature(profile(features=[{
            "id": "translation", "kind": "translation", "role": "deployer",
            "public_interest_text": False}]))
        self.assertEqual(f["applies"], [])
        self.assertEqual(f["stop"], [])
        self.assertEqual(f["to_confirm"], [])
        self.assertIn("AI Act art. 50(4) text", provisions(f, "does_not_apply"))

    def test_ai_translation_of_unreviewed_news_is_to_confirm(self):
        f, _ = only_feature(profile(features=[{
            "id": "translation", "kind": "translation", "role": "deployer",
            "public_interest_text": True}]))
        self.assertIn("AI Act art. 50(4) text", provisions(f, "to_confirm"))

    def test_blog_code_written_with_ai_is_not_labelled(self):
        f, _ = only_feature(profile(features=[{
            "id": "site-code", "kind": "code-assistance", "role": "deployer"}]))
        self.assertEqual(f["applies"], [])
        self.assertEqual(f["to_confirm"], [])
        not_applying = [x for x in f["does_not_apply"] if x["provision"] == "AI Act art. 50(2)"]
        self.assertEqual(len(not_applying), 1)
        self.assertIn("point 68", not_applying[0]["reason"])

    def test_fine_tuned_model_released_under_own_name_is_provider(self):
        f, _ = only_feature(profile(features=[{
            "id": "brand-writer", "kind": "generator", "role": "provider",
            "modalities": ["text"], "depicts_real_people": False,
            "description": "Model fine-tuned by the operator and offered under its own name"}]))
        self.assertIn("AI Act art. 50(2)", provisions(f, "applies"))
        self.assertEqual(f["role"], "provider")
        self.assertIn("AI Act art. 50(1)", provisions(f, "to_confirm"))
        self.assertNotIn("AI Act art. 5(1a)", provisions(f, "to_confirm"))

    def test_vendor_chatbot_deployer_still_gets_the_notice(self):
        f, _ = only_feature(profile(features=[{"id": "widget", "kind": "chatbot", "role": "deployer"}]))
        first = [x for x in f["applies"] if x["provision"] == "AI Act art. 50(1)"][0]
        self.assertEqual(first["addressee"], "provider (the vendor)")
        self.assertIn("vendor", first["reason"])
        self.assertIn("AI Act art. 50(2)", provisions(f, "does_not_apply"))

    def test_image_generator_for_visitors_flags_article_5_safeguards(self):
        f, _ = only_feature(profile(features=[{"id": "avatar", "kind": "generator", "role": "provider",
                                               "modalities": ["image"]}]))
        self.assertIn("AI Act art. 5(1a)", provisions(f, "to_confirm"))
        f2, _ = only_feature(profile(features=[{"id": "nudify", "kind": "generator", "role": "provider",
                                                "modalities": ["image"],
                                                "sexual_content_of_real_people": True}]))
        self.assertIn("AI Act art. 5(1)(ba)", provisions(f2, "stop"))

    def test_text_sentiment_analysis_is_not_emotion_recognition(self):
        f, _ = only_feature(profile(features=[{"id": "sentiment", "kind": "emotion-recognition",
                                               "role": "deployer", "uses_biometric_data": False}]))
        self.assertEqual(f["stop"], [])
        self.assertIn("AI Act art. 50(3)", provisions(f, "does_not_apply"))


class ProfileTolerance(unittest.TestCase):
    def test_booleans_only_profile_derives_features(self):
        p = profile(role="deployer", conversational_assistant=True, generated_content_published=True)
        result = c.classify(p)
        kinds = [f["kind"] for f in result["features"]]
        self.assertEqual(kinds, ["chatbot", "published-content"])
        published = result["features"][1]
        # Unknown modality and public-interest status: nothing asserted, everything to confirm.
        self.assertEqual(published["applies"], [])
        self.assertIn("AI Act art. 50(4) text", provisions(published, "to_confirm"))

    def test_missing_role_never_asserts_provider_duties(self):
        p = profile(conversational_assistant=True)
        f = c.classify(p)["features"][0]
        self.assertNotIn("AI Act art. 50(1)", provisions(f, "applies"))
        self.assertIn("AI Act art. 50(1)", provisions(f, "to_confirm"))
        self.assertFalse(f["role_settled"])

    def test_assumed_answers_are_demoted_to_confirm(self):
        p = profile(role="provider")
        p["ai"]["conversational_assistant"] = ans(True, "assumed")
        f = c.classify(p)["features"][0]
        self.assertEqual(f["applies"], [])
        self.assertIn("AI Act art. 50(1)", provisions(f, "to_confirm"))

    def test_emotion_flag_alone_is_a_stop(self):
        f = c.classify(profile(role="deployer", emotion_or_biometric=True))["features"][0]
        self.assertIn("AI Act art. 5(1)(f)", provisions(f, "stop"))
        self.assertIn("AI Act art. 5(1)(g)", provisions(f, "stop"))

    def test_decision_flag_alone_is_a_stop(self):
        f = c.classify(profile(role="deployer", decisions_about_people=True))["features"][0]
        self.assertIn("AI Act Annex III", provisions(f, "stop"))

    def test_empty_and_partial_profiles(self):
        result = c.classify({"schema_version": 1})
        self.assertEqual(result["features"], [])
        self.assertIn("Profile question 8", provisions(result["site"], "to_confirm"))
        self.assertNotIn("AI Act art. 4", provisions(result["site"], "applies"))

    def test_personal_blog_has_no_deployer_duties(self):
        p = profile(activity="personal", features=[{
            "id": "posts", "kind": "published-content", "role": "deployer", "modalities": ["text"],
            "public_interest_text": True, "editorial_review": False}])
        result = c.classify(p)
        self.assertIn("AI Act art. 50(4)", provisions(result["features"][0], "does_not_apply"))
        self.assertIn("AI Act art. 4", provisions(result["site"], "does_not_apply"))

    def test_unknown_kind_is_to_confirm(self):
        f, _ = only_feature(profile(features=[{"id": "x", "kind": "telepathy"}]))
        self.assertIn("AI Act art. 50", provisions(f, "to_confirm"))


class Output(unittest.TestCase):
    def run_main(self, args):
        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):
            code = c.main(args)
        return code, buffer.getvalue()

    def write_profile(self, data):
        handle = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8")
        with handle:
            json.dump(data, handle)
        self.addCleanup(Path(handle.name).unlink)
        return handle.name

    def test_markdown_states_not_legal_advice_and_points_to_dates(self):
        path = self.write_profile(profile(role="deployer", conversational_assistant=True))
        code, text = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertIn("not legal advice", text)
        self.assertIn("references/regulatory-status.md section 2", text)
        self.assertIn("### Applies", text)
        self.assertNotRegex(text, r"\b20\d\d\b")  # no date restated

    def test_json_output_is_valid_and_complete(self):
        path = self.write_profile(profile(role="deployer", conversational_assistant=True))
        code, text = self.run_main([path, "--format", "json"])
        self.assertEqual(code, 0)
        data = json.loads(text)
        self.assertIn("not legal advice", data["disclaimer"])
        for key in c.LISTS:
            self.assertIn(key, data["features"][0])
        for x in data["features"][0]["applies"]:
            self.assertTrue(x["read"])
            for ref in x["read"]:
                self.assertTrue((ROOT / ref).exists(), ref)

    def test_every_read_path_exists(self):
        for ref in (c.TRANSPARENCY, c.ROLES, c.PROHIBITED, c.HIGH_RISK, c.LITERACY, c.CHAT, c.LABEL,
                    c.GDPR_RIGHTS, c.STATUS):
            self.assertTrue((ROOT / ref).exists(), ref)

    def test_out_file_and_bad_input(self):
        path = self.write_profile(profile(role="provider", content_generation_feature=True))
        out = Path(tempfile.mkdtemp()) / "r.md"
        code, _ = self.run_main([path, "--out", str(out)])
        self.assertEqual(code, 0)
        self.assertIn("50(2)", out.read_text(encoding="utf-8"))
        bad = self.write_profile([1, 2])
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(self.run_main([bad])[0], 2)
            self.assertEqual(self.run_main([str(ROOT / "missing.json")])[0], 2)


if __name__ == "__main__":
    unittest.main()
