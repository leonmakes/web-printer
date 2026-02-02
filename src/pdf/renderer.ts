import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { marked, Renderer } from 'marked';
import { markedHighlight } from 'marked-highlight';
import matter from 'gray-matter';
import hljs from 'highlight.js';
import { getTemplate } from './templates.ts';
import { getFontCSS } from './fonts.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

type WaitUntilState = 'load' | 'domcontentloaded' | 'networkidle';

const WAIT_UNTIL_STATES = new Set<WaitUntilState>(['load', 'domcontentloaded', 'networkidle']);

function normalizeWaitUntil(value?: string): WaitUntilState {
    if (!value) return 'networkidle';
    if (WAIT_UNTIL_STATES.has(value as WaitUntilState)) {
        return value as WaitUntilState;
    }
    throw new Error(`Invalid waitUntil: ${value}. Allowed: load, domcontentloaded, networkidle.`);
}

function normalizeTimeout(value?: number): number {
    if (value === undefined) return 30000;
    if (!Number.isFinite(value) || value < 0) {
        throw new Error('Invalid timeout. Use a non-negative number of milliseconds.');
    }
    return value;
}

// Find templates directory - try multiple possible locations
function findTemplatesDir(): string {
    const candidates = [
        // When running from project root (dev/installed)
        path.resolve(process.cwd(), 'src/pdf/templates'),
        // Relative to dist/main.js
        path.resolve(__dirname, '..', 'src', 'pdf', 'templates'),
        // Relative to source file location
        path.resolve(__dirname, 'templates'),
    ];

    for (const dir of candidates) {
        if (fs.existsSync(dir)) return dir;
    }

    throw new Error(`Templates directory not found. Searched: ${candidates.join(', ')}`);
}

export interface Options {
    input: string;
    output: string;
    template?: string;
    safe?: boolean;
    waitUntil?: string;
    timeout?: number;
}

export interface Result {
    pdfPath: string;
    meta: {
        template: string;
        pages?: number;
        generatedAt: string;
    };
}

export async function render(options: Options): Promise<Result> {
    const template = getTemplate(options.template ?? 'default');
    const safeMode = options.safe ?? false;
    const waitUntil = normalizeWaitUntil(options.waitUntil);
    const timeout = normalizeTimeout(options.timeout);
    const templatesDir = findTemplatesDir();
    const templatePath = path.join(templatesDir, template.file);

    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
    }

    const inputPath = path.resolve(options.input);
    let htmlContent: string;
    let hasMermaid = false;

    if (options.input.endsWith('.md')) {
        const raw = fs.readFileSync(inputPath, 'utf-8');
        const { data: frontmatter, content } = matter(raw);

        // Check if content contains mermaid code blocks
        hasMermaid = /```mermaid/i.test(content);

        // Custom renderer to handle mermaid code blocks
        const renderer = new Renderer();
        renderer.code = function ({ text, lang }) {
            if (lang === 'mermaid') {
                // Output as <pre class="mermaid"> for mermaid.js to process
                return `<pre class="mermaid">${text}</pre>`;
            }
            // Default code block with syntax highlighting
            const highlighted = lang && hljs.getLanguage(lang)
                ? hljs.highlight(text, { language: lang }).value
                : hljs.highlightAuto(text).value;
            const langClass = lang ? `hljs language-${lang}` : 'hljs';
            return `<pre><code class="${langClass}">${highlighted}</code></pre>`;
        };

        // Configure marked with custom renderer
        marked.use({ renderer });

        const bodyHtml = await marked.parse(content);
        const title = (frontmatter.title as string) || 'Document';

        // Choose highlight.js theme based on template (magazine uses dark code blocks)
        const isDarkTheme = template.name === 'magazine';

        const hljsLightStyles = `
<style>
/* highlight.js GitHub Light Theme */
.hljs { color: #24292e; }
.hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-type { color: #d73a49; font-weight: 600; }
.hljs-string, .hljs-attr, .hljs-symbol, .hljs-bullet, .hljs-addition { color: #032f62; }
.hljs-number { color: #005cc5; }
.hljs-title, .hljs-section, .hljs-function .hljs-title { color: #6f42c1; }
.hljs-built_in, .hljs-name { color: #005cc5; }
.hljs-class .hljs-title { color: #e36209; }
.hljs-meta { color: #6f42c1; }
.hljs-variable, .hljs-template-variable { color: #e36209; }
.hljs-params { color: #24292e; }
</style>
`;

        const hljsDarkStyles = `
<style>
/* highlight.js Dark Theme for Magazine */
.hljs { color: #e8e8e8; }
.hljs-comment, .hljs-quote { color: #6b7280; font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-type { color: #f0abfc; }
.hljs-string, .hljs-attr, .hljs-symbol, .hljs-bullet, .hljs-addition { color: #86efac; }
.hljs-number { color: #fcd34d; }
.hljs-title, .hljs-section, .hljs-function .hljs-title { color: #93c5fd; }
.hljs-built_in, .hljs-name { color: #93c5fd; }
.hljs-class .hljs-title { color: #67e8f9; }
.hljs-meta { color: #f0abfc; }
.hljs-variable, .hljs-template-variable { color: #fcd34d; }
.hljs-params { color: #e8e8e8; }
</style>
`;

        const hljsStyles = isDarkTheme ? hljsDarkStyles : hljsLightStyles;

        // Load template and replace placeholders
        let templateHtml = fs.readFileSync(templatePath, 'utf-8');
        htmlContent = templateHtml
            .replace(/\{\{title\}\}/g, title)
            .replace(/\{\{body\}\}/g, bodyHtml)
            .replace(/\{\{styles\}\}/g, hljsStyles);

    } else if (options.input.endsWith('.html')) {
        htmlContent = fs.readFileSync(inputPath, 'utf-8');
    } else if (options.input.startsWith('http')) {
        if (safeMode) {
            throw new Error('Safe mode does not allow remote URL inputs.');
        }
        htmlContent = '';
    } else {
        throw new Error(`Unsupported input format: ${options.input}`);
    }

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ javaScriptEnabled: !safeMode });
        if (safeMode) {
            await context.route('**/*', (route) => {
                const url = route.request().url();
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    return route.abort();
                }
                return route.continue();
            });
        }
        const page = await context.newPage();

        if (options.input.startsWith('http')) {
            await page.goto(options.input, { waitUntil, timeout });
        } else {
            await page.setContent(htmlContent, { waitUntil, timeout });
        }

        // Inject local fonts for magazine template
        const fontCSS = getFontCSS(template.name);
        if (fontCSS) {
            await page.addStyleTag({ content: fontCSS });
        }

        // Inject and run mermaid.js if needed
        if (hasMermaid && !safeMode) {
            const mermaidPath = require.resolve('mermaid/dist/mermaid.min.js');
            await page.addScriptTag({ path: mermaidPath });

            // Initialize mermaid with theme-specific colors
            const templateName = template.name;
            await page.evaluate((tpl: string) => {
                // Apple-style: elegant gray tones
                const defaultTheme = {
                    primaryColor: '#f5f5f7',
                    primaryTextColor: '#1d1d1f',
                    primaryBorderColor: '#d2d2d7',
                    lineColor: '#86868b',
                    secondaryColor: '#f5f5f7',
                    tertiaryColor: '#ffffff',
                    background: '#ffffff',
                    mainBkg: '#f5f5f7',
                    nodeBorder: '#d2d2d7',
                    nodeTextColor: '#1d1d1f',
                    clusterBkg: 'rgba(0, 0, 0, 0.02)',
                    clusterBorder: 'rgba(0, 0, 0, 0.1)',
                    titleColor: '#1d1d1f',
                };

                // GitHub-style: similar gray with subtle blue hints
                const githubTheme = {
                    primaryColor: '#f6f8fa',
                    primaryTextColor: '#1f2328',
                    primaryBorderColor: '#d0d7de',
                    lineColor: '#656d76',
                    secondaryColor: '#f6f8fa',
                    tertiaryColor: '#ffffff',
                    background: '#ffffff',
                    mainBkg: '#f6f8fa',
                    nodeBorder: '#d0d7de',
                    nodeTextColor: '#1f2328',
                    clusterBkg: 'rgba(208, 215, 222, 0.2)',
                    clusterBorder: '#d0d7de',
                    titleColor: '#1f2328',
                };

                // Magazine-style: dark with red accents
                const magazineTheme = {
                    primaryColor: '#2a2a2a',
                    primaryTextColor: '#ffffff',
                    primaryBorderColor: '#c41e3a',
                    lineColor: '#666666',
                    secondaryColor: '#1a1a1a',
                    tertiaryColor: '#0f0f0f',
                    background: '#0f0f0f',
                    mainBkg: '#2a2a2a',
                    nodeBorder: '#c41e3a',
                    nodeTextColor: '#ffffff',
                    clusterBkg: 'rgba(196, 30, 58, 0.1)',
                    clusterBorder: 'rgba(196, 30, 58, 0.4)',
                    titleColor: '#ffffff',
                };

                const themes: Record<string, typeof defaultTheme> = {
                    default: defaultTheme,
                    github: githubTheme,
                    magazine: magazineTheme,
                };

                const activeTheme = themes[tpl] || defaultTheme;

                // @ts-ignore
                window.mermaid.initialize({
                    startOnLoad: false,
                    theme: 'base',
                    themeVariables: {
                        ...activeTheme,
                        fontFamily: '"SF Mono", "Fira Code", Menlo, monospace',
                        fontSize: '13px',
                    },
                    flowchart: {
                        curve: 'basis',
                        nodeSpacing: 40,
                        rankSpacing: 50,
                        htmlLabels: true,
                        useMaxWidth: true,
                        subGraphTitleMargin: { top: 15, bottom: 15 },
                        padding: 20,
                    },
                });
            }, templateName);

            // Run mermaid and wait for it to complete
            await page.evaluate(() => {
                // @ts-ignore
                return window.mermaid.run();
            });

            // Wait for SVG to be rendered
            await page.waitForSelector('.mermaid svg', { timeout: 5000 });

            // Give mermaid extra time to finish rendering
            await page.waitForTimeout(300);

            // Post-process: Add rounded corners and padding to SVG elements
            await page.evaluate(() => {
                // Add rounded corners to nodes
                document.querySelectorAll('.node rect').forEach((rect) => {
                    rect.setAttribute('rx', '12');
                    rect.setAttribute('ry', '12');
                });

                // Add rounded corners and padding to clusters (subgraphs)
                document.querySelectorAll('.cluster rect').forEach((rect) => {
                    rect.setAttribute('rx', '16');
                    rect.setAttribute('ry', '16');
                });

                // Add padding to cluster labels by adjusting their position
                document.querySelectorAll('.cluster-label').forEach((label) => {
                    const transform = label.getAttribute('transform');
                    if (transform) {
                        // Move label down a bit for more breathing room
                        const match = transform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
                        if (match) {
                            const x = parseFloat(match[1]);
                            const y = parseFloat(match[2]) + 8; // Add 8px padding
                            label.setAttribute('transform', `translate(${x}, ${y})`);
                        }
                    }
                });
            });
        }

        await page.waitForTimeout(200);

        const outputPath = path.resolve(options.output);
        await page.pdf({
            path: outputPath,
            format: 'A4',
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            printBackground: true,
        });

        return {
            pdfPath: outputPath,
            meta: {
                template: template.name,
                generatedAt: new Date().toISOString(),
            },
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
