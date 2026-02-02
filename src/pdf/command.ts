import { Command } from 'commander';
import { render, Options } from './renderer.ts';

export const command = new Command('pdf')
    .description('Render Markdown or HTML to PDF')
    .requiredOption('-i, --input <path>', 'Input file path or URL')
    .requiredOption('-o, --output <path>', 'Output PDF file path')
    .option('-t, --template <name>', 'PDF template (default, github, magazine)', 'default')
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
                template: options.template,
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
