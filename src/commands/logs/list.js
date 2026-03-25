'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { table, json: printJson, error } = require('../../lib/output');

const LEVEL_COLORS = {
  error: chalk.red,
  warn:  chalk.yellow,
  info:  chalk.cyan,
  debug: chalk.dim,
};

module.exports = new Command('list')
  .description('List audit / activity logs')
  .option('-l, --limit <n>', 'Results per page', '30')
  .option('-p, --page <n>', 'Page number', '1')
  .option('--action <action>', 'Filter by action (e.g. email.sent)')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const qs = new URLSearchParams({
        limit: opts.limit,
        page: opts.page,
        ...(opts.action ? { action: opts.action } : {}),
      });
      const res = await get(`/logs?${qs}`);
      const items = res.data || res.logs || [];

      if (opts.json) return printJson(res);
      if (!items.length) { console.log('\n  No logs found.\n'); return; }

      table(
        ['Time', 'Action', 'Resource', 'IP'],
        items.map((l) => {
          const col = LEVEL_COLORS[l.level] || chalk.white;
          return [
            l.createdAt ? new Date(l.createdAt).toLocaleString() : '-',
            col(l.action || l.event || '-'),
            (l.resourceName || l.resourceId || '').slice(0, 30),
            chalk.dim(l.ip || '-'),
          ];
        })
      );
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
