/**
 * Local font CSS injection module
 * Uses Fontsource npm packages instead of Google Fonts CDN
 */

import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';

const require = createRequire(import.meta.url);

// Fonts used by the magazine template
const MAGAZINE_FONTS = [
    '@fontsource/bebas-neue/400.css',
    '@fontsource/cormorant-garamond/400.css',
    '@fontsource/cormorant-garamond/400-italic.css',
    '@fontsource/cormorant-garamond/600.css',
    '@fontsource/inter/300.css',
    '@fontsource/inter/400.css',
    '@fontsource/inter/500.css',
];

/**
 * Get font CSS for the specified template (with inline woff2 base64)
 */
export function getFontCSS(template: string): string {
    if (template !== 'magazine') {
        return ''; // Other templates use system fonts
    }

    const cssChunks: string[] = [];

    for (const fontPath of MAGAZINE_FONTS) {
        try {
            const cssFilePath = require.resolve(fontPath);
            let css = fs.readFileSync(cssFilePath, 'utf-8');

            // Convert relative woff2 paths to inline base64
            const cssDir = path.dirname(cssFilePath);
            css = css.replace(/url\(\.\/files\/([^)]+)\)/g, (match, filename) => {
                const fontFilePath = path.join(cssDir, 'files', filename);
                if (fs.existsSync(fontFilePath)) {
                    const fontData = fs.readFileSync(fontFilePath);
                    const base64 = fontData.toString('base64');
                    const ext = path.extname(filename).slice(1);
                    const mimeType = ext === 'woff2' ? 'font/woff2' : `font/${ext}`;
                    return `url(data:${mimeType};base64,${base64})`;
                }
                return match;
            });

            cssChunks.push(css);
        } catch (e) {
            console.warn(`Warning: Could not load font ${fontPath}:`, e);
        }
    }

    return cssChunks.join('\n');
}
