'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { json: printJson, error, kv } = require('../../lib/output');
const { sectionTitle } = require('../../lib/logo');

function pct(v) {
  return v != null ? chalk.hex('#06b6d4')((v * 100).toFixed(1) + '%') : chalk.dim('—');
}
function num(v) {
  return v != null ? chalk.hex('#8b5cf6')(Number(v).toLocaleString()) : chalk.dim('—');
}

module.exports = new Command('overview')
  .description('Show overall analytics summary')
  .option('--days <n>', 'Last N days', '30')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const res = await get(`/analytics?days=${opts.days}`);
      const s = res.data || res.stats || res;

      if (opts.json) return printJson(s);

      const w = Math.min((process.stdout.columns || 80) - 2, 68);
      const line = chalk.hex('#6366f1')('─'.repeat(w));

      console.log('\n  ' + line);
      console.log(sectionTitle(`Analytics — last ${opts.days} days`));
      console.log('  ' + line + '\n');

      kv('Emails sent',  num(s.sent ?? s.totalSent));
      kv('Delivered',    chalk.hex('#10b981')(Number(s.delivered ?? 0).toLocaleString()));
      kv('Opens',        num(s.opens ?? s.opened));
      kv('Clicks',       num(s.clicks ?? s.clicked));
      kv('Bounced',      chalk.hex('#ef4444')(Number(s.bounced ?? s.bounces ?? 0).toLocaleString()));
      kv('Complaints',   chalk.hex('#f59e0b')(Number(s.complaints ?? 0).toLocaleString()));
      kv('Open rate',    pct(s.openRate));
      kv('Click rate',   pct(s.clickRate));

      console.log('\n  ' + line + '\n');
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
