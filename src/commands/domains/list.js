'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { table, json: printJson, error } = require('../../lib/output');

module.exports = new Command('list')
  .description('List verified domains')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const res = await get('/domains');
      const items = res.data || res.domains || [];

      if (opts.json) return printJson(res);
      if (!items.length) { console.log('\n  No domains found.\n'); return; }

      table(
        ['Domain', 'Status', 'SPF', 'DKIM', 'Added'],
        items.map((d) => [
          d.domain,
          d.status === 'verified' ? chalk.green(d.status) : chalk.yellow(d.status || 'pending'),
          d.spfVerified  ? chalk.green('✓') : chalk.red('✗'),
          d.dkimVerified ? chalk.green('✓') : chalk.red('✗'),
          d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-',
        ])
      );
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
