---
name: web-to-pdf
description: "打印网页、导出 PDF、生成文档报告。当用户提到「导出 PDF」「打印成 PDF」「生成报告」「转成文档」「保存为 PDF」「打印网页」时使用。支持 Markdown 美化排版。"
---

# Web-to-PDF Skill

将 HTML、Markdown、网页 URL 转换为高质量 PDF。

- **Markdown 输入**：提供 5 种精美主题自动排版（有美化能力）
- **HTML/URL 输入**：原样打印（Agent 需先自行完成排版）

## 依赖

> [!IMPORTANT]
> 在 **skill 目录**（本 SKILL.md 所在目录）安装依赖，而不是用户的工作区。
> 
> `SKILL_DIR` = 本 SKILL.md 文件所在目录

**安装依赖**（依赖在 `package.json` 中声明）：

```bash
cd $SKILL_DIR && pnpm install
```

**安装浏览器**（Playwright 渲染必需）：

```bash
cd $SKILL_DIR && pnpm exec playwright install chromium
```

**可选依赖**：

- `pdfinfo`（来自 poppler，用于页数统计）：`brew install poppler`
- `@mermaid-js/mermaid-cli`（Markdown 中含 mermaid 代码块时）：`pnpm add -g @mermaid-js/mermaid-cli`

**复用 Playwright 浏览器缓存（避免重复下载）**：

```bash
export PLAYWRIGHT_BROWSERS_PATH=~/Library/Caches/ms-playwright  # macOS
# export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright        # Linux
```

## 核心策略

> [!IMPORTANT]
> **AI Agent 使用指南**
> 
> 本 skill 有两种使用模式：
> 
> ### 模式一：Markdown 排版（有美化能力）
> 如果内容是 **Markdown 格式**，本 skill 提供 **5 种精美主题**自动排版：
> - `default`（Apple 风格）、`github`、`academic`（论文）、`sketch`（手绘）、`magazine`（杂志）
> - Agent 只需将内容整理为 Markdown，即可获得专业排版效果
> 
> ### 模式二：HTML/URL 打印（纯打印，无美化）
> 如果传入 **HTML 文件** 或 **URL**，本 skill 仅执行"打印"操作：
> - Agent 应**先自行完成 HTML 的美化和排版**
> - 本 skill 原样打印，不会添加任何样式

**流程示意**：
```
方式1：原始内容 → [Agent 整理为 Markdown] → [Web-to-PDF + 主题] → 精美 PDF
方式2：原始内容 → [Agent 美化为 HTML] → [Web-to-PDF 打印] → PDF
```

## 输入方式示例

| 方式 | 美化能力 | 适用场景 | CLI 用法 |
|------|----------|----------|----------|
| **Markdown** | ✅ 5 种主题 | Agent 整理内容为 Markdown | `--input file.md --style default` |
| **HTML 文件** | ❌ 仅打印 | Agent 已完成 HTML 排版 | `--input file.html --format html` |
| **URL** | ❌ 仅打印 | 打印网页或本地 HTML | `--url file:///path/to/file.html` |

**不支持纯文本输入**（如需文本请先整理为 Markdown 文件或 HTML）。  

## 输出

- `pdfPath`（必需）
- `htmlPath`（默认保留，`--no-html` 可关闭）
- `meta.json`（包含 Chromium 版本、生成时间、页数、输入摘要 hash）

## 主题样式

### Default（默认）

Apple 设计风格——简洁、优雅、高级感：

- SF Pro 字体系统，精致的字体层级
- 大量留白，舒适的阅读体验
- 浅色代码块，专业语法高亮
- 特性卡片、步骤列表等现代组件

### GitHub

适合长文阅读场景的 GitHub 风格：

- 最佳阅读宽度（820px）与舒适行高（1.75）
- 清晰的标题层级与段落间距
- 完整的代码高亮与表格样式
- GitHub Alerts 风格的提示框

### Academic

学术论文风格：

- 衬线字体（Times New Roman）
- 双栏布局
- 居中标题与摘要区域
- 浅色代码高亮

### Sketch（手绘）

手绘/Doodle 风格——轻松、创意、个性化：

- 手写字体（Caveat / Architects Daughter）
- 笔记本装订线与横线背景
- 便利贴风格代码块
- 对话气泡引用、波浪下划线、荧光笔强调

### Magazine（杂志）

专业杂志排版风格：

- 优雅衬线标题（Playfair Display）
- 双栏布局与分隔线
- 首字下沉效果
- 高级感配色与精致间距

## API（Node.js 示例）

```js
import { toPdf } from "./scripts/converter.js";

toPdf({
  inputPath: "examples/skill-overview.md",
  outputPath: "output.pdf",
  style: "default", // default | github | academic | sketch | magazine
  options: {
    format: "markdown"
  }
});
```

## CLI 使用

```bash
# Markdown（默认）
node scripts/converter.js --input doc.md --style default --output out.pdf

# HTML 文件
node scripts/converter.js --input page.html --format html --style github --output out.pdf

# 直接渲染 URL
node scripts/converter.js --url https://example.com --output out.pdf

# 不保留中间 HTML
node scripts/converter.js --input doc.md --output out.pdf --no-html
```

**完整参数**：

| 参数 | 说明 |
|------|------|
| `--input` | 输入文件路径（md/html） |
| `--url` | 直接打印 URL |
| `--output` | 输出 PDF 路径（必需） |
| `--style` | 主题：`default`/`github`/`academic`/`sketch`/`magazine` |
| `--format` | 输入格式：`markdown`/`html` |
| `--no-html` | 不保留中间 HTML 文件 |
| `--allow-scripts` | 允许执行 JavaScript |
| `--no-mermaid` | 禁用 Mermaid 预渲染（保留代码块） |
| `--mermaid-cli` | 指定 Mermaid CLI（mmdc）路径 |

## 目录结构

```
web-to-pdf/
  SKILL.md              # 技能说明文档
  scripts/
    converter.js        # 核心转换器（Node.js）
  templates/            # HTML 模板（内联样式）
    default.html        # 默认（Apple 风格）
    github.html         # GitHub 长文风格
    academic.html       # 学术论文风格
    sketch.html         # 手绘/Doodle 风格
    magazine.html       # 杂志排版风格
  examples/             # 示例
    skill-overview.md   # 示例
```

## 打印引擎

> [!IMPORTANT]
> **AI Agent 优先策略（仅文档约定）**
> 
> 若运行环境提供 **Playwright MCP**，优先复用 MCP 生成 PDF，
> 避免本地下载 Playwright/Chromium；仅在无可用 Playwright MCP 时再走本地 Playwright 安装与渲染。

### Playwright（沙盒兼容）

推荐使用 Playwright，在沙盒环境中运行稳定：

```bash
# 安装（在本地依赖已安装的前提下）
pnpm exec playwright install chromium
```

支持选项：`printBackground`、`preferCSSPageSize`、`scale`、`margins`、`format`、`pageRanges`

## 一致性保障

- HTML 渲染确定性：相同输入 + 主题 + Chromium 版本 ⇒ 输出稳定
- 默认内联/本地化外链资源（可配置）
- 打印前等待：`document.fonts.ready` + `waitUntil(networkidle)` + `timeoutMs`
- Print CSS：包含 `@media print` 与 `@page`
- 颜色一致：`-webkit-print-color-adjust: exact`

## 安全

- 默认剥离 `<script>`（除非显式 allowScripts）
- 可配置网络访问白名单

## 与其他 skill 的关系

- **docx skill**：生成可编辑 Word 文档
- **pdf skill**：PDF 提取 / 填表
- **web-to-pdf skill**：生成高质量 PDF 报告
