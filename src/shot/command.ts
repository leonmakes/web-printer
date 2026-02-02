import { Command } from 'commander';
import { render, Options } from './renderer.ts';

export const command = new Command('shot')
    .description('Capture HTML to PNG image')
    .requiredOption('-i, --input <path>', 'Input HTML file path or URL')
    .requiredOption('-o, --output <path>', 'Output PNG file path')
    .option('-p, --preset <name>', 'Image preset (og, infographic, poster, banner)', 'og')
    .option('--width <number>', 'Custom width in pixels')
    .option('--height <number>', 'Custom height in pixels')
    .option('--scale <number>', 'Device scale factor', '2')
    .option('--wait-until <state>', 'Navigation waitUntil (load, domcontentloaded, networkidle)', 'networkidle')
    .option('--timeout <ms>', 'Navigation timeout in milliseconds', '30000')
    .option('--safe', 'Disable external network requests and JavaScript execution')
    .action(async (options) => {
        try {
            const timeout = Number.parseInt(options.timeout, 10);
            if (!Number.isFinite(timeout) || timeout < 0) {
                throw new Error('Invalid --timeout value. Use a non-negative integer in milliseconds.');
            }

            const result = await render({
                input: options.input,
                output: options.output,
                preset: options.preset,
                width: options.width ? parseInt(options.width) : undefined,
                height: options.height ? parseInt(options.height) : undefined,
                scale: parseFloat(options.scale),
                waitUntil: options.waitUntil,
                timeout,
                safe: options.safe,
            });
            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
