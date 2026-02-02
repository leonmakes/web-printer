import { Command } from 'commander';
import { render, Options } from './renderer.ts';

export const command = new Command('print')
    .description('Print Markdown or HTML to PDF')
    .requiredOption('-i, --input <path>', 'Input file path or URL')
    .requiredOption('-o, --output <path>', 'Output PDF file path')
    .option('-t, --template <name>', 'PDF template (default, github, magazine)', 'default')
    .option('--safe', 'Disable external network requests and JavaScript execution')
    .action(async (options) => {
        try {
            const result = await render({
                input: options.input,
                output: options.output,
                template: options.template,
                safe: options.safe,
            });
            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
