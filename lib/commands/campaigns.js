const { Command } = require('commander');
const chalk = require('chalk');
const client = require('../client');
const { table, json, colorStatus, info, success, error, spinner } = require('../output');

const cmd = new Command('campaigns').description('Manage campaigns');

cmd
  .command('list')
  .description('List campaigns')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Fetching campaigns…').start();
    try {
      const data = await client.get('/campaigns');
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const campaigns = data.campaigns || [];
      if (!campaigns.length) return info('No campaigns yet. Create one in the dashboard.');
      table(
        ['ID', 'Name', 'Subject', 'Status', 'Recipients', 'Created'],
        campaigns.map(c => [
          chalk.dim(String(c._id).slice(-8)),
          chalk.bold((c.name || '').slice(0, 25)),
          (c.subject || '').slice(0, 30),
          colorStatus(c.status),
          c.recipientCount != null ? chalk.cyan(String(c.recipientCount)) : '—',
          c.createdAt ? chalk.dim(new Date(c.createdAt).toLocaleString()) : '—',
        ])
      );
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('send <campaignId>')
  .description('Send or schedule a campaign')
  .option('--schedule <isoDate>', 'Schedule for a specific ISO 8601 datetime')
  .option('--json', 'Output raw JSON')
  .action(async (campaignId, opts) => {
    const label = opts.schedule ? `Scheduling campaign…` : `Sending campaign…`;
    const sp = spinner(label).start();
    try {
      const body = opts.schedule ? { scheduledAt: opts.schedule } : {};
      const data = await client.post(`/campaigns/${campaignId}/send`, body);
      sp.succeed(chalk.dim('Done'));
      if (opts.json) return json(data);
      success(`Campaign ${opts.schedule ? 'scheduled for ' + chalk.cyan(opts.schedule) : 'sent!'}`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

module.exports = cmd;
