import { Command } from 'commander';
import { render, Options } from './renderer.ts';

export const command = new Command('snap')
    .description('Snap HTML to PNG image')
    .requiredOption('-i, --input <path>', 'Input HTML file path or URL')
    .requiredOption('-o, --output <path>', 'Output PNG file path')
    .option('--preset <name>', 'Image preset (og, infographic, poster, banner)', 'og')
    .option('--width <number>', 'Custom width in pixels')
    .option('--height <number>', 'Custom height in pixels')
    .option('--scale <number>', 'Device scale factor', '2')
    .option('--safe', 'Disable external network requests and JavaScript execution')
    .action(async (options) => {
        try {
            const result = await render({
                input: options.input,
                output: options.output,
                preset: options.preset,
                width: options.width ? parseInt(options.width) : undefined,
                height: options.height ? parseInt(options.height) : undefined,
                scale: parseFloat(options.scale),
                safe: options.safe,
            });
            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
