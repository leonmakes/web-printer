# Web Printer

[中文文档](README_CN.md)

A web content rendering toolkit designed for **AI Agents**, converting HTML, Markdown, and URLs to high-quality **PDF** or **PNG** images.

## ✨ Features

- **Dual Skill Architecture**: Independent `web-to-pdf` and `web-to-png` converters
- **Multiple Inputs**: Supports local HTML, Markdown files, or remote URLs
- **Rich Themes**: PDF supports 5 beautiful Markdown themes (Apple style, GitHub, Academic, Sketch, Magazine)
- **Flexible Output**: OG cards, posters, long screenshots, A4 documents, and more presets
- **Consistency Guaranteed**: Deterministic rendering, font waiting, network idle detection
- **Smart Storage**: Asks for output directory on first use, defaults to `{workspace}/assets/`

## 📦 Installation

### 🤖 AI Agent Installation

Provide the following GitHub URLs to your AI Agent, and it will automatically download and install:

| Skill | GitHub URL |
|-------|------------|
| **web-to-pdf** | `https://github.com/leonmakes/web-printer/tree/main/skills/web-to-pdf` |
| **web-to-png** | `https://github.com/leonmakes/web-printer/tree/main/skills/web-to-png` |

### 🔧 Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/leonmakes/web-printer.git

# 2. Copy skill to your AI Agent's skills directory
#    Example for Claude Code:
cp -r web-printer/skills/web-to-pdf ~/.claude/skills/
cp -r web-printer/skills/web-to-png ~/.claude/skills/

# 3. Enter skill directory and install dependencies
cd ~/.claude/skills/web-to-png
pnpm install

# 4. Install browser (Playwright)
pnpm exec playwright install chromium
```

> **Skills directory reference for other AI Agents**:
> - Claude Code: `~/.claude/skills/`
> - Gemini CLI / Antigravity: `~/.gemini/antigravity/skills/`
> - Other Agents: Please refer to their documentation

Each skill directory contains an independent `SKILL.md` documentation file. See each skill's usage guide for details.

## 🛠️ Skills Overview

### [web-to-pdf](skills/web-to-pdf/SKILL.md)

Convert HTML/Markdown/URL to PDF documents.

```bash
# Markdown (auto-beautified)
node skills/web-to-pdf/scripts/converter.js \
  --input doc.md --style magazine --output out.pdf

# HTML (print as-is)
node skills/web-to-pdf/scripts/converter.js \
  --input page.html --format html --output out.pdf
```

**Supported themes**: `default` (Apple) | `github` | `academic` | `magazine`

---

### [web-to-png](skills/web-to-png/SKILL.md)

Render HTML/URL to PNG images, ideal for social sharing cards, posters, and long screenshots.

```bash
# OG Card (1200×630)
node skills/web-to-png/scripts/converter.js \
  --input card.html --preset og --output og.png

# Screenshot (default)
node skills/web-to-png/scripts/converter.js \
  --url https://example.com --output page.png

# Infographic (width 1080, height auto)
node skills/web-to-png/scripts/converter.js \
  --url https://example.com --preset infographic --output long.png
```

**Supported presets**: `og` | `post` | `infographic` | `poster` | `banner`

Optional: Use `--meta` to output corresponding `meta.json`.

## 📁 Directory Structure

```
web-printer/
├── skills/
│   ├── web-to-pdf/        # PDF conversion skill
│   │   ├── SKILL.md       # Skill documentation
│   │   ├── scripts/       # Conversion scripts
│   │   ├── templates/     # Markdown theme templates
│   │   └── examples/      # Example files
│   │
│   └── web-to-png/        # PNG conversion skill
│       ├── SKILL.md       # Skill documentation
│       ├── scripts/       # Conversion scripts
│       └── examples/      # Example files
│
├── package.json
└── README.md
```

## 📄 License

MIT
