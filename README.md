# PagePress

A web content rendering toolkit (CLI) designed for **AI Agents**, converting HTML, Markdown, and URLs into high-quality **PDF** or **PNG** images.

## ✨ Features

- **Unified CLI**: One tool (`pagepress`) for both PDF and image generation
- **AI Agent friendly**: Includes a detailed SKILL.md guide with scenario routing
- **Multiple inputs**: Local HTML, Markdown files, or remote URLs
- **Rich templates**:
  - **PDF**: Apple style, GitHub style, magazine layout (Magazine)
  - **Image**: OG cards, infographics, posters, banners
- **Consistency guarantees**: Deterministic rendering, font waiting, network idle detection, syntax highlighting

## 📦 Installation

```bash
# Global install
npm install -g pagepress

# Install browsers (Playwright)
npx playwright install chromium
```

Or use `npx` directly:

```bash
npx pagepress <command> [options]
```

## 🚀 Usage

### 1. Generate PDF

Convert HTML/Markdown into PDF documents. Supports syntax highlighting.

```bash
# Markdown to PDF (Apple style template)
pagepress pdf -i document.md -o output.pdf --template default

# Local HTML file to PDF
pagepress pdf -i page.html -o output.pdf

# Render a web page (as-is)
pagepress pdf -i https://example.com -o webpage.pdf
```

**Supported templates**:
- `default` - Apple style, clean and elegant
- `github` - GitHub style
- `magazine` - VOGUE/WIRED magazine layout

### 2. Generate Images

Render HTML/URLs into PNG images, suitable for social share cards, posters, and long screenshots.

```bash
# Generate an OG card (1200x630)
pagepress shot -i card.html -o og.png --preset og

# Generate a long infographic
pagepress shot -i stats.html -o infographic.png --preset infographic

# Webpage screenshot
pagepress shot -i https://example.com -o screenshot.png
```

**Supported presets**:
- `og` (1200x630) - Social card
- `infographic` (1080x1350) - Infographic
- `poster` (1200x1500) - Poster
- `banner` (1600x900) - Banner

## 🤖 AI Agent Integration

This project includes a detailed [SKILL.md](skills/pagepress/SKILL.md) to help AI Agents (such as Claude, ChatGPT) understand how to use this tool.

Agents can automatically choose the appropriate commands and parameters based on natural language instructions (for example, "generate a poster" or "convert this document to PDF").

## 📄 License

MIT
