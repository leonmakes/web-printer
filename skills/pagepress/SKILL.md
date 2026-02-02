---
name: pagepress
description: "Print web pages, export PDF, generate document reports, screenshot web pages, generate OG images, social cards, posters, infographics. Use when user mentions 'export PDF', 'print to PDF', 'generate report', 'convert to document', 'screenshot', 'capture', 'OG image', 'social card', 'poster', 'infographic', 'cheat sheet', 'web to image'. Supports beautiful Markdown formatting and visual assets."
---

# PagePress

CLI tool to convert HTML/Markdown into PDF documents or PNG images.

## Installation

```bash
npm install -g pagepress
npx playwright install chromium
```

## PDF Output

```bash
pagepress pdf -i input.md -o output.pdf --template default
```

### Core Strategy

PagePress provides two PDF generation modes:
1. **Markdown Beautification**: input Markdown and use built-in templates (default/github/magazine) for layout and styling.
2. **HTML/URL Print As-is**: input HTML or a URL and print directly without extra styles. The Agent should finish the HTML layout first.

### Scenario Routing Table (PDF)

| Scenario | Trigger Phrases | Input Method | Template/Options |
|---|---|---|---|
| **Markdown to document** | "export PDF", "generate report", "save as PDF", "convert to document" | `-i file.md` | `--template default` (or other templates) |
| **Web page print** | "print web page", "print to PDF", "save page as PDF" | `-i https://...` | Default (no template) |
| **HTML print** | "print HTML", "render HTML to PDF" | `-i file.html` | Default (no template) |

**Supported templates (Markdown only)**:
- `default` - Apple style, clean and elegant
- `github` - GitHub style
- `magazine` - VOGUE/WIRED magazine layout

**Options**:
- `-i, --input <path>` - input Markdown or HTML file
- `-o, --output <path>` - output PDF path
- `-t, --template <name>` - template (default: default)
- `--wait-until <state>` - navigation waitUntil: load, domcontentloaded, networkidle
- `--timeout <ms>` - navigation timeout in milliseconds
- `--safe` - disable external network requests and JavaScript execution

**Safe mode notes** (applies to pdf and shot):
- Remote URL input is not allowed.
- External network requests and JavaScript execution are disabled.

## Image Output

```bash
pagepress shot -i input.html -o output.png --preset og
```

> PNG output requires a `#container` element. Rendering fails if it is missing.

### Assets Directory (AI Agent Guidance)

- Ask the user where generated assets should be stored.
- Remember the answer as `$ASSETS_DIR` for the session.
- If the user does not reply or accepts the default, use `${workspaceRoot}/assets` (workspace root `assets/`).

### Temporary HTML Cleanup (AI Agent Guidance)

- If the AI Agent generates temporary HTML for rendering, use the system temporary directory:
  - If the agent provides its own session temp directory, prefer that.
  - Otherwise, use `$TMPDIR`; if unavailable, use `/tmp`.
  - Create a session subdirectory like `$TMPDIR/pagepress-$SESSION_ID/`.
- After a successful render, delete only the temporary HTML it generated.
- If the user asks to keep inputs for debugging or reuse, copy the file into `$ASSETS_DIR` and report its path.

### Scenario Routing Table (AI Agent Decision Guide)

| Scenario | Trigger Phrases | Parameters | Layout Guidelines |
|---|---|---|---|
| **screenshot (default)** | "screenshot this page", "capture the webpage", "take a screenshot" | **no preset** | Preserve the original web layout |
| **og (social card)** | "OG image", "social preview", "share card", "link preview" | `--preset og` | 1200x630; safe margin >=120px |
| **infographic** | "cheat sheet", "quick reference", "data card", "infographic", "long-form image" | `--preset infographic` | 1080x1350; high information density |
| **poster** | "poster", "vertical promo", "event poster", "promo poster" | `--preset poster` | 1200x1500; minimal text, strong visual impact |
| **banner** | "header", "cover image", "hero", "banner", "cover" | `--preset banner` | 1600x900; horizontal layout |

### Preset Specs and Design Guidelines (AI Agent Reference)

> These guidelines help the AI Agent generate high-quality HTML. Reuse the user's brand assets (colors, fonts, logo).

#### 1. og (1200x630) - Link Preview Image
- **Scenario**: Preview image when sharing links on social media.
- **Core principles**:
  - **Small-size readability**: the headline must be clearly legible at 400px width
  - **Single focus**: convey only one core message
  - **Safe area**: keep content at least **120px** from the edges

#### 3. infographic (1080x1350) - Infographic/Cheat Sheet
- **Scenario**: Structured presentation of complex information, even code snippets.
- **Core principle**: **High information density**
  - **Structured**: use grids, blocks, lists, numbering
  - **Clear hierarchy**: title > subtitle > body > annotation
  - **Moderate whitespace**: **100px+** margins to avoid crowding

#### 4. poster (1200x1500) - Poster
- **Scenario**: Vertical mobile visual impact (events, launches).
- **Core principle**: **Minimal text, maximum visual**
  - Text: only 1 main title + 1 subtitle
  - Main visual occupies 50%+
  - **120px+** margins

#### 5. banner (1600x900) - Banner
- **Scenario**: Blog covers, Twitter/LinkedIn header backgrounds.
- **Layout**: horizontal composition, content centered or left-text-right-image.

### Options
- `-i, --input <path>` - input HTML file or URL
- `-o, --output <path>` - output PNG path
- `-p, --preset <name>` - preset: `og`, `infographic`, `poster`, `banner`
- `--width <px>` - custom width
- `--height <px>` - custom height
- `--scale <n>` - device scale factor (default: 2)
- `--wait-until <state>` - navigation waitUntil: load, domcontentloaded, networkidle
- `--timeout <ms>` - navigation timeout in milliseconds
- `--safe` - disable external network requests and JavaScript execution

## Image Design Guidelines

> [!CAUTION]
> **No interactive elements** — the output is a **static visual asset**, not a web page.
>
> **Do not use**: navigation menus, buttons, links, forms, hamburger icons, or any elements that imply clickability.
>
> **Should use**: titles, taglines, decorative graphics, icons, statistics, brand marks.

## Examples

```bash
# Generate an OG image
pagepress shot -i card.html -o og.png --preset og

# Generate a PDF report
pagepress pdf -i report.md -o report.pdf --template github
```
