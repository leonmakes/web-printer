#!/usr/bin/env node

import { Command } from 'commander';
import { command as pdfCommand } from './pdf/command.ts';
import { command as shotCommand } from './shot/command.ts';

const program = new Command();

program
    .name('pagepress')
    .description('Convert web pages and Markdown to PDF and images')
    .version('0.1.0');

program.addCommand(pdfCommand);
program.addCommand(shotCommand);

program.parse();
