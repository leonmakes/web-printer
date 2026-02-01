#!/usr/bin/env node
/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";
import anchor from "markdown-it-anchor";
import toc from "markdown-it-toc-done-right";
import hljs from "highlight.js";

const __filename = fileURLToPath(import.meta.url);
const SCRIPTS = path.dirname(__filename);
const ROOT = path.dirname(SCRIPTS);
const TEMPLATES = path.join(ROOT, "templates");

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf-8");
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf-8").digest("hex");
}

function sanitizeHtml(html, allowScripts = false) {
  if (allowScripts) return html;
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

function findInPath(cmd) {
  const pathEntries = (process.env.PATH || "").split(path.delimiter);
  for (const entry of pathEntries) {
    const fullPath = path.join(entry, cmd);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

function findMermaidCli(override) {
  if (override && fs.existsSync(override)) return override;
  const env = process.env.MERMAID_CLI;
  if (env && fs.existsSync(env)) return env;
  return (
    findInPath("mmdc") ||
    findInPath("mmdc.cmd")
  );
}

function mermaidThemeFromStyle(style) {
  if (["github", "academic", "magazine", "default"].includes(style)) return "neutral";
  return "neutral";
}

function cleanMermaidSvg(svg) {
  return svg
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .trim();
}

function renderMermaidCli(code, theme, mermaidCli) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "web2pdf-mermaid-"));
  const inPath = path.join(tmpDir, "diagram.mmd");
  const outPath = path.join(tmpDir, "diagram.svg");
  fs.writeFileSync(inPath, code, "utf-8");
  const args = ["-i", inPath, "-o", outPath, "-t", theme, "-b", "transparent"];
  let svg = "";
  try {
    execFileSync(mermaidCli, args, { stdio: "ignore" });
    svg = fs.readFileSync(outPath, "utf-8");
  } catch (err) {
    throw new Error("Mermaid CLI rendering failed. Please check if mmdc is available.");
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) { }
  }
  return cleanMermaidSvg(svg);
}

function renderMermaidBlocks(md, style, mermaidEnabled, mermaidCli) {
  if (!mermaidEnabled) return md;
  const pattern = /```mermaid\s*\n([\s\S]*?)```/g;
  if (!pattern.test(md)) return md;

  const cli = findMermaidCli(mermaidCli);
  if (!cli) {
    throw new Error(
      "Mermaid code blocks detected, but Mermaid CLI (mmdc) not found. " +
      "Please install: npm i -g @mermaid-js/mermaid-cli, " +
      "or set MERMAID_CLI environment variable to the executable path."
    );
  }

  const theme = mermaidThemeFromStyle(style);
  const cache = new Map();
  return md.replace(pattern, (_, codeRaw) => {
    const code = String(codeRaw || "").trim();
    if (!code) return "";
    const cacheKey = `${theme}:${sha256(code)}`;
    let svg = cache.get(cacheKey);
    if (!svg) {
      svg = renderMermaidCli(code, theme, cli);
      cache.set(cacheKey, svg);
    }
    return `\n<div class="mermaid-svg">\n${svg}\n</div>\n`;
  });
}

function markdownToHtml(md, style, mermaidEnabled, mermaidCli) {
  md = renderMermaidBlocks(md, style, mermaidEnabled, mermaidCli);

  const mdIt = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre><code class="hljs language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        } catch (_) { }
      }
      const escaped = mdIt.utils.escapeHtml(str);
      return `<pre><code class="hljs">${escaped}</code></pre>`;
    },
  });

  mdIt.use(footnote);
  mdIt.use(anchor, {
    slugify: (s) =>
      encodeURIComponent(
        String(s)
          .trim()
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5\- ]+/g, "")
          .replace(/\s+/g, "-")
      ),
  });
  mdIt.use(toc, {
    level: [1, 2, 3, 4],
    listType: "ul",
    markerPattern: /^\[TOC\]$/i,
  });

  return mdIt.render(md);
}

function renderTemplate(title, bodyHtml, style, customCss) {
  const templatePath = path.join(TEMPLATES, `${style}.html`);
  let html = readText(templatePath)
    .replace(/{{title}}/g, title)
    .replace(/{{body}}/g, bodyHtml);

  const customStyleBlock = customCss ? `<style>${customCss}</style>` : "";
  if (html.includes("{{styles}}")) {
    html = html.replace("{{styles}}", customStyleBlock);
  } else if (customCss) {
    html = html.replace("</head>", `${customStyleBlock}</head>`);
  }

  // Inject highlight.js styles (choose light or dark based on theme)
  const isDarkTheme = ["magazine"].includes(style);

  const hljsLightStyle = `
<style>
/* highlight.js Light Theme */
.hljs {
  color: #24292e;
}
.hljs-comment, .hljs-quote {
  color: #6a737d;
  font-style: italic;
}
.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-type {
  color: #d73a49;
  font-weight: 600;
}
.hljs-string, .hljs-attr, .hljs-symbol, .hljs-bullet, .hljs-addition {
  color: #032f62;
}
.hljs-number {
  color: #005cc5;
}
.hljs-title, .hljs-section, .hljs-function .hljs-title {
  color: #6f42c1;
}
.hljs-built_in, .hljs-name {
  color: #005cc5;
}
.hljs-class .hljs-title {
  color: #e36209;
}
.hljs-meta {
  color: #6f42c1;
}
</style>
`;

  const hljsDarkStyle = `
<style>
/* highlight.js Dark Theme */
.hljs {
  color: #e6e6e6;
}
.hljs-comment, .hljs-quote {
  color: #999;
  font-style: italic;
}
.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-type {
  color: #ff7b72;
  font-weight: 600;
}
.hljs-string, .hljs-attr, .hljs-symbol, .hljs-bullet, .hljs-addition {
  color: #a5d6ff;
}
.hljs-number {
  color: #79c0ff;
}
.hljs-title, .hljs-section, .hljs-function .hljs-title {
  color: #d2a8ff;
}
.hljs-built_in, .hljs-name {
  color: #79c0ff;
}
.hljs-class .hljs-title {
  color: #ffa657;
}
.hljs-meta {
  color: #d2a8ff;
}
</style>
`;

  const hljsStyle = isDarkTheme ? hljsDarkStyle : hljsLightStyle;
  if (html.includes("</head>")) {
    html = html.replace("</head>", `${hljsStyle}</head>`);
  }

  if (html.includes("mermaid-svg")) {
    const mermaidStyle = `
<style>
.mermaid-svg { margin: 1.5em 0; overflow-x: auto; }
.mermaid-svg svg { max-width: 100%; height: auto; display: block; }
</style>
`;
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${mermaidStyle}</head>`);
    } else {
      html = mermaidStyle + html;
    }
  }

  return html;
}

function getPdfPageCount(pdfPath) {
  const pdfinfo = findInPath("pdfinfo");
  if (!pdfinfo) return null;
  try {
    const out = execFileSync(pdfinfo, [pdfPath], { encoding: "utf-8" });
    const line = out.split("\n").find((l) => l.toLowerCase().startsWith("pages:"));
    if (line) return parseInt(line.split(":", 2)[1].trim(), 10);
  } catch (_) {
    return null;
  }
  return null;
}

async function renderPdfWithPlaywright(
  htmlOrUrl,
  pdfPath,
  options,
  waitUntil,
  timeoutMs,
  allowScripts,
  networkWhitelist
) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    return null;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  if (Array.isArray(networkWhitelist) && networkWhitelist.length > 0) {
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (networkWhitelist.some((prefix) => url.startsWith(prefix))) {
        route.continue();
      } else {
        route.abort();
      }
    });
  }

  if (/^https?:\/\//i.test(htmlOrUrl) || /^file:\/\//i.test(htmlOrUrl)) {
    await page.goto(htmlOrUrl, { waitUntil, timeout: timeoutMs });
  } else {
    await page.setContent(htmlOrUrl, { waitUntil, timeout: timeoutMs });
  }

  if (!allowScripts) {
    await page.addScriptTag({
      content: "document.querySelectorAll('script').forEach(s=>s.remove())",
    });
  }

  await page.evaluate("document.fonts && document.fonts.ready");

  await page.pdf({
    path: pdfPath,
    format: options.pdf_format,
    printBackground: options.print_background ?? true,
    preferCSSPageSize: options.prefer_css_page_size ?? true,
    scale: options.scale ?? 1.0,
    margin: options.margins,
    pageRanges: options.page_ranges,
  });

  const version = browser.version();
  await browser.close();
  return version;
}

export async function toPdf({
  inputPath,
  content,
  url,
  outputPath,
  style = "github",
  customCssPath,
  keepHtml = true,
  writeMeta = false,
  allowScripts = false,
  mermaidEnabled = true,
  mermaidCli,
  networkWhitelist,
  options = {},
}) {
  if (!inputPath && !content && !url) {
    throw new Error("Must provide one of input_path/content/url");
  }

  const waitUntil = options.wait_until || "networkidle";
  const timeoutMs = Number(options.timeout_ms || 30000);

  let rawContent = "";
  if (inputPath) rawContent = readText(inputPath);
  if (content) rawContent = content;

  const customCss = customCssPath ? readText(customCssPath) : null;

  let html = "";
  if (url) {
    html = url;
  } else {
    if (options.format === "html") {
      html = rawContent;
    } else {
      html = markdownToHtml(rawContent, style, mermaidEnabled, mermaidCli);
    }
    html = sanitizeHtml(html, allowScripts);
    html = renderTemplate(options.title || "Web2PDF", html, style, customCss);
  }

  const outputPdf = path.resolve(outputPath || "output.pdf");
  const outputHtml = outputPdf.replace(/\.pdf$/i, "") + ".html";

  if (keepHtml && !url) {
    fs.writeFileSync(outputHtml, html, "utf-8");
  }

  let chromiumVersion = null;
  if (url) {
    chromiumVersion = await renderPdfWithPlaywright(
      url,
      outputPdf,
      options,
      waitUntil,
      timeoutMs,
      allowScripts,
      networkWhitelist
    );
  } else {
    fs.writeFileSync(outputHtml, html, "utf-8");
    const fileUrl = `file://${outputHtml}`;
    chromiumVersion = await renderPdfWithPlaywright(
      fileUrl,
      outputPdf,
      options,
      waitUntil,
      timeoutMs,
      allowScripts,
      networkWhitelist
    );
  }

  if (!chromiumVersion) {
    throw new Error("Cannot render PDF. Please install Playwright (recommended)");
  }

  if (!keepHtml && fs.existsSync(outputHtml)) {
    fs.unlinkSync(outputHtml);
  }

  const meta = {
    engine: `chromium:${chromiumVersion}`,
    generatedAt: new Date().toISOString(),
    pageCount: getPdfPageCount(outputPdf),
    inputHash: sha256(rawContent || url || ""),
  };

  let metaPath = null;
  if (writeMeta) {
    metaPath = outputPdf.replace(/\.pdf$/i, "") + ".meta.json";
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
  }

  return {
    pdfPath: outputPdf,
    htmlPath: keepHtml ? outputHtml : null,
    meta,
    metaPath,
  };
}

function parseArgs(argv) {
  const args = {
    input: null,
    url: null,
    output: null,
    style: "default",
    format: "markdown",
    noHtml: false,
    writeMeta: false,
    allowScripts: false,
    noMermaid: false,
    mermaidCli: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--input") args.input = argv[++i];
    else if (a === "--url") args.url = argv[++i];
    else if (a === "--output") args.output = argv[++i];
    else if (a === "--style") args.style = argv[++i];
    else if (a === "--format") args.format = argv[++i];
    else if (a === "--no-html") args.noHtml = true;
    else if (a === "--meta") args.writeMeta = true;
    else if (a === "--allow-scripts") args.allowScripts = true;
    else if (a === "--no-mermaid") args.noMermaid = true;
    else if (a === "--mermaid-cli") args.mermaidCli = argv[++i];
    else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!args.output) {
    throw new Error("--output is required");
  }

  return args;
}

function printHelp() {
  console.log(`web2pdf converter

Usage:
  node converter.js --input <file> --output <file.pdf> [options]
  node converter.js --url <url> --output <file.pdf> [options]

Options:
  --style <default|github|academic|magazine>
  --format <markdown|html>
  --no-html
  --meta
  --allow-scripts
  --no-mermaid
  --mermaid-cli <path>
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await toPdf({
    inputPath: args.input,
    url: args.url,
    outputPath: args.output,
    style: args.style,
    keepHtml: !args.noHtml,
    writeMeta: args.writeMeta,
    allowScripts: args.allowScripts,
    mermaidEnabled: !args.noMermaid,
    mermaidCli: args.mermaidCli,
    options: { format: args.format },
  });
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  });
}
