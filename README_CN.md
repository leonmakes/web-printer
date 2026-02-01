# Web Printer

一套专为 **AI Agent** 设计的 Web 内容渲染工具集，可将 HTML、Markdown、URL 转换为高质量的 **PDF** 或 **PNG** 图像。

## ✨ 特性

- **双技能架构**：独立的 `web-to-pdf` 和 `web-to-png` 转换器
- **多种输入**：支持本地 HTML、Markdown 文件或远程 URL
- **丰富主题**：PDF 支持 5 种精美 Markdown 主题（Apple 风格、GitHub、学术论文、手绘、杂志）
- **灵活输出**：OG 卡片、海报、长图、A4 文档等多种尺寸预设
- **一致性保障**：确定性渲染、字体等待、网络空闲检测
- **智能存放**：首次使用时询问输出目录，默认存放在 `{workspace}/assets/`

## 📦 安装

### 🤖 AI Agent 安装

将以下 GitHub 地址提供给你的 AI Agent，它会自动下载并安装：

| Skill | GitHub 地址 |
|-------|------------|
| **web-to-pdf** | `https://github.com/leonmakes/web-printer/tree/main/skills/web-to-pdf` |
| **web-to-png** | `https://github.com/leonmakes/web-printer/tree/main/skills/web-to-png` |

### 🔧 手动安装

```bash
# 1. 克隆仓库
git clone https://github.com/leonmakes/web-printer.git

# 2. 拷贝 skill 到你的 AI Agent 的 skills 目录
#    以 Claude Code 为例：
cp -r web-printer/skills/web-to-pdf ~/.claude/skills/
cp -r web-printer/skills/web-to-png ~/.claude/skills/

# 3. 进入 skill 目录安装依赖
cd ~/.claude/skills/web-to-png
pnpm install

# 4. 安装浏览器（Playwright）
pnpm exec playwright install chromium
```

> **其他 AI Agent 的 skills 目录参考**：
> - Claude Code: `~/.claude/skills/`
> - Gemini CLI / Antigravity: `~/.gemini/antigravity/skills/`
> - 其他 Agent：请参考对应文档

每个 skill 目录包含独立的 `SKILL.md` 说明文档，详见各 skill 的使用指南。

## 🛠️ 技能一览

### [web-to-pdf](skills/web-to-pdf/SKILL.md)

将 HTML/Markdown/URL 转换为 PDF 文档。

```bash
# Markdown（自动美化）
node skills/web-to-pdf/scripts/converter.js \
  --input doc.md --style magazine --output out.pdf

# HTML（原样打印）
node skills/web-to-pdf/scripts/converter.js \
  --input page.html --format html --output out.pdf
```

**支持的主题**：`default`（Apple）| `github` | `academic` | `magazine`

---

### [web-to-png](skills/web-to-png/SKILL.md)

将 HTML/URL 渲染为 PNG 图像，适合社交分享卡片、海报、长图截屏。

```bash
# OG 卡片（1200×630）
node skills/web-to-png/scripts/converter.js \
  --input card.html --preset og --output og.png

# Screenshot（默认）
node skills/web-to-png/scripts/converter.js \
  --url https://example.com --output page.png

# Infographic（宽 1080，高度自适应）
node skills/web-to-png/scripts/converter.js \
  --url https://example.com --preset infographic --output long.png
```

**支持的预设**：`og` | `post` | `infographic` | `poster` | `banner`

可选：使用 `--meta` 才会输出对应的 `meta.json`。

## 📁 目录结构

```
web-printer/
├── skills/
│   ├── web-to-pdf/        # PDF 转换技能
│   │   ├── SKILL.md       # 技能文档
│   │   ├── scripts/       # 转换脚本
│   │   ├── templates/     # Markdown 主题模板
│   │   └── examples/      # 示例文件
│   │
│   └── web-to-png/        # PNG 转换技能
│       ├── SKILL.md       # 技能文档
│       ├── scripts/       # 转换脚本
│       └── examples/      # 示例文件
│
├── package.json
└── README.md
```

## 📄 License

MIT
