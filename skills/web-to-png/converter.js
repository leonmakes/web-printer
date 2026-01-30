#!/usr/bin/env node
/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";
import anchor from "markdown-it-anchor";
import toc from "markdown-it-toc-done-right";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.dirname(__filename);
const TEMPLATES = path.join(ROOT, "templates");

const PRESETS = {
  og: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  portrait: { width: 1200, height: 1500 },
  banner: { width: 1600, height: 900 },
};

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`找不到文件: ${filePath}`);
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

function textToMarkdown(text) {
  return String(text)
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function markdownToHtml(md) {
  const mdIt = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str) => {
      const escaped = mdIt.utils.escapeHtml(str);
      return `<pre><code>${escaped}</code></pre>`;
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

  return html;
}

function resolveViewport({ preset, width, height, clip }) {
  if (width && height) return { width, height };
  if (clip && clip.width && clip.height) {
    return { width: Math.ceil(clip.width), height: Math.ceil(clip.height) };
  }
  const p = PRESETS[preset] || PRESETS.og;
  return { width: p.width, height: p.height };
}

function parseClip(value) {
  if (!value) return null;
  const parts = value.split(",").map((v) => Number(v.trim()));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new Error("--clip 格式应为 x,y,width,height");
  }
  const [x, y, width, height] = parts;
  return { x, y, width, height };
}

async function renderPngWithPlaywright(
  htmlOrUrl,
  pngPath,
  viewport,
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
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: options.deviceScaleFactor ?? 2,
  });

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

  let mode = "card";
  if (options.clip) {
    await page.screenshot({ path: pngPath, type: "png", clip: options.clip });
    mode = "clip";
  } else if (options.fullPage) {
    await page.screenshot({ path: pngPath, type: "png", fullPage: true });
    mode = "fullPage";
  } else {
    const card = await page.$(".card");
    if (card) {
      await card.screenshot({ path: pngPath, type: "png" });
      mode = "card";
    } else {
      const container = await page.$(".container");
      if (container) {
        await container.screenshot({ path: pngPath, type: "png" });
        mode = "container";
      } else {
        await page.screenshot({ path: pngPath, type: "png", fullPage: true });
        mode = "fullPage";
      }
    }
  }

  const version = browser.version();
  await browser.close();
  return { version, mode };
}

export async function toPng({
  inputPath,
  content,
  url,
  outputPath,
  style = "card-clean",
  customCssPath,
  keepHtml = true,
  allowScripts = false,
  networkWhitelist,
  options = {},
}) {
  if (!inputPath && !content && !url) {
    throw new Error("必须提供 input_path/content/url 之一");
  }

  const waitUntil = options.wait_until || "networkidle";
  const timeoutMs = Number(options.timeout_ms || 30000);
  const clip = options.clip || null;

  let rawContent = "";
  if (inputPath) rawContent = readText(inputPath);
  if (content) rawContent = content;

  const customCss = customCssPath ? readText(customCssPath) : null;

  let html = "";
  if (url) {
    html = url;
  } else {
    let normalized = rawContent;
    if (options.format === "text") {
      normalized = textToMarkdown(rawContent);
    }

    if (options.format === "html") {
      html = normalized;
    } else {
      html = markdownToHtml(normalized);
    }
    html = sanitizeHtml(html, allowScripts);
    html = renderTemplate(options.title || "Web-to-PNG", html, style, customCss);
  }

  const outputPng = path.resolve(outputPath || "output.png");
  const outputHtml = outputPng.replace(/\.png$/i, "") + ".html";

  if (keepHtml && !url) {
    fs.writeFileSync(outputHtml, html, "utf-8");
  }

  const viewport = resolveViewport({
    preset: options.preset || "og",
    width: options.width,
    height: options.height,
    clip,
  });

  let chromiumVersion = null;
  let screenshotMode = null;

  if (url) {
    const result = await renderPngWithPlaywright(
      url,
      outputPng,
      viewport,
      {
        clip,
        fullPage: options.full_page,
        deviceScaleFactor: options.device_scale_factor ?? 2,
      },
      waitUntil,
      timeoutMs,
      allowScripts,
      networkWhitelist
    );
    chromiumVersion = result?.version || null;
    screenshotMode = result?.mode || null;
  } else {
    fs.writeFileSync(outputHtml, html, "utf-8");
    const fileUrl = `file://${outputHtml}`;
    const result = await renderPngWithPlaywright(
      fileUrl,
      outputPng,
      viewport,
      {
        clip,
        fullPage: options.full_page,
        deviceScaleFactor: options.device_scale_factor ?? 2,
      },
      waitUntil,
      timeoutMs,
      allowScripts,
      networkWhitelist
    );
    chromiumVersion = result?.version || null;
    screenshotMode = result?.mode || null;
  }

  if (!chromiumVersion) {
    throw new Error("无法渲染 PNG。请安装 Playwright（推荐）");
  }

  if (!keepHtml && fs.existsSync(outputHtml)) {
    fs.unlinkSync(outputHtml);
  }

  const meta = {
    engine: `chromium:${chromiumVersion}`,
    generatedAt: new Date().toISOString(),
    preset: options.preset || "og",
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: options.device_scale_factor ?? 2,
    style,
    screenshotMode,
    inputHash: sha256(rawContent || url || ""),
  };
  const metaPath = outputPng.replace(/\.png$/i, "") + ".meta.json";
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");

  return {
    pngPath: outputPng,
    htmlPath: keepHtml ? outputHtml : null,
    meta,
    metaPath,
  };
}

function parseArgs(argv) {
  const args = {
    input: null,
    content: null,
    url: null,
    output: null,
    style: "card-clean",
    format: "markdown",
    preset: "og",
    width: null,
    height: null,
    deviceScaleFactor: 2,
    fullPage: false,
    clip: null,
    noHtml: false,
    allowScripts: false,
    customCss: null,
    title: null,
    allowNet: [],
    waitUntil: "networkidle",
    timeoutMs: 30000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--input") args.input = argv[++i];
    else if (a === "--content") args.content = argv[++i];
    else if (a === "--url") args.url = argv[++i];
    else if (a === "--output") args.output = argv[++i];
    else if (a === "--style") args.style = argv[++i];
    else if (a === "--format") args.format = argv[++i];
    else if (a === "--preset") args.preset = argv[++i];
    else if (a === "--width") args.width = Number(argv[++i]);
    else if (a === "--height") args.height = Number(argv[++i]);
    else if (a === "--device-scale-factor") args.deviceScaleFactor = Number(argv[++i]);
    else if (a === "--full-page") args.fullPage = true;
    else if (a === "--clip") args.clip = parseClip(argv[++i]);
    else if (a === "--no-html") args.noHtml = true;
    else if (a === "--allow-scripts") args.allowScripts = true;
    else if (a === "--css") args.customCss = argv[++i];
    else if (a === "--title") args.title = argv[++i];
    else if (a === "--allow-net") args.allowNet.push(argv[++i]);
    else if (a === "--wait-until") args.waitUntil = argv[++i];
    else if (a === "--timeout-ms") args.timeoutMs = Number(argv[++i]);
    else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!args.output) {
    throw new Error("必须提供 --output");
  }

  if (args.width && !args.height) {
    throw new Error("提供 --width 时必须同时提供 --height");
  }

  if (!args.width && args.height) {
    throw new Error("提供 --height 时必须同时提供 --width");
  }

  return args;
}

function printHelp() {
  console.log(`web-to-png converter

Usage:
  node converter.js --input <file> --output <file.png> [options]
  node converter.js --url <url> --output <file.png> [options]
  node converter.js --content <text> --output <file.png> [options]

Options:
  --style <default|github|academic|sketch|magazine|card-clean|card-bold|card-poster>
  --format <markdown|html|text>
  --preset <og|square|story|portrait|banner>
  --width <number> --height <number>
  --device-scale-factor <number>
  --full-page
  --clip <x,y,width,height>
  --no-html
  --allow-scripts
  --css <path>
  --title <title>
  --allow-net <prefix> (can be repeated)
  --wait-until <load|domcontentloaded|networkidle>
  --timeout-ms <number>
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await toPng({
    inputPath: args.input,
    content: args.content,
    url: args.url,
    outputPath: args.output,
    style: args.style,
    customCssPath: args.customCss,
    keepHtml: !args.noHtml,
    allowScripts: args.allowScripts,
    networkWhitelist: args.allowNet,
    options: {
      format: args.format,
      preset: args.preset,
      width: args.width,
      height: args.height,
      device_scale_factor: args.deviceScaleFactor,
      full_page: args.fullPage,
      clip: args.clip,
      title: args.title,
      wait_until: args.waitUntil,
      timeout_ms: args.timeoutMs,
    },
  });
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  });
}
