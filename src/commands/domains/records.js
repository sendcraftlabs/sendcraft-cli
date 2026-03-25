'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { json: printJson, error } = require('../../lib/output');

module.exports = new Command('records')
  .description('Show required DNS records for a domain')
  .argument('<domain>', 'Domain name')
  .option('--json', 'Output raw JSON')
  .action(async (domain, opts) => {
    try {
      const res = await get(`/domains/${encodeURIComponent(domain)}/records`);
      const records = res.data || res.records || [];

      if (opts.json) return printJson(res);
      if (!records.length) { console.log('\n  No records found.\n'); return; }

      console.log(`\n  DNS records for ${chalk.cyan(domain)}\n`);
      console.log('  ' + chalk.dim('─'.repeat(80)));

      for (const r of records) {
        console.log(
          `  ${chalk.bold(r.type.padEnd(6))} ` +
          `${chalk.cyan((r.name || '@').padEnd(35))} ` +
          chalk.dim(r.value || r.content || '')
        );
        if (r.verified) console.log('  ' + chalk.green('  ✓ Verified'));
        else             console.log('  ' + chalk.yellow('  ○ Pending'));
      }
      console.log();
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
