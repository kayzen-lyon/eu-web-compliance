#!/usr/bin/env python3
"""Article 50 classifier for the AI features of a website (eu-web-compliance).

Reads a project profile (schemas/profile.schema.json) and lists, for each AI feature,
the paragraphs of Article 50 of Regulation (EU) 2024/1689 that apply, do not apply or
must be confirmed, and the stop cases (Article 5 suspected, Annex III area). Each line
gives its source and the reference file to read. Standard library only, Python 3.8+.

The result is a decision aid produced by a script written with the help of an AI.
It is not legal advice. It never decides a legal qualification the profile cannot
settle: those lines are "to confirm".

Input
-----
The `ai.*` answers of the profile ({"value": ..., "basis": "stated|inferred|assumed"}).
Optionally `ai.features`, a list that describes each feature (proposed extension of the
schema; plain values, every field optional except `kind`):

    id                      short name ("support-chat")
    kind                    chatbot | generator | published-content | translation |
                            code-assistance | emotion-recognition |
                            biometric-categorisation | decision-support
    role                    provider | deployer | both (else ai.role is used)
    basis                   stated | inferred | assumed (assumed turns "applies" into "to confirm")
    audience                public (default) | professionals
    modalities              list of text, image, audio, video
    source_code_only        true: only code, markup, configuration (Guidelines point 68)
    short_text_only         true: only alt text, captions, UI labels, single words
    standard_editing_only   true: only grammar, spelling, translation, format changes
    minor_edits_only        true: images only retouched (colour, background details)
    realistic               true: depicts realistic persons, objects, places or events
    could_appear_authentic  true: could pass as real for part of the foreseeable audience
    artistic_work           true: evidently artistic, creative, satirical or fictional work
    public_interest_text    true: published text informing the public on a matter of public interest
    editorial_review        true: substantive human review (fact-check) and editorial responsibility
    uses_biometric_data     true: face, voice, body data
    workplace_or_education  true: used on workers, job applicants, pupils or students
    medical_or_safety       true: medical or safety reason stated by the operator
    infers_sensitive_traits true: race, politics, union, religion, sex life or orientation
    depicts_real_people     true: a generator that can produce images, video or audio of real people
    sexual_content_of_real_people  true: intimate or sexual material of identifiable people
    annex_iii_area          biometrics | critical-infrastructure | education | employment |
                            essential-services | law-enforcement | migration | justice-democracy | none

Without `ai.features`, one feature is derived from each `ai.*` boolean that is true.

Usage
-----
    python scripts/ai_act_classify.py compliance/profile.json            # Markdown
    python scripts/ai_act_classify.py compliance/profile.json --format json
    python scripts/ai_act_classify.py profile.json --format json --out ai-act.json

Exit codes: 0 done, 2 usage error (unreadable profile).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

DISCLAIMER = ("Produced with the help of an AI by a decision script: this is not legal advice "
              "and not an audit. Lines marked 'to confirm' and every 'stop' need a person, and stop "
              "cases a lawyer. Dates and penalties: references/regulatory-status.md section 2.")

TRANSPARENCY = "references/ai-act/transparency.md"
ROLES = "references/ai-act/roles-and-scope.md"
PROHIBITED = "references/ai-act/prohibited-practices.md"
HIGH_RISK = "references/ai-act/high-risk.md"
LITERACY = "references/ai-act/ai-literacy.md"
CHAT = "templates/ai/ai-chat-disclosure.html"
LABEL = "templates/ai/ai-content-label.html"
GDPR_RIGHTS = "references/privacy/data-subject-rights.md"
STATUS = "references/regulatory-status.md"

ANNEX_III = {
    "biometrics": "Annex III area 1 (biometrics)",
    "critical-infrastructure": "Annex III area 2 (critical infrastructure)",
    "education": "Annex III area 3 (education and vocational training)",
    "employment": "Annex III area 4 (employment and workers management)",
    "essential-services": "Annex III area 5 (essential private and public services)",
    "law-enforcement": "Annex III area 6 (law enforcement)",
    "migration": "Annex III area 7 (migration, asylum and border control)",
    "justice-democracy": "Annex III area 8 (justice and democratic processes)",
}
KIND_FROM_FLAG = (
    ("conversational_assistant", "chatbot"),
    ("content_generation_feature", "generator"),
    ("generated_content_published", "published-content"),
    ("emotion_or_biometric", "emotion-or-biometric"),
    ("decisions_about_people", "decision-support"),
)
MEDIA = {"image", "audio", "video"}
LISTS = ("stop", "applies", "to_confirm", "does_not_apply")


# ---------------------------------------------------------------- profile reading

def answer(profile: Dict[str, Any], dotted: str) -> Tuple[Any, Optional[str]]:
    """Value and basis of a profile answer; (None, None) when missing."""
    node: Any = profile
    for part in dotted.split("."):
        if not isinstance(node, dict) or part not in node:
            return None, None
        node = node[part]
    if isinstance(node, dict) and "value" in node:
        return node.get("value"), node.get("basis")
    return node, None


def derive_features(profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Use ai.features when present, else one feature per true ai.* boolean."""
    declared, _ = answer(profile, "ai.features")
    if isinstance(declared, list):
        return [dict(f, id=f.get("id") or f"feature-{i + 1}")
                for i, f in enumerate(declared) if isinstance(f, dict) and f.get("kind")]
    features = []
    for flag, kind in KIND_FROM_FLAG:
        value, basis = answer(profile, f"ai.{flag}")
        if value is True:
            features.append({"id": flag.replace("_", "-"), "kind": kind, "basis": basis,
                             "derived_from": f"ai.{flag}"})
    return features


def resolve_role(feature: Dict[str, Any], profile: Dict[str, Any]) -> Tuple[Set[str], bool]:
    """Roles of the operator for the feature, and whether that role is settled."""
    role, basis = feature.get("role"), feature.get("basis")
    if not role:
        role, basis = answer(profile, "ai.role")
    if role not in ("provider", "deployer", "both"):
        return {"provider", "deployer"}, False
    roles = {"provider", "deployer"} if role == "both" else {role}
    return roles, basis != "assumed"


def is_personal(profile: Dict[str, Any]) -> bool:
    value, _ = answer(profile, "operator.activity_kind")
    return value == "personal"


# ---------------------------------------------------------------- result building

def item(provision: str, reason: str, read: List[str], addressee: str = "",
         action: str = "") -> Dict[str, Any]:
    return {"provision": provision, "addressee": addressee, "reason": reason,
            "action": action, "read": read}


def empty() -> Dict[str, List[Dict[str, Any]]]:
    return {name: [] for name in LISTS}


def provider_duty(out: Dict[str, list], provision: str, roles: Set[str], settled: bool,
                  reason: str, action: str, read: List[str], vendor_action: str = "") -> None:
    """File a provider-addressed paragraph according to the operator's role."""
    if "provider" in roles and settled:
        out["applies"].append(item(provision, reason, read, "provider (the operator)", action))
    elif roles == {"deployer"} and settled:
        if vendor_action:
            out["applies"].append(item(
                provision, reason + " The legal duty lies with the vendor (provider), not the operator.",
                read, "provider (the vendor)", vendor_action))
        else:
            out["does_not_apply"].append(item(
                provision, "Duty of the provider of the tool (the vendor); the operator is a deployer.",
                [ROLES], "provider (the vendor)", "Keep the vendor's marks; do not strip metadata."))
    else:
        out["to_confirm"].append(item(
            provision, reason + " Whether the operator is the provider is not settled.", [ROLES] + read,
            "provider", action + " Confirm the role (roles-and-scope.md section 2)."))


def deployer_duty(out: Dict[str, list], status: str, provision: str, reason: str,
                  action: str, read: List[str]) -> None:
    out[status].append(item(provision, reason, read, "deployer (the operator)", action))


def not_applicable(out: Dict[str, list], provision: str, reason: str, read: List[str]) -> None:
    out["does_not_apply"].append(item(provision, reason, read))


# ---------------------------------------------------------------- per kind

def classify_chatbot(f: Dict[str, Any], roles: Set[str], settled: bool) -> Dict[str, list]:
    out = empty()
    p501 = "AI Act art. 50(1)"
    if f.get("audience") == "professionals":
        out["to_confirm"].append(item(
            p501, "Audience limited to professionals: the 'obvious' exception may be arguable "
            "[AI Act Guidelines points 44, 45]; it is read narrowly.", [TRANSPARENCY],
            "provider", "Build the notice anyway; a lawyer decides whether the exception holds."))
    else:
        provider_duty(
            out, p501, roles, settled,
            "Visitors interact directly with an AI system; the 'obvious' exception cannot be relied on "
            "for a public site [AI Act Guidelines point 45].",
            "Notice before the first message, persistent AI indicator, honest answer to 'are you human?'.",
            [TRANSPARENCY, CHAT],
            vendor_action="Show the notice on the site anyway as a precaution, and keep the vendor's "
                          "own disclosure visible.")
    provider_duty(
        out, "AI Act art. 50(2)", roles, settled,
        "The assistant generates synthetic text [AI Act art. 50(2)].",
        "Check and record what marking the model provider applies; do not invent a technique.",
        [TRANSPARENCY])
    not_applicable(out, "AI Act art. 50(3)", "No emotion recognition or biometric categorisation declared.",
                   [TRANSPARENCY])
    not_applicable(out, "AI Act art. 50(4)", "Replies shown only to the person who asked are not "
                   "published text [AI Act Guidelines point 131].", [TRANSPARENCY])
    return out


def classify_generator(f: Dict[str, Any], roles: Set[str], settled: bool) -> Dict[str, list]:
    out = empty()
    out["to_confirm"].append(item(
        "AI Act art. 50(1)", "A prompt-and-answer exchange can be a direct interaction "
        "[AI Act Guidelines point 30].", [TRANSPARENCY], "provider",
        "Say on the tool, next to the prompt field, that it is an AI system."))
    provider_duty(
        out, "AI Act art. 50(2)", roles, settled,
        "The feature generates synthetic content for visitors [AI Act art. 50(2)].",
        "Mark outputs machine-readably and make them detectable before they leave the system.",
        [TRANSPARENCY])
    not_applicable(out, "AI Act art. 50(3)", "No emotion recognition or biometric categorisation declared.",
                   [TRANSPARENCY])
    not_applicable(out, "AI Act art. 50(4)", "Visitors who generate content are the deployers of their "
                   "outputs, or exempt when acting privately [AI Act Guidelines points 16, 19]; "
                   "re-check if the operator publishes the outputs itself.", [TRANSPARENCY])
    modalities = set(f.get("modalities") or [])
    if f.get("sexual_content_of_real_people") is True:
        out["stop"].append(item(
            "AI Act art. 5(1)(ba)", "The feature can generate intimate or sexual material of identifiable "
            "people.", [PROHIBITED, STATUS], action="Stop; refer to a lawyer."))
    elif f.get("depicts_real_people") is not False and (modalities & {"image", "video"} or not modalities):
        out["to_confirm"].append(item(
            "AI Act art. 5(1a)", "An image or video generator may produce intimate imagery of real "
            "people or abuse material; prohibited when foreseeable and reproducible without adequate "
            "safeguards.", [PROHIBITED, STATUS], "provider",
            "Record the safeguards; a lawyer assesses whether they are adequate."))
    return out


def deep_fake_test(f: Dict[str, Any], out: Dict[str, list]) -> None:
    p = "AI Act art. 50(4) deep fake"
    if f.get("minor_edits_only") is True:
        not_applicable(out, p, "Only minor edits (colour, lighting, background details): not a deep fake "
                       "[AI Act Guidelines point 116].", [TRANSPARENCY])
    elif f.get("realistic") is False:
        not_applicable(out, p, "Does not resemble realistic subjects: not a deep fake "
                       "[AI Act Guidelines point 113].", [TRANSPARENCY])
    elif f.get("realistic") is True and f.get("could_appear_authentic") is True:
        attenuated = f.get("artistic_work") is True
        deployer_duty(out, "applies", p,
                      "Realistic content that could pass as authentic [AI Act art. 50(4); AI Act "
                      "Guidelines points 113-115]." + (" Evidently artistic work: attenuated disclosure "
                                                       "[AI Act Guidelines point 123]." if attenuated else ""),
                      "Visible label on or next to the media at first exposure.", [TRANSPARENCY, LABEL])
    elif f.get("realistic") is True and f.get("could_appear_authentic") is False:
        not_applicable(out, p, "Stated not to appear authentic to the foreseeable audience "
                       "[AI Act Guidelines point 115]; re-check if children may see it.", [TRANSPARENCY])
    else:
        deployer_duty(out, "to_confirm", p,
                      "Whether the media resembles real subjects and could pass as authentic is not "
                      "settled [AI Act Guidelines points 113-116].",
                      "Label it meanwhile; a person decides with transparency.md section B3.",
                      [TRANSPARENCY, LABEL])


def public_interest_text_test(f: Dict[str, Any], out: Dict[str, list]) -> None:
    p = "AI Act art. 50(4) text"
    public, reviewed = f.get("public_interest_text"), f.get("editorial_review")
    if f.get("standard_editing_only") is True:
        if public is True and reviewed is not True:
            deployer_duty(out, "to_confirm", p,
                          "Machine translation of public-interest text without human review is listed "
                          "among texts that need review to escape the label [AI Act Guidelines point 138].",
                          "Have the translations reviewed, or label them.", [TRANSPARENCY, LABEL])
        else:
            not_applicable(out, p, "Standard editing or translation of text that is not public-interest "
                           "information, or that is reviewed [AI Act Guidelines points 92, 138].",
                           [TRANSPARENCY])
        return
    if public is False:
        not_applicable(out, p, "Not text informing the public on matters of public interest "
                       "[AI Act Guidelines point 131].", [TRANSPARENCY])
    elif public is True and reviewed is True:
        not_applicable(out, p, "Editorial exception: substantive human review and editorial "
                       "responsibility [AI Act art. 50(4); AI Act Guidelines points 133-138].", [TRANSPARENCY])
        deployer_duty(out, "applies", "AI Act Guidelines point 138",
                      "The editorial exception is relied on.",
                      "Publish who holds editorial responsibility, with contact details; any substantive "
                      "AI change after sign-off voids the exception (point 136).", [TRANSPARENCY])
    elif public is True:
        deployer_duty(out, "applies", p,
                      "AI-generated text published to inform the public on a matter of public interest, "
                      "without the editorial exception [AI Act art. 50(4)].",
                      "Label above the text, under the headline.", [TRANSPARENCY, LABEL])
    else:
        deployer_duty(out, "to_confirm", p,
                      "Whether the text informs the public on matters of public interest, and whether it "
                      "is reviewed, is not settled [AI Act Guidelines points 131-135].",
                      "Label meanwhile; a person decides with transparency.md section B4.",
                      [TRANSPARENCY, LABEL])


def classify_published(f: Dict[str, Any], roles: Set[str], settled: bool,
                       personal: bool) -> Dict[str, list]:
    out = empty()
    not_applicable(out, "AI Act art. 50(1)", "Published content, not an interaction.", [TRANSPARENCY])
    not_applicable(out, "AI Act art. 50(3)", "No emotion recognition or biometric categorisation declared.",
                   [TRANSPARENCY])
    if f.get("source_code_only") is True:
        for p in ("AI Act art. 50(2)", "AI Act art. 50(4)"):
            not_applicable(out, p, "Source code, markup and configuration (with their integral comments) "
                           "are outside Article 50 marking and labelling [AI Act Guidelines point 68]. "
                           "Do not label code.", [TRANSPARENCY])
        return out
    if f.get("short_text_only") is True:
        for p in ("AI Act art. 50(2)", "AI Act art. 50(4)"):
            not_applicable(out, p, "Alt text, captions, UI labels and single words are short sequences "
                           "outside Article 50 [AI Act Guidelines points 68, 131].", [TRANSPARENCY])
        return out
    if f.get("standard_editing_only") is True and "provider" in roles:
        not_applicable(out, "AI Act art. 50(2)", "Standard editing (grammar, translation, format): "
                       "exception [AI Act art. 50(2); AI Act Guidelines point 92].", [TRANSPARENCY])
    else:
        provider_duty(out, "AI Act art. 50(2)", roles, settled,
                      "The operator's own system generated the content [AI Act art. 50(2)].",
                      "Mark outputs machine-readably; keep provenance metadata through the image pipeline.",
                      [TRANSPARENCY])
    if personal:
        not_applicable(out, "AI Act art. 50(4)", "Personal non-professional activity: not a deployer "
                       "[AI Act art. 3(4); AI Act Guidelines point 19].", [ROLES])
        return out
    modalities = set(f.get("modalities") or [])
    if not modalities:
        modalities = {"text", "image"}  # unknown: run both tests, each ends in "to confirm" if unsettled
    if modalities & MEDIA:
        deep_fake_test(f, out)
    if "text" in modalities:
        public_interest_text_test(f, out)
    return out


def classify_biometric(f: Dict[str, Any], kind: str, personal: bool) -> Dict[str, list]:
    out = empty()
    for p in ("AI Act art. 50(1)", "AI Act art. 50(2)", "AI Act art. 50(4)"):
        not_applicable(out, p, "Not a conversational or generative feature as declared.", [TRANSPARENCY])
    if f.get("uses_biometric_data") is False:
        not_applicable(out, "AI Act art. 50(3)", "No biometric data: not an emotion recognition or "
                       "biometric categorisation system (sentiment analysis of text is not one) "
                       "[AI Act art. 3(39), 3(40)].", [PROHIBITED])
        return out
    emotion = kind in ("emotion-recognition", "emotion-or-biometric")
    categorisation = kind in ("biometric-categorisation", "emotion-or-biometric")
    prohibited = False
    if emotion:
        work = f.get("workplace_or_education")
        if work is True and f.get("medical_or_safety") is not True:
            prohibited = True
            out["stop"].append(item("AI Act art. 5(1)(f)", "Emotion inference on workers, job applicants or "
                                    "learners; no medical or safety reason stated.", [PROHIBITED],
                                    action="Stop the feature; refer to a lawyer."))
        elif work is not False:
            prohibited = True
            out["stop"].append(item("AI Act art. 5(1)(f)", "Emotion inference: prohibited at work and in "
                                    "education; the context is not settled.", [PROHIBITED],
                                    action="Stop until a lawyer confirms the context and any exception."))
    if categorisation:
        sensitive = f.get("infers_sensitive_traits")
        if sensitive is not False:
            prohibited = True
            out["stop"].append(item("AI Act art. 5(1)(g)", "Biometric categorisation that may infer race, "
                                    "political opinions, union membership, religion, sex life or orientation.",
                                    [PROHIBITED], action="Stop; refer to a lawyer."))
    out["stop"].append(item("AI Act Annex III area 1", "Biometric uses (emotion recognition, categorisation) "
                            "are listed in Annex III; the high-risk regime is outside this skill.",
                            [HIGH_RISK, STATUS], action="Stop; refer to a lawyer before go-live."))
    if personal:
        not_applicable(out, "AI Act art. 50(3)", "Personal non-professional activity: not a deployer "
                       "[AI Act art. 3(4)].", [ROLES])
    elif prohibited:
        deployer_duty(out, "to_confirm", "AI Act art. 50(3)",
                      "Inform exposed persons; only relevant if a lawyer confirms the use is allowed "
                      "[AI Act art. 50(3); AI Act Guidelines point 25].",
                      "Notice before the camera or microphone starts.", [TRANSPARENCY])
    else:
        deployer_duty(out, "applies", "AI Act art. 50(3)",
                      "Persons exposed to the system are informed of its operation [AI Act art. 50(3)].",
                      "Notice before the camera or microphone starts, with the GDPR information.",
                      [TRANSPARENCY])
    return out


def classify_decision(f: Dict[str, Any]) -> Dict[str, list]:
    out = empty()
    for p in ("AI Act art. 50(1)", "AI Act art. 50(2)", "AI Act art. 50(3)", "AI Act art. 50(4)"):
        not_applicable(out, p, "Decision support as declared; check again if it chats or generates "
                       "content for people.", [TRANSPARENCY])
    area = f.get("annex_iii_area")
    if area in ANNEX_III:
        out["stop"].append(item(f"AI Act {ANNEX_III[area]}", "The feature takes or prepares decisions about "
                                "people in an Annex III area; the high-risk regime is outside this skill.",
                                [HIGH_RISK, STATUS], action="Stop; refer to a lawyer before go-live."))
    elif area == "none":
        out["to_confirm"].append(item("AI Act Annex III", "Declared outside the Annex III areas.",
                                      [HIGH_RISK], action="A person checks the declaration against the table."))
    else:
        out["stop"].append(item("AI Act Annex III", "Decisions about people: possible Annex III area "
                                "(recruitment, credit, insurance, education, public benefits...).",
                                [HIGH_RISK, STATUS], action="Stop; screen with high-risk.md and refer to a lawyer."))
    out["to_confirm"].append(item("GDPR art. 22(1)", "Decisions based solely on automated processing with "
                                  "legal or similar effects.", [GDPR_RIGHTS],
                                  action="Check Article 22 with the privacy part of the skill."))
    return out


def classify_feature(f: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
    kind = f.get("kind")
    personal = is_personal(profile)
    roles, settled = resolve_role(f, profile)
    if kind == "translation":
        f = dict(f, kind="published-content", standard_editing_only=True,
                 modalities=f.get("modalities") or ["text"])
    elif kind == "code-assistance":
        f = dict(f, kind="published-content", source_code_only=True)
    kind = f["kind"]
    if kind == "chatbot":
        out = classify_chatbot(f, roles, settled)
    elif kind == "generator":
        out = classify_generator(f, roles, settled)
    elif kind == "published-content":
        out = classify_published(f, roles, settled, personal)
    elif kind in ("emotion-recognition", "biometric-categorisation", "emotion-or-biometric"):
        out = classify_biometric(f, kind, personal)
    elif kind == "decision-support":
        out = classify_decision(f)
    else:
        out = empty()
        out["to_confirm"].append(item("AI Act art. 50", f"Unknown feature kind '{kind}'.", [TRANSPARENCY],
                                      action="Describe the feature with a known kind and re-run."))
    if f.get("basis") == "assumed":
        demoted = [dict(x, reason=x["reason"] + " Based on an assumed answer.") for x in out["applies"]]
        out = dict(out, applies=[], to_confirm=out["to_confirm"] + demoted)
    has_duty = out["applies"] or [x for x in out["to_confirm"] if "50(" in x["provision"]]
    if has_duty:
        out["applies" if out["applies"] else "to_confirm"].append(item(
            "AI Act art. 50(5)", "Every notice or label is clear, distinguishable, given at the first "
            "interaction or exposure, and accessible [AI Act art. 50(5)].", [TRANSPARENCY],
            "whoever owes the paragraph", "Follow transparency.md section D."))
    role_label = "both" if roles == {"provider", "deployer"} else next(iter(roles))
    return {"id": f.get("id"), "kind": kind, "description": f.get("description", ""),
            "role": role_label, "role_settled": settled, **out}


def classify_site(profile: Dict[str, Any], features: List[Dict[str, Any]]) -> Dict[str, list]:
    out = empty()
    if features and not is_personal(profile):
        out["applies"].append(item("AI Act art. 4", "The operator uses AI systems: AI literacy measures for "
                                   "staff and contractors operating them.", [LITERACY],
                                   "provider and deployer", "Organisational: tell the owner; no code."))
    elif features:
        not_applicable(out, "AI Act art. 4", "Personal non-professional activity.", [LITERACY])
    missing = [flag for flag, _ in KIND_FROM_FLAG if answer(profile, f"ai.{flag}")[0] is None]
    if missing and not isinstance(answer(profile, "ai.features")[0], list):
        out["to_confirm"].append(item("Profile question 8", "Unanswered: " + ", ".join(
            f"ai.{m}" for m in missing) + ". Features behind them are not classified.",
            ["references/scoping/questionnaire.md"], action="Ask the user, then re-run."))
    out["to_confirm"].append(item("AI Act art. 5", "Prohibited practices are checked on every feature "
                                  "and every request, whatever the profile says.", [PROHIBITED],
                                  action="Run the stop list before writing code."))
    return out


def classify(profile: Dict[str, Any], source: str = "") -> Dict[str, Any]:
    features = derive_features(profile)
    return {
        "tool": "ai_act_classify",
        "disclaimer": DISCLAIMER,
        "profile": source,
        "dates": f"{STATUS} section 2",
        "features": [classify_feature(f, profile) for f in features],
        "site": classify_site(profile, features),
    }


# ---------------------------------------------------------------- output

HEADINGS = (("stop", "Stop"), ("applies", "Applies"), ("to_confirm", "To confirm"),
            ("does_not_apply", "Does not apply"))


def md_items(items: List[Dict[str, Any]]) -> List[str]:
    lines = []
    for x in items:
        who = f" ({x['addressee']})" if x.get("addressee") else ""
        action = f" Action: {x['action']}" if x.get("action") else ""
        lines.append(f"- **{x['provision']}**{who}: {x['reason']}{action} Read: "
                     + ", ".join(f"`{r}`" for r in x["read"]))
    return lines


def to_markdown(result: Dict[str, Any]) -> str:
    lines = ["# AI Act: Article 50 and stop cases", "", f"> {result['disclaimer']}", ""]
    if not result["features"]:
        lines += ["No AI feature declared in the profile.", ""]
    for f in result["features"]:
        settled = "" if f["role_settled"] else ", to confirm"
        lines += [f"## Feature `{f['id']}` ({f['kind']}, operator role: {f['role']}{settled})", ""]
        if f.get("description"):
            lines += [f["description"], ""]
        for key, title in HEADINGS:
            if f[key]:
                lines += [f"### {title}", ""] + md_items(f[key]) + [""]
    lines += ["## Whole site", ""]
    for key, title in HEADINGS:
        if result["site"][key]:
            lines += [f"### {title}", ""] + md_items(result["site"][key]) + [""]
    lines += [f"Dates of application: `{result['dates']}`.", ""]
    return "\n".join(lines)


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Article 50 classifier for a project profile.")
    parser.add_argument("profile", help="path to compliance/profile.json")
    parser.add_argument("--format", choices=("md", "json"), default="md")
    parser.add_argument("--out", help="write to this file instead of standard output")
    args = parser.parse_args(argv)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    try:
        profile = json.loads(Path(args.profile).read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        print(f"usage: cannot read the profile: {exc}", file=sys.stderr)
        return 2
    if not isinstance(profile, dict):
        print("usage: the profile is not a JSON object", file=sys.stderr)
        return 2
    result = classify(profile, args.profile)
    text = (json.dumps(result, ensure_ascii=False, indent=2) + "\n" if args.format == "json"
            else to_markdown(result))
    if args.out:
        Path(args.out).write_text(text, encoding="utf-8", newline="\n")
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
