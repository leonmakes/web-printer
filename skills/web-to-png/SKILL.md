---
name: web-to-png
description: "Screenshot web pages, generate OG images, social cards, posters, infographics, and visual assets. Use when the user mentions 'screenshot', 'capture', 'OG image', 'social card', 'poster', 'infographic', 'cheat sheet', 'generate poster', or 'web to image'."
---

# Web-to-PNG Skill

Render **HTML (local file) or URL** to high-quality PNG.

> This skill is for **AI Agents**. Human users only provide requirements; the AI Agent generates HTML, then calls this skill to capture screenshots.

> [!IMPORTANT]
> **Temporary File Location**: When generating temporary HTML files, **ALWAYS write them to the system temp directory** (`/tmp` on macOS/Linux, or use `os.tmpdir()` in Node.js), **NOT the user's workspace**.
> - **Filename pattern**: `web-to-png-<timestamp>.html`
> - **Cleanup**: Delete temp files after screenshot is complete
> - **Output PNG**: The final PNG output CAN be saved to the user's workspace (that's the deliverable)
> 
> This prevents polluting the user's project with intermediate files.

## Scenario Routing Table (For AI Agent)

| Scenario | Trigger Phrases | Parameters | Layout Guidelines |
|---|---|---|---|
| **screenshot (default)** | "screenshot this page / capture the webpage" | **no preset** | Keep original layout; for real webpage screenshots |
| **og-image** | "OG image / social preview / share card" | `--preset og` | 1200×630; safe margin ≥120px |
| **post (social post)** | "social post / square image / daily share" | `--preset post` | 1080×1080; visual-first |
| **infographic** | "cheat sheet / quick reference / data card" | `--preset infographic` | 1080×1350; high information density |
| **poster** | "poster / vertical promo" | `--preset poster` | 1200×1500; minimal text, maximum visual |
| **banner** | "header / cover image / hero" | `--preset banner` | 1600×900; horizontal layout |

## Dependencies

> [!IMPORTANT]
> Install dependencies in **the skill's directory** (where this SKILL.md is located), NOT in the user's workspace.
> 
> `SKILL_DIR` = the directory containing this SKILL.md file

**Install packages** (dependencies declared in `package.json`):

```bash
cd $SKILL_DIR && pnpm install
```

**Browser dependency**:

```bash
cd $SKILL_DIR && pnpm exec playwright install chromium
```

## Input & Output

**Input (choose one)**
- `--input <file.html>` (local HTML file)
- `--url <https://...>` (remote URL)

**Output**
- `png` (required)
- `meta.json` (optional, use `--meta`)

## Screenshot Strategy

### 1) Fixed Dimensions (with preset)
- `viewport = preset`, `fullPage=false` (fixed crop)
- Auto-injects:
  ```css
  html, body { width: <W>px; height: <H>px; overflow: hidden; margin: 0; padding: 0; }
  ```

> [!CAUTION]
> **Technical Pitfall**: The script auto-injects `body { margin: 0; padding: 0; }`, which overrides any padding set directly on `body`!
> **Solution**: Always use an inner container `#app-container` for padding, not `body`.
> ```html
> <body>
>   <div id="app-container">
>     <!-- your content -->
>   </div>
> </body>
> ```
> ```css
> #app-container { width: 100%; height: 100%; padding: 100px; }
> ```

### 2) Screenshot (default)
- **Default behavior** (no preset)
- Uses Playwright default viewport (1280×720) + `fullPage=true`
- For "direct webpage screenshots"

---

## Preset Specifications & Design Guidelines (For AI Agent)

> These guidelines help **AI Agents** generate HTML. Reuse **brand assets from the user's workspace/project** (colors, fonts, logos, components, screenshots, illustrations) to maintain consistency.

### og (1200×630) - Link Preview Image

**Definition**: The first impression users get when a link appears in social feeds. Metadata attached to URLs.

**Core Constraints**:
- **Small-size readability**: Title must be legible at 400px width
- **Brand recognition**: Use consistent brand colors, fonts, and logo
- **Single focus**: Convey only one core message
- **Safe zone**: Keep key content ≥ **120px** from edges

---

### post (1080×1080) - Social Post

**Definition**: Universal social media post. 1:1 ratio works on all major platforms (Instagram / Twitter / LinkedIn / WeChat).

**Core Principle**: **Visual-first**
- Main visual takes 70%+ of the canvas
- Minimal text: Brand name + optional 1 line
- User behavior: Instant attraction (1-2 seconds)

**Visual Rules**:
- Main visual centered, size should be large
- 100px Padding for breathing room
- Brand logo optional

**Use Cases**: Daily shares, product showcases, feature highlights

**vs Poster**:
- Post (1:1): Most universal, for everyday content
- Poster (4:5): Larger screen presence, for important announcements

---

### infographic (1080×1350, 4:5) - Infographic / Cheat Sheet

**Definition**: Structured visualization of complex information. Emphasizes **information value**; users will **actively read**.

**Core Characteristics**:
- **High information density**: Condense lots of useful info into one image
- **Structured layout**: Use grids, sections, lists, numbers to guide reading
- **Clear hierarchy**: Title > Subtitle > Body > Labels, with extreme font size contrast
- **Moderate whitespace**: 100px+ Padding to avoid clutter

**Use Cases**:
- Cheat Sheets
- Feature comparison tables
- Step-by-step guides
- Data summaries
- API quick references

**vs Poster**:
- Poster is **minimal text, maximum visual** (instant impact)
- Infographic is **structured information** (reading comprehension)

---

### poster (1200×1500, 4:5) - Visual Poster

**Definition**: Portrait **visual-impact** image optimized for mobile feeds.

**Core Principle**: **Minimal text, maximum visual**
- Text: Only 1 Headline + 1 Tagline
- Main visual takes 50%+ of the canvas
- User behavior: Instant impact (1-3 seconds)

**Visual Rules**:
- Main visual centered, large size (400px+ recommended)
- 120px+ Padding for breathing room
- Brand logo at bottom corner

**Use Cases**: Product launches, event posters, brand statements

**Not suitable for**: Information-heavy content (use Infographic instead)

---

### banner (1600×900, 16:9) - Horizontal Cover

**Definition**: Horizontal visual image for social media headers and blog covers.

**Layout**: Horizontal composition, main visual centered or left-text-right-image
**Copy**: 1 headline + optional subtitle
**Use Cases**: Twitter/LinkedIn headers, blog covers, Newsletter banners

---

## Safe Margin Standards

| Preset | Dimensions | Recommended Padding | Notes |
|:---|:---|:---|:---|
| **og** | 1200×630 | **120px** | Ensures thumbnail readability |
| **post** | 1080×1080 | **100px** | Visual-first |
| **infographic** | 1080×1350 | **100px** | High density needs whitespace |
| **poster** | 1200×1500 | **120px** | Visual breathing room |
| **banner** | 1600×900 | **centered max-width** | Use `max-width: 1200px` for content |

---

## HTML Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, height=1350">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1350px;
      background: #000;
    }
    #app-container {
      width: 100%;
      height: 100%;
      padding: 100px; /* Set safe margins here */
    }
  </style>
</head>
<body>
  <div id="app-container">
    <!-- your content -->
  </div>
</body>
</html>
```

## CLI Usage

```bash
# OG Image (with auto-cleanup of temp file)
node scripts/converter.js --input /tmp/web-to-png-og-1706745600.html --preset og --output ~/Desktop/og.png --auto-cleanup

# Infographic
node scripts/converter.js --input /tmp/web-to-png-info-1706745601.html --preset infographic --output ~/project/assets/cheatsheet.png --auto-cleanup

# Poster
node scripts/converter.js --input /tmp/web-to-png-poster-1706745602.html --preset poster --output ~/Desktop/poster.png --auto-cleanup

# Screenshot from URL (no cleanup needed)
node scripts/converter.js --url https://example.com --output page.png
```

**Optional Parameters**:
- `--preset <og|post|infographic|poster|banner>`
- `--auto-cleanup` (delete input file after processing)
- `--meta [path]`
- `--device-scale-factor <number>`
- `--allow-scripts`
- `--allow-net <prefix>`
- `--wait-until <load|domcontentloaded|networkidle>`
- `--timeout-ms <number>`

## API (Node.js)

```js
import { toPng } from "./scripts/converter.js";

toPng({
  inputPath: "/tmp/web-to-png-poster-1706745602.html",
  outputPath: "~/Desktop/poster.png",
  options: {
    preset: "poster",
    write_meta: false,
    device_scale_factor: 2
  }
});
```
