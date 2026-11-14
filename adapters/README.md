# Adapters

Pointers for coding agents that do not load Agent Skills (`SKILL.md`) by themselves. They do not copy the skill: they tell the agent where the skill is vendored in the project and to follow its [SKILL.md](../SKILL.md), and they repeat the absolute rules in a few lines so that they apply even when the agent skips the link. Updating the vendored skill updates what the agent follows.

Agents that load skills natively (Claude Code, Codex, and those supported by `npx skills`) do not need these files: see the installation section of [README.md](../README.md).

## 1. Vendor the skill in the website project

```bash
git submodule add https://github.com/<owner>/eu-web-compliance.git .vendor/eu-web-compliance
# or: git clone --depth 1 https://github.com/<owner>/eu-web-compliance.git .vendor/eu-web-compliance
```

`<owner>` is a placeholder until the public repository exists. The adapters assume `.vendor/eu-web-compliance/`; if you choose another folder, replace that path in the file you copy. For the browser checks, run `npm install` once in that folder (Node 20+).

## 2. Copy the file your agent reads

| Agent | File in this folder | Copy it to (in the website project) | Notes |
|-------|---------------------|--------------------------------------|-------|
| GitHub Copilot (VS Code, JetBrains, github.com) | [copilot-instructions.md](copilot-instructions.md) | `.github/copilot-instructions.md` | Repository-wide instructions, sent with every request. If the project already has this file, append the content instead of replacing it. |
| Cursor | [cursor-rule.mdc](cursor-rule.mdc) | `.cursor/rules/eu-web-compliance.mdc` | See below for the `alwaysApply` choice. |
| Codex, Windsurf, Amp, Devin, and Copilot or Cursor when they read `AGENTS.md` | The block in part A of [AGENTS.md](../AGENTS.md) | The project's own `AGENTS.md` | One file serves every `AGENTS.md`-aware agent; prefer it when the project already has one. |

### Why the Cursor rule is not "always apply"

`alwaysApply: false` with `globs` makes it an auto-attached rule: Cursor adds it when a file of a web type (markup, styles, scripts, templates, server and hosting configuration) is in the conversation, and its `description` lets the agent request it otherwise, for example for an audit asked in plain words. An always-applied rule would cost context in every chat, including those about unrelated code. If your project is a website and nothing else, setting `alwaysApply: true` is a reasonable choice.

## Limits

- These agents do not run the skill's scripts by themselves; the adapters give the commands, and the agent or the user runs them.
- Copilot and Cursor may load less of the skill than a native skill loader would. Keep the vendored folder in the repository so that the agent can open the reference files the task table names.

Author: Tarek BELHADJ - Kayzen (<https://www.kayzen-lyon.com>).
