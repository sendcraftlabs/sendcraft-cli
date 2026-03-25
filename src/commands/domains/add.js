'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { post } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('add')
  .description('Add a domain for verification')
  .argument('<domain>', 'Domain name (e.g. mail.example.com)')
  .option('--json', 'Output raw JSON')
  .action(async (domain, opts) => {
    try {
      const res = await post('/domains', { domain });
      if (opts.json) return console.log(JSON.stringify(res, null, 2));
      success(`Domain added: ${chalk.cyan(domain)}`);
      console.log(`  Run ${chalk.bold(`sendcraft domains records ${domain}`)} to see DNS records.`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
