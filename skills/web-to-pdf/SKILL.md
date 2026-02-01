---
name: web-to-pdf
description: "Print web pages, export PDF, generate document reports. Use when the user mentions 'export PDF', 'print to PDF', 'generate report', 'convert to document', 'save as PDF', or 'print web page'. Supports beautiful Markdown formatting."
---

# Web-to-PDF Skill

Convert HTML, Markdown, or web URLs to high-quality PDF.

- **Markdown Input**: 5 beautiful themes with auto-formatting (has beautification capability)
- **HTML/URL Input**: Print as-is (Agent must complete layout beforehand)

## Dependencies

> [!IMPORTANT]
> Install dependencies in **the skill's directory** (where this SKILL.md is located), NOT in the user's workspace.
> 
> `SKILL_DIR` = the directory containing this SKILL.md file

**Install packages** (dependencies declared in `package.json`):

```bash
cd $SKILL_DIR && pnpm install
```

**Browser dependency** (required for Playwright rendering):

```bash
cd $SKILL_DIR && pnpm exec playwright install chromium
```

**Optional dependencies**:

- `pdfinfo` (from poppler, for page count): `brew install poppler`
- `@mermaid-js/mermaid-cli` (when Markdown contains mermaid code blocks): `pnpm add -g @mermaid-js/mermaid-cli`

**Reuse Playwright browser cache (avoid repeated downloads)**:

```bash
export PLAYWRIGHT_BROWSERS_PATH=~/Library/Caches/ms-playwright  # macOS
# export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright        # Linux
```

## File Location Strategy

> [!IMPORTANT]
> **First use in a workspace**: Ask the user where to save generated files. Store the answer as `$ASSETS_DIR`.
> - If user specifies a path → `$ASSETS_DIR = {workspace}/{user-specified-path}`
> - If user has no preference → `$ASSETS_DIR = {workspace}/assets/` (default)
> 
> **Note**: `$ASSETS_DIR` is always **relative to the workspace root**, never an absolute path outside the workspace.
> 
> **Subsequent uses**: Reuse `$ASSETS_DIR` for all generated files in this workspace.

## Core Strategy

> [!IMPORTANT]
> **AI Agent Usage Guide**
> 
> This skill has two usage modes:
> 
> ### Mode 1: Markdown Formatting (with beautification)
> If content is in **Markdown format**, this skill provides **5 beautiful themes** for auto-formatting:
> - `default` (Apple style), `github`, `academic` (paper), `magazine`
> - Agent only needs to organize content as Markdown to get professional formatting
> 
> ### Mode 2: HTML/URL Printing (print only, no beautification)
> If passing **HTML file** or **URL**, this skill only performs "print" operation:
> - Agent should **complete HTML beautification and layout first**
> - This skill prints as-is, without adding any styles

**Workflow**:
```
Method 1: Raw content → [Agent organizes as Markdown] → [Web-to-PDF + theme] → Beautiful PDF
Method 2: Raw content → [Agent beautifies as HTML] → [Web-to-PDF prints] → PDF
```

## Input Examples

| Method | Beautification | Use Case | CLI Usage |
|--------|----------------|----------|-----------|
| **Markdown** | ✅ 5 themes | Agent organizes content as Markdown | `--input file.md --style default` |
| **HTML file** | ❌ Print only | Agent completed HTML layout | `--input file.html --format html` |
| **URL** | ❌ Print only | Print web page or local HTML | `--url file:///path/to/file.html` |

**Plain text input not supported** (convert to Markdown file or HTML first).

## Output

- `pdfPath` (required)
- `htmlPath` (kept by default, use `--no-html` to disable)
- `meta.json` (contains Chromium version, generation time, page count, input hash)

## Theme Styles

### Default

Apple design style — clean, elegant, premium:

- SF Pro font system, refined typography hierarchy
- Generous whitespace, comfortable reading experience
- Light code blocks, professional syntax highlighting
- Feature cards, step lists, and modern components

### GitHub

GitHub style for long-form reading:

- Optimal reading width (820px) with comfortable line height (1.75)
- Clear heading hierarchy and paragraph spacing
- Complete code highlighting and table styles
- GitHub Alerts style callouts

### Academic

Academic paper style:

- Serif font (Times New Roman)
- Two-column layout
- Centered title and abstract area
- Light code highlighting

### Sketch

Hand-drawn/Doodle style — fun, creative, personalized:

- Handwriting fonts (Caveat / Architects Daughter)
- Notebook binding holes and lined background
- Sticky note style code blocks
- Speech bubble quotes, wavy underlines, highlighter emphasis

### Magazine

Professional magazine layout style:

- Elegant serif titles (Playfair Display)
- Two-column layout with dividers
- Drop cap effect
- Premium color palette and refined spacing

## API (Node.js Example)

```js
import { toPdf } from "./scripts/converter.js";

toPdf({
  inputPath: "examples/skill-overview.md",
  outputPath: "output.pdf",
  style: "default", // default | github | academic | magazine
  options: {
    format: "markdown"
  }
});
```

## CLI Usage

```bash
# Markdown (default)
node scripts/converter.js --input doc.md --style default --output out.pdf

# HTML file
node scripts/converter.js --input page.html --format html --style github --output out.pdf

# Render URL directly
node scripts/converter.js --url https://example.com --output out.pdf

# Don't keep intermediate HTML
node scripts/converter.js --input doc.md --output out.pdf --no-html
```

**Full Parameters**:

| Parameter | Description |
|-----------|-------------|
| `--input` | Input file path (md/html) |
| `--url` | Print URL directly |
| `--output` | Output PDF path (required) |
| `--style` | Theme: `default`/`github`/`academic`/`magazine` |
| `--format` | Input format: `markdown`/`html` |
| `--no-html` | Don't keep intermediate HTML file |
| `--allow-scripts` | Allow JavaScript execution |
| `--no-mermaid` | Disable Mermaid pre-rendering (keep code blocks) |
| `--mermaid-cli` | Specify Mermaid CLI (mmdc) path |

## Directory Structure

```
web-to-pdf/
  SKILL.md              # Skill documentation
  scripts/
    converter.js        # Core converter (Node.js)
  templates/            # HTML templates (inline styles)
    default.html        # Default (Apple style)
    github.html         # GitHub long-form style
    academic.html       # Academic paper style
    magazine.html       # Magazine layout style
  examples/             # Examples
    skill-overview.md   # Example
```

## Print Engine

> [!IMPORTANT]
> **AI Agent Priority Strategy (documentation convention only)**
> 
> If runtime environment provides **Playwright MCP**, prioritize using MCP to generate PDF,
> avoiding local Playwright/Chromium download; only use local Playwright installation and rendering when no Playwright MCP is available.

### Playwright (Sandbox Compatible)

Recommended to use Playwright, runs stably in sandbox environments:

```bash
# Install (with local dependencies already installed)
pnpm exec playwright install chromium
```

Supported options: `printBackground`, `preferCSSPageSize`, `scale`, `margins`, `format`, `pageRanges`

## Consistency Guarantees

- HTML rendering determinism: same input + theme + Chromium version ⇒ stable output
- Default inline/localize external resources (configurable)
- Wait before print: `document.fonts.ready` + `waitUntil(networkidle)` + `timeoutMs`
- Print CSS: includes `@media print` and `@page`
- Color consistency: `-webkit-print-color-adjust: exact`

## Security

- Default strips `<script>` (unless explicit allowScripts)
- Configurable network access whitelist

## Relationship with Other Skills

- **docx skill**: Generate editable Word documents
- **pdf skill**: PDF extraction / form filling
- **web-to-pdf skill**: Generate high-quality PDF reports
