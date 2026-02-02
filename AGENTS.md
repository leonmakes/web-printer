# Project Overview (for AI Agent)

## Goal
Provide the `pagepress` CLI tool to render Markdown / HTML / URL into consistent, polished web documents, then export them as **PDF or PNG**.

## Technical Approach
- **Playwright + Chromium** as the rendering and export engine
- **PNG**: use `page.screenshot`, capture only `#container` (fail if missing)
- **PDF**: use the browser print engine (`Page.printToPDF`), with `-webkit-print-color-adjust: exact`
- **Theme design**: emphasize whitespace and breathing room; avoid cramped layout

```bash
cd /path/to/web-printer
pnpm install
pnpm exec playwright install chromium
```

> [!NOTE]
> **Mermaid diagrams**: built-in support, no preprocessing needed. The ` ```mermaid ` code block in Markdown will automatically render into Apple-style SVG graphics.

## Code Organization (Domain-driven / Go Style)

Use a **domain-based** directory structure rather than technical layers:

```
src/
├── cli.ts              # entry
├── pdf/                # PDF domain
│   ├── renderer.ts     # PDF rendering logic
│   ├── templates.ts    # template definitions
│   ├── fonts.ts        # font injection
│   └── templates/      # HTML template files
└── shot/               # Shot (PNG) domain
    ├── renderer.ts     # screenshot logic
    └── presets.ts      # size presets
```

**Principles**:
- Each domain folder is **self-contained**, including all code for that domain (logic, types, resources)
- **Avoid cross-domain dependencies**; shared code should go in `shared/` or be lifted to the parent level
- When adding features, first determine the domain, then extend within that directory

## Skills Directory
```
skills/
└── pagepress/SKILL.md    # the only skill; see that file for details
```

The main program source lives in `src/`, and the CLI is exposed via `dist/cli.js`.

## CLI Usage

```bash
# PDF rendering
pagepress pdf -i document.md -o output.pdf --template default
pagepress pdf -i page.html -o output.pdf
pagepress pdf -i https://example.com -o webpage.pdf

# PNG shots
pagepress shot -i card.html -o og.png --preset og
pagepress shot -i https://example.com -o screenshot.png
```

## Git Commit Conventions

### Conventional Commits
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Common types**:
- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation update
- `style`: formatting (no logic changes)
- `refactor`: refactor
- `test`: testing related
- `chore`: build/tooling

### Atomic Commits

> [!IMPORTANT]
> **One commit does one thing.** Each commit should be the smallest independent change that can be reverted.

**Principles**:
1. **Single responsibility**: one commit solves one problem or implements one feature
2. **Independently testable**: project should build/run after each commit
3. **Independently reversible**: rollback should only affect that change

**Anti-patterns** (avoid):
```bash
# ❌ Mixed changes
git commit -m "feat: add PDF export, fix CSS bug, update README"

# ❌ Incomplete feature (breaks build)
git commit -m "feat: half of the new feature"
```

**Correct examples**:
```bash
# ✅ Step-by-step commits
git commit -m "feat(pdf): add magazine template"
git commit -m "fix(pdf): correct margin calculation"
git commit -m "docs: update template options in README"
```

## .gitignore must include
- `node_modules/`
- `dist/`
- `skills/**/outputs/`
- common logs/cache/system files
