'use strict';
const { Command } = require('commander');
const { get } = require('../../lib/client');
const { table, json: printJson, error } = require('../../lib/output');

module.exports = new Command('list')
  .description('List sent emails')
  .option('-l, --limit <n>', 'Number of results', '20')
  .option('-p, --page <n>', 'Page number', '1')
  .option('--status <status>', 'Filter by status (sent|failed|scheduled|cancelled)')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const qs = new URLSearchParams({
        limit: opts.limit,
        page: opts.page,
        ...(opts.status ? { status: opts.status } : {}),
      });
      const res = await get(`/emails?${qs}`);
      const emails = res.data || res.emails || [];

      if (opts.json) return printJson(res);

      if (!emails.length) { console.log('\n  No emails found.\n'); return; }

      table(
        ['ID', 'To', 'Subject', 'Status', 'Sent At'],
        emails.map((e) => [
          e.id || e._id,
          Array.isArray(e.to) ? e.to[0] : e.to,
          (e.subject || '').slice(0, 40),
          e.status || '-',
          e.createdAt ? new Date(e.createdAt).toLocaleString() : '-',
        ])
      );
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
