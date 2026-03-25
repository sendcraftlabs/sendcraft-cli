'use strict';
const { Command } = require('commander');
const { get } = require('../../lib/client');
const { table, json: printJson, error } = require('../../lib/output');

module.exports = new Command('list')
  .description('List all topics')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const res = await get('/topics');
      const items = res.data || res.topics || [];

      if (opts.json) return printJson(res);
      if (!items.length) { console.log('\n  No topics found.\n'); return; }

      table(
        ['ID', 'Name', 'Slug', 'Subscribers', 'Created'],
        items.map((t) => [
          t.id || t._id,
          (t.name || '').slice(0, 30),
          t.slug || '-',
          t.subscriberCount ?? '-',
          t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-',
        ])
      );
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
