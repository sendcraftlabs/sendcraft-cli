'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { load, save, CONFIG_FILE } = require('../../lib/config');
const { success } = require('../../lib/output');

module.exports = new Command('set-key')
  .description('Save an API key')
  .argument('<apiKey>', 'Your SendCraft API key')
  .action((apiKey) => {
    const cfg = load(); cfg.api_key = apiKey; save(cfg);
    success(`API key saved  ${chalk.dim(CONFIG_FILE)}`);
  });
