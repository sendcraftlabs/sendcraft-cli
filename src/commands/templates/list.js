'use strict';
const { Command } = require('commander');
const { get } = require('../../lib/client');
const { table, json: printJson, error } = require('../../lib/output');

module.exports = new Command('list')
  .description('List email templates')
  .option('-l, --limit <n>', 'Results per page', '20')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const res = await get(`/templates?limit=${opts.limit}`);
      const items = res.data || res.templates || [];

      if (opts.json) return printJson(res);
      if (!items.length) { console.log('\n  No templates found.\n'); return; }

      table(
        ['ID', 'Name', 'Subject', 'Updated'],
        items.map((t) => [
          t.id || t._id,
          (t.name || '').slice(0, 30),
          (t.subject || '').slice(0, 35),
          t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : '-',
        ])
      );
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
