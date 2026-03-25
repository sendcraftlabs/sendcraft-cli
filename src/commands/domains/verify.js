'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { post } = require('../../lib/client');
const { success, error, info } = require('../../lib/output');

module.exports = new Command('verify')
  .description('Trigger DNS verification for a domain')
  .argument('<domain>', 'Domain name')
  .option('--json', 'Output raw JSON')
  .action(async (domain, opts) => {
    try {
      const res = await post(`/domains/${encodeURIComponent(domain)}/verify`, {});
      if (opts.json) return console.log(JSON.stringify(res, null, 2));

      const d = res.data || res.domain || res;
      if (d.status === 'verified') {
        success(`Domain ${chalk.cyan(domain)} is verified`);
      } else {
        info(`Verification pending for ${chalk.cyan(domain)}`);
        console.log('  DNS records may take up to 48 hours to propagate.');
      }
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
