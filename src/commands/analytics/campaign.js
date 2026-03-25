'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { json: printJson, error } = require('../../lib/output');

module.exports = new Command('campaign')
  .description('Show analytics for a specific campaign')
  .argument('<id>', 'Campaign ID')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    try {
      const res = await get(`/analytics/campaign/${id}`);
      const s = res.data || res.stats || res;

      if (opts.json) return printJson(s);

      console.log();
      console.log('  ' + chalk.bold(`Campaign Analytics  ${chalk.dim(id)}`));
      console.log('  ' + chalk.dim('─'.repeat(35)));
      console.log('  Recipients: ' + chalk.cyan(s.recipients ?? s.total ?? '-'));
      console.log('  Delivered:  ' + chalk.green(s.delivered ?? '-'));
      console.log('  Opens:      ' + chalk.cyan(s.opens ?? '-'));
      console.log('  Clicks:     ' + chalk.cyan(s.clicks ?? '-'));
      console.log('  Bounced:    ' + chalk.red(s.bounced ?? '-'));
      console.log('  Unsubscribed: ' + chalk.yellow(s.unsubscribed ?? '-'));
      if (s.openRate  != null) console.log('  Open rate:  ' + chalk.cyan((s.openRate  * 100).toFixed(1) + '%'));
      if (s.clickRate != null) console.log('  Click rate: ' + chalk.cyan((s.clickRate * 100).toFixed(1) + '%'));
      console.log();
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
