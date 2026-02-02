# PagePress

一套专为 **AI Agent** 设计的 Web 内容渲染工具集（CLI），可将 HTML、Markdown、URL 转换为高质量的 **PDF** 或 **PNG** 图像。

## ✨ 特性

- **统一 CLI**：一个工具 (`pagepress`) 搞定 PDF 和 Image 生成
- **AI Agent 友好**：包含详细的 SKILL.md 指南，支持场景路由
- **多种输入**：支持本地 HTML、Markdown 文件或远程 URL
- **丰富模板**：
  - **PDF**: Apple 风格、GitHub 风格、杂志排版 (Magazine)
  - **Image**: OG 卡片、信息图、海报、横幅
- **一致性保障**：确定性渲染、字体等待、网络空闲检测、代码高亮

## 📦 安装

```bash
# 全局安装
npm install -g pagepress

# 安装浏览器（Playwright）
npx playwright install chromium
```

或者直接使用 `npx`:

```bash
npx pagepress <command> [options]
```

## 🚀 使用指南

### 1. 生成 PDF

将 HTML/Markdown 转换为 PDF 文档。支持代码高亮。

```bash
# Markdown 转 PDF（使用 Apple 风格模板）
pagepress pdf -i document.md -o output.pdf --template default

# 本地 HTML 文件转 PDF
pagepress pdf -i page.html -o output.pdf

# 网页打印（原样渲染）
pagepress pdf -i https://example.com -o webpage.pdf
```

**支持的模板**：
- `default` - Apple 风格，简洁优雅
- `github` - GitHub 风格
- `magazine` - VOGUE/WIRED 杂志排版

### 2. 生成图像

将 HTML/URL 渲染为 PNG 图像，适合社交分享卡片、海报、长图截屏。

```bash
# 生成 OG 卡片（1200×630）
pagepress shot -i card.html -o og.png --preset og

# 生成信息长图
pagepress shot -i stats.html -o infographic.png --preset infographic

# 网页截图
pagepress shot -i https://example.com -o screenshot.png
```

**支持的预设**：
- `og` (1200×630) - 社交卡片
- `infographic` (1080×1350) - 信息图
- `poster` (1200×1500) - 海报
- `banner` (1600×900) - 横幅

## 🤖 AI Agent 集成

本项目包含详细的 [SKILL.md](skills/pagepress/SKILL.md)，旨在帮助 AI Agent（如 Claude, ChatGPT）理解如何使用此工具。

Agent 可以根据用户的自然语言指令（如“生成一张海报”、“把这个文档转成 PDF”）自动选择合适的命令和参数。

## 📄 License

MIT
