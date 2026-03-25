const { Command } = require('commander');
const chalk = require('chalk');
const client = require('../client');
const { table, json, colorStatus, info, success, error, spinner } = require('../output');

const cmd = new Command('subscribers').description('Manage subscribers');

cmd
  .command('list')
  .description('List subscribers')
  .option('-p, --page <n>', 'Page', '1')
  .option('-l, --limit <n>', 'Limit', '20')
  .option('--status <s>', 'Filter: active, pending, unsubscribed')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Fetching subscribers…').start();
    try {
      const params = new URLSearchParams({ page: opts.page, limit: opts.limit });
      if (opts.status) params.set('status', opts.status);
      const data = await client.get(`/subscribers?${params}`);
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const subs = data.subscribers || [];
      if (!subs.length) return info('No subscribers found.');
      table(
        ['Email', 'Name', 'Status', 'Tags', 'Joined'],
        subs.map(s => [
          chalk.cyan(s.email),
          [s.firstName, s.lastName].filter(Boolean).join(' ') || chalk.dim('—'),
          colorStatus(s.status),
          (s.tags || []).length ? s.tags.map(t => chalk.magenta(t)).join(', ') : chalk.dim('—'),
          s.createdAt ? chalk.dim(new Date(s.createdAt).toLocaleDateString()) : '—',
        ])
      );
      info(`Page ${opts.page} · ${subs.length} of ${chalk.bold(data.total ?? '?')}`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('add <email>')
  .description('Add a subscriber to a list')
  .requiredOption('--list <listId>', 'Email list ID')
  .option('--first-name <name>', 'First name')
  .option('--last-name <name>', 'Last name')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--json', 'Output raw JSON')
  .action(async (email, opts) => {
    const sp = spinner(`Adding ${chalk.cyan(email)}…`).start();
    try {
      const data = await client.post('/subscribers/add', {
        email,
        listId: opts.list,
        firstName: opts.firstName,
        lastName: opts.lastName,
        tags: opts.tags ? opts.tags.split(',').map(t => t.trim()) : undefined,
      });
      sp.succeed(chalk.dim('Done'));
      if (opts.json) return json(data);
      success(`${chalk.cyan(email)} added to list.`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('remove <subscriberId>')
  .description('Remove a subscriber by ID')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    const sp = spinner(`Removing ${chalk.dim(id.slice(-8))}…`).start();
    try {
      const data = await client.delete(`/subscribers/${id}`);
      sp.succeed(chalk.dim('Done'));
      if (opts.json) return json(data);
      success(`Subscriber removed.`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

module.exports = cmd;
