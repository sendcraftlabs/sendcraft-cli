'use strict';
const { Command } = require('commander');
const { get } = require('../../lib/client');
const { table, json: printJson, error } = require('../../lib/output');

module.exports = new Command('list')
  .description('List campaigns')
  .option('-l, --limit <n>', 'Results per page', '20')
  .option('-p, --page <n>', 'Page number', '1')
  .option('--status <status>', 'Filter by status (draft|scheduled|sending|sent|failed)')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const qs = new URLSearchParams({ limit: opts.limit, page: opts.page, ...(opts.status ? { status: opts.status } : {}) });
      const res = await get(`/campaigns?${qs}`);
      const items = res.data || res.campaigns || [];

      if (opts.json) return printJson(res);
      if (!items.length) { console.log('\n  No campaigns found.\n'); return; }

      table(
        ['ID', 'Name', 'Status', 'Recipients', 'Sent At'],
        items.map((c) => [
          c.id || c._id,
          (c.name || '').slice(0, 35),
          c.status || '-',
          c.recipientCount ?? '-',
          c.sentAt ? new Date(c.sentAt).toLocaleString() : '-',
        ])
      );
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
