# Design: safety mode, navigation controls, limits, and card container enforcement

## Context
We need to reduce SSRF/data exfiltration risk, avoid hangs on long-lived connections, and enforce output constraints for PNG rendering. We also want consistent CLI ergonomics for presets.

## Goals
- Add `--safe` to disable external network requests and JavaScript execution.
- Make navigation `waitUntil` and `timeout` configurable for pdf and shot.
- Enforce reasonable bounds on shot `width`, `height`, and `scale` with clear errors.
- Require `#container` for PNG output and fail fast if missing.
- Add `-p` shorthand for `--preset` to align with `-t/--template`.

## Non-goals
- Implement TOC generation; `--no-toc` has been removed.
- Build an interactive prompt flow for asset outputs.

## Changes
- **CLI**
  - PDF: `--safe`, `--wait-until <state>`, `--timeout <ms>`.
  - Shot: `-p, --preset <name>`, `--safe`, `--wait-until <state>`, `--timeout <ms>`.
- **Safety mode**
  - If `--safe` and input is a remote URL, return an error.
  - Disable JS via `javaScriptEnabled: false`.
  - Block `http://` and `https://` requests via route interception.
- **Navigation controls**
  - Default `waitUntil=networkidle`, `timeout=30000`.
  - Accept only `load|domcontentloaded|networkidle`.
- **Shot constraints**
  - Enforce `width/height` in [100, 5000] and `scale` in [1, 4].
- **PNG container enforcement**
  - Require `#container` and use its bounding box for screenshot.

## Testing
- Manual: verify `--safe` blocks URL input and external requests.
- Manual: verify waitUntil/timeout changes navigation behavior.
- Manual: confirm dimension validation errors for out-of-range values.
- Manual: confirm missing `#container` throws a clear error.
