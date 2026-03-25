#!/usr/bin/env node

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');

program
  .name('sendcraft')
  .description('Official SendCraft CLI — send emails, manage campaigns, and more')
  .version(pkg.version, '-v, --version')
  .addHelpText('beforeAll', chalk.hex('#8b5cf6').bold('\n  SendCraft CLI') + chalk.dim(`  v${pkg.version}\n`));

program.addCommand(require('../lib/commands/login'));

// logout
const { Command } = require('commander');
const logoutCmd = new Command('logout')
  .description('Remove the stored API key from this machine')
  .action(() => {
    const { load, save, CONFIG_FILE } = require('../lib/config');
    const cfg = load();
    if (!cfg.api_key) {
      console.log(chalk.yellow('  ⚠  No API key stored — already logged out.'));
      return;
    }
    delete cfg.api_key;
    save(cfg);
    console.log(chalk.green('  ✓ ') + chalk.bold('Logged out.') + chalk.dim('  Key removed from ' + CONFIG_FILE));
  });
program.addCommand(logoutCmd);

program.addCommand(require('../lib/commands/config'));
program.addCommand(require('../lib/commands/send'));
program.addCommand(require('../lib/commands/emails'));
program.addCommand(require('../lib/commands/campaigns'));
program.addCommand(require('../lib/commands/subscribers'));
program.addCommand(require('../lib/commands/templates'));
program.addCommand(require('../lib/commands/domains'));
program.addCommand(require('../lib/commands/webhooks'));
program.addCommand(require('../lib/commands/topics'));
program.addCommand(require('../lib/commands/keys'));
program.addCommand(require('../lib/commands/warmup'));
program.addCommand(require('../lib/commands/mcp'));
program.addCommand(require('../lib/commands/analytics'));
program.addCommand(require('../lib/commands/logs'));
program.addCommand(require('../lib/commands/doctor'));
program.addCommand(require('../lib/commands/open'));
program.addCommand(require('../lib/commands/completion'));

program.on('command:*', (args) => {
  console.error(chalk.red(`  ✗  Unknown command: ${args[0]}`));
  console.error('  Run ' + chalk.bold('sendcraft --help') + ' to see available commands.');
  process.exit(1);
});

// No args → show help (like Resend CLI)
if (process.argv.length < 3) {
  program.outputHelp();
} else {
  program.parse(process.argv);
}
