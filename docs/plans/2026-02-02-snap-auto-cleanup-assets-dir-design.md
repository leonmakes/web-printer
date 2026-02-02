# Design: remove auto-cleanup and add assets directory guidance

## Context
The shot command currently supports `--auto-cleanup`, which deletes the input file after rendering. This is risky for user data and is not aligned with safe defaults. We also need a clear convention for where AI Agents should place generated assets, with a remembered directory and a default.

## Goals
- Remove the `--auto-cleanup` option and any file deletion behavior from shot.
- Update agent guidance to ask users where assets should be stored and to remember it as `$ASSETS_DIR`.
- Provide a safe default when the user does not respond: `${workspaceRoot}/assets`.
- Keep behavior and docs consistent.

## Non-goals
- Implement broader security hardening or new CLI flags in this change.
- Add interactive prompts to the CLI.

## Changes
- Remove `--auto-cleanup` from `src/shot/command.ts` and from the shot options type.
- Remove the delete logic from `src/shot/renderer.ts`.
- Update `skills/pagepress/SKILL.md`:
  - Remove `--auto-cleanup` from the options list.
  - Add an "Assets directory" guidance block for AI Agents, including `$ASSETS_DIR` and the default path.

## Risks and follow-up plan
This change does not address existing operational risks. Plan for follow-ups:
1. **Safety mode for untrusted input**: introduce a `--safe` flag (or env var) to disable network requests and script execution for HTML/URL rendering.
2. **Timeout and wait strategy**: make `waitUntil` and navigation timeout configurable; add a default timeout to avoid hanging on long-lived connections.
3. **Resource limits**: clamp `width`, `height`, and `scale` to reasonable ranges with clear errors.
4. **Behavior parity**: either implement `--no-toc` or remove it from CLI/docs.
5. **Spec compliance**: enforce `#container` presence for PNG shots and fail fast with a clear error.

## Testing
- Manual: run `pagepress shot` with local HTML and ensure no input file deletion occurs.
- Manual: confirm help output and SKILL.md no longer mention `--auto-cleanup`.
