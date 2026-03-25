'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { json: printJson, error } = require('../../lib/output');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

module.exports = new Command('send-time')
  .description('AI-powered optimal send time recommendation')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const res = await get('/analytics/send-time');
      const d = res.data || res;

      if (opts.json) return printJson(d);

      console.log();
      console.log('  ' + chalk.bold('Optimal Send Time') + '  ' + chalk.dim('(based on your audience)'));
      console.log('  ' + chalk.dim('─'.repeat(40)));

      if (d.bestHour != null) {
        const h = d.bestHour;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12  = h % 12 || 12;
        console.log('  Best hour:  ' + chalk.cyan(`${h12}:00 ${ampm}`) + chalk.dim(`  (hour ${h})`));
      }
      if (d.bestDay != null) {
        console.log('  Best day:   ' + chalk.cyan(DAYS[d.bestDay] || `Day ${d.bestDay}`));
      }
      if (d.avgOpenRate != null) {
        console.log('  Avg open rate at this time: ' + chalk.green((d.avgOpenRate * 100).toFixed(1) + '%'));
      }
      console.log();
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
