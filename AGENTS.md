# 项目概览（给 AI Agent）

## 目标
提供一组 **skills**，把“内容（Markdown 本地文件 / HTML 本地文件或 URL / URL / Agent 输出的结构化结果）”渲染成一致、漂亮的 Web 文档（HTML+CSS），再导出为 **PDF 或 PNG**。

## 技术路线（必须）
- 使用 **Playwright + Chromium** 作为渲染与导出引擎。
- **PNG**：使用 `page.screenshot`，支持 `viewport` / `deviceScaleFactor` 等；有 preset 固定裁剪（`fullPage=false`），无 preset 长图模式（`viewport.width=1080` + `fullPage=true`）。
- **PDF**：使用浏览器打印引擎（等价 `Page.printToPDF` 语义），暴露 `format` / `margins` / `printBackground` / `preferCSSPageSize` / `scale` / `pageRanges` 等。可通过 `-webkit-print-color-adjust: exact` 控制色彩一致性。
- **主题设计**：整体以**留白、呼吸感**为主，避免拥挤排版。

## 依赖安装（统一在项目根目录）
```bash
cd /path/to/web-printer
pnpm install
pnpm exec playwright install chromium
```

可选依赖：
- `@mermaid-js/mermaid-cli`（Markdown 中含 mermaid 代码块时）
- `pdfinfo`（poppler，用于 PDF 页数统计）

## 技能目录约定
- 每个 skill **完全独立**，**永远不共享**代码，便于单独复制安装。
- 每个 skill 至少包含：`SKILL.md`、`scripts/`（必需）；`templates/` 与 `examples/` 可选。

## 当前技能

### 1) `skills/web-to-pdf`
- 将 URL / HTML（本地或 URL）/ Markdown（本地）导出为 PDF。
- Markdown 有 5 种主题：`default` / `github` / `academic` / `sketch` / `magazine`。
- HTML/URL 为“纯打印”，需要调用方自行排版。

### 2) `skills/web-to-png`
- 仅支持 **HTML 本地文件或 URL** 导出为 PNG（不支持 Markdown/模板/主题）。
- **有 preset**：`viewport = preset`，`fullPage=false` 固定裁剪，并注入 `html, body` 固定宽高与 `overflow:hidden`。
- **默认 screenshot**（无 preset）：Playwright 默认视口，`fullPage=true`，不做宽度限制。
- **Infographic**：`preset=infographic` → `viewport.width=1080`，`fullPage=true`，输出长图。
- 预设尺寸：  
  - `og` 1200×630  
  - `square` 1080×1080  
  - `story` 1080×1920  
  - `poster` 1200×1500  
  - `banner` 1600×900  
  - `infographic` 1080×auto  
- AI Agent 生成 HTML 时应复用**用户当前 workspace/项目**的品牌/视觉/产品信息。

## 忽略规则
`.gitignore` 必须包含：
- `node_modules/`
- `skills/**/outputs/`
- 常规日志/缓存/系统文件
