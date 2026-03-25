'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { load, save } = require('../../lib/config');
const { success } = require('../../lib/output');

module.exports = new Command('set-url')
  .description('Override the API base URL (for self-hosted)')
  .argument('<url>', 'API base URL')
  .action((url) => {
    try { new URL(url); } catch { error('Invalid URL'); process.exit(1); }
    const { protocol } = new URL(url);
    if (protocol !== 'https:' && protocol !== 'http:') { error('URL must use http or https'); process.exit(1); }
    if (protocol === 'http:') console.warn(chalk.yellow('  ⚠  Warning: using http:// sends credentials in plaintext. Use https:// for production.'));
    const cfg = load(); cfg.base_url = url.replace(/\/$/, ''); save(cfg);
    success(`Base URL set to ${chalk.cyan(url)}`);
  });
