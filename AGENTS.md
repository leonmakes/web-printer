# Project Overview (for AI Agents)

## Language Convention

> [!IMPORTANT]
> **All files inside `skills/` directory must be in English**, including:
> - `SKILL.md`
> - Code comments and error messages in `scripts/`
> - HTML templates in `templates/`
> - Example files in `examples/`
>
> **Only the root `README_CN.md` is in Chinese** (as a convenience for Chinese users).
>
> When creating or modifying files under `skills/`, always use English.

## Goal
Provide a set of **skills** to render content (Markdown local files / HTML local files or URLs / structured output from Agents) into consistent, beautiful web documents (HTML+CSS), then export as **PDF or PNG**.

## Technical Requirements
- Use **Playwright + Chromium** as the rendering and export engine.
- **PNG**: Use `page.screenshot`, supports `viewport` / `deviceScaleFactor` etc.; with preset uses fixed crop (`fullPage=false`), without preset uses long-image mode (`viewport.width=1080` + `fullPage=true`).
- **PDF**: Use browser print engine (equivalent to `Page.printToPDF` semantics), exposing `format` / `margins` / `printBackground` / `preferCSSPageSize` / `scale` / `pageRanges` etc. Color consistency controlled via `-webkit-print-color-adjust: exact`.
- **Theme Design**: Overall emphasis on **whitespace and breathing room**, avoiding cluttered layouts.

## Dependency Installation (unified at project root)
```bash
cd /path/to/web-printer
pnpm install
pnpm exec playwright install chromium
```

Optional dependencies:
- `@mermaid-js/mermaid-cli` (when Markdown contains mermaid code blocks)
- `pdfinfo` (poppler, for PDF page count)

## Skill Directory Convention
- Each skill is **completely independent**, **never shares** code, making it easy to copy and install individually.
- Each skill must contain at least: `SKILL.md`, `scripts/` (required); `templates/` and `examples/` are optional.

## Current Skills

### 1) `skills/web-to-pdf`
- Export URL / HTML (local or URL) / Markdown (local) to PDF.
- Markdown has 4 themes: `default` / `github` / `academic` / `magazine`.
- HTML/URL is "print only" - caller must handle layout.

### 2) `skills/web-to-png`
- Only supports **local HTML files or URLs** export to PNG (no Markdown/templates/themes).
- **With preset**: `viewport = preset`, `fullPage=false` fixed crop, injects `html, body` fixed dimensions and `overflow:hidden`.
- **Default screenshot** (no preset): Playwright default viewport, `fullPage=true`, no width restriction.
- **Infographic**: `preset=infographic` → `viewport.width=1080`, `fullPage=true`, outputs long image.
- Preset sizes:
  - `og` 1200×630
  - `post` 1080×1080
  - `infographic` 1080×1350
  - `poster` 1200×1500
  - `banner` 1600×900
- AI Agent should reuse **brand/visual/product info from user's current workspace/project** when generating HTML.

## Ignore Rules
`.gitignore` must include:
- `node_modules/`
- `skills/**/outputs/`
- Common logs/cache/system files
