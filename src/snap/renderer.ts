import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { getPreset } from './presets.ts';

export interface Options {
    input: string;
    output: string;
    preset?: string;
    width?: number;
    height?: number;
    scale?: number;
}

export interface Result {
    pngPath: string;
    meta: {
        preset: string;
        width: number;
        height: number;
        deviceScaleFactor: number;
        generatedAt: string;
    };
}

export async function render(options: Options): Promise<Result> {
    const preset = options.preset ? getPreset(options.preset) : getPreset('og');
    const width = options.width ?? preset.width;
    const height = options.height ?? preset.height;
    const scale = options.scale ?? 2;

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width, height },
            deviceScaleFactor: scale,
        });
        const page = await context.newPage();

        const inputPath = path.resolve(options.input);
        if (options.input.startsWith('http://') || options.input.startsWith('https://')) {
            await page.goto(options.input, { waitUntil: 'networkidle' });
        } else if (fs.existsSync(inputPath)) {
            const content = fs.readFileSync(inputPath, 'utf-8');
            await page.setContent(content, { waitUntil: 'networkidle' });
        } else {
            throw new Error(`Input not found: ${options.input}`);
        }

        // Force body to match preset dimensions (restoring old behavior)
        await page.addStyleTag({
            content: `
                html, body {
                    width: ${width}px;
                    height: ${height}px;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                }
            `
        });

        await page.waitForTimeout(500);

        const outputPath = path.resolve(options.output);
        await page.screenshot({
            path: outputPath,
            type: 'png',
            clip: { x: 0, y: 0, width, height },
        });

        return {
            pngPath: outputPath,
            meta: {
                preset: preset.name,
                width,
                height,
                deviceScaleFactor: scale,
                generatedAt: new Date().toISOString(),
            },
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
