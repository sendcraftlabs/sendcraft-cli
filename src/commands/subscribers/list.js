'use strict';
const { Command } = require('commander');
const { get } = require('../../lib/client');
const { table, json: printJson, error } = require('../../lib/output');

module.exports = new Command('list')
  .description('List subscribers')
  .option('-l, --limit <n>', 'Results per page', '20')
  .option('-p, --page <n>', 'Page number', '1')
  .option('--status <status>', 'Filter by status (active|pending|unsubscribed)')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const qs = new URLSearchParams({ limit: opts.limit, page: opts.page, ...(opts.status ? { status: opts.status } : {}) });
      const res = await get(`/subscribers?${qs}`);
      const items = res.data || res.subscribers || [];

      if (opts.json) return printJson(res);
      if (!items.length) { console.log('\n  No subscribers found.\n'); return; }

      table(
        ['Email', 'Name', 'Status', 'Subscribed'],
        items.map((s) => [
          s.email,
          s.name || '-',
          s.status || 'active',
          s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-',
        ])
      );
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
