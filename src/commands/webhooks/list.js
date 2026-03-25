'use strict';
const { Command } = require('commander');
const { get } = require('../../lib/client');
const { table, json: printJson, error } = require('../../lib/output');

module.exports = new Command('list')
  .description('List webhook endpoints')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const res = await get('/webhooks');
      const items = res.data || res.webhooks || [];

      if (opts.json) return printJson(res);
      if (!items.length) { console.log('\n  No webhooks found.\n'); return; }

      table(
        ['ID', 'URL', 'Events', 'Created'],
        items.map((w) => [
          w.id || w._id,
          (w.url || '').slice(0, 45),
          Array.isArray(w.events) ? w.events.slice(0, 3).join(', ') + (w.events.length > 3 ? '…' : '') : (w.events || 'all'),
          w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '-',
        ])
      );
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
