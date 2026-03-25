'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { table, json: printJson, error } = require('../../lib/output');

module.exports = new Command('list')
  .description('List API keys')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const res = await get('/user/api-keys');
      const items = res.data || res.apiKeys || res.keys || [];

      if (opts.json) return printJson(res);
      if (!items.length) { console.log('\n  No API keys found.\n'); return; }

      table(
        ['ID', 'Name', 'Scope', 'Last Used', 'Created'],
        items.map((k) => [
          k.id || k._id,
          (k.name || 'Unnamed').slice(0, 25),
          k.permissions || k.scope || 'full_access',
          k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : chalk.dim('Never'),
          k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '-',
        ])
      );
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
