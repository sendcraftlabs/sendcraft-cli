#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const pkg   = require('../package.json');
const { banner } = require('./lib/logo');

// ─── Global help header ──────────────────────────────────────────────────────
program
  .name('sendcraft')
  .description('The official CLI for SendCraft')
  .version(pkg.version, '-v, --version')
  .addHelpText('beforeAll', () => {
    const line = chalk.hex('#6366f1')('─'.repeat(Math.min((process.stdout.columns || 80) - 2, 68)));
    return (
      '\n  ' + line + '\n' +
      '  ' + chalk.hex('#8b5cf6').bold('✦  SendCraft') +
      '  ' + chalk.dim(`v${pkg.version}`) +
      '  ' + chalk.dim('https://sendcraft.online') +
      '\n  ' + line
    );
  });

// ─── Auth ────────────────────────────────────────────────────────────────────
program.addCommand(require('./commands/auth'));

// ─── Core resources ──────────────────────────────────────────────────────────
program.addCommand(require('./commands/emails'));
program.addCommand(require('./commands/campaigns'));
program.addCommand(require('./commands/subscribers'));
program.addCommand(require('./commands/templates'));
program.addCommand(require('./commands/domains'));
program.addCommand(require('./commands/webhooks'));
program.addCommand(require('./commands/topics'));
program.addCommand(require('./commands/keys'));
program.addCommand(require('./commands/analytics'));
program.addCommand(require('./commands/logs'));

// ─── Utilities ───────────────────────────────────────────────────────────────
program.addCommand(require('./commands/config'));
program.addCommand(require('./commands/warmup'));
program.addCommand(require('./commands/doctor'));
program.addCommand(require('./commands/mcp'));
program.addCommand(require('./commands/open'));
program.addCommand(require('./commands/completion'));

// ─── Unknown command handler ─────────────────────────────────────────────────
program.on('command:*', (args) => {
  console.error(chalk.red(`\n  ✗  Unknown command: ${args[0]}\n`));
  console.error('  Run ' + chalk.hex('#8b5cf6').bold('sendcraft --help') + ' to see available commands.\n');
  process.exit(1);
});

// ─── Entry point ─────────────────────────────────────────────────────────────
if (process.argv.length < 3) {
  // No args → show branded banner + quick-start guide
  banner(pkg.version);
} else {
  program.parse(process.argv);
}
