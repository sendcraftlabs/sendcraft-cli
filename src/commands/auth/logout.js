'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { load, save, CONFIG_FILE } = require('../../lib/config');

module.exports = new Command('logout')
  .description('Remove the stored API key from this machine')
  .action(() => {
    const cfg = load();
    if (!cfg.api_key) { console.log(chalk.yellow('  ⚠  Already logged out.')); return; }
    delete cfg.api_key;
    save(cfg);
    console.log(chalk.green('  ✓ ') + chalk.bold('Logged out.') + chalk.dim('  Key removed from ' + CONFIG_FILE));
  });
