'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { json: printJson, error, kv } = require('../../lib/output');
const { sectionTitle } = require('../../lib/logo');

module.exports = new Command('stats')
  .description('Show email sending stats')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const res = await get('/emails/stats');
      const s = res.data || res.stats || res;

      if (opts.json) return printJson(s);

      const w = Math.min((process.stdout.columns || 80) - 2, 68);
      const line = chalk.hex('#6366f1')('─'.repeat(w));

      console.log('\n  ' + line);
      console.log(sectionTitle('Email Stats'));
      console.log('  ' + line + '\n');

      const used  = s.sentThisMonth ?? s.sent ?? 0;
      const limit = s.monthlyLimit  ?? s.limit;
      const pct   = limit ? Math.round((used / limit) * 100) : null;

      kv('Sent this month',  chalk.hex('#8b5cf6')(Number(used).toLocaleString()) + (limit ? chalk.dim(` / ${Number(limit).toLocaleString()}`) : '') + (pct != null ? chalk.dim(` (${pct}%)`) : ''));
      kv('Delivered',        chalk.hex('#10b981')(Number(s.delivered ?? 0).toLocaleString()));
      kv('Bounced',          chalk.hex('#ef4444')(Number(s.bounced ?? 0).toLocaleString()));
      kv('Complaints',       chalk.hex('#f59e0b')(Number(s.complaints ?? 0).toLocaleString()));
      if (s.openRate  != null) kv('Open rate',  chalk.hex('#06b6d4')((s.openRate  * 100).toFixed(1) + '%'));
      if (s.clickRate != null) kv('Click rate', chalk.hex('#06b6d4')((s.clickRate * 100).toFixed(1) + '%'));

      console.log('\n  ' + line + '\n');
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
