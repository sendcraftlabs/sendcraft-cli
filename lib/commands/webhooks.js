const { Command } = require('commander');
const chalk = require('chalk');
const client = require('../client');
const { table, json, colorStatus, info, success, error, spinner } = require('../output');

const cmd = new Command('webhooks').description('Manage webhooks');

const ALL_EVENTS = [
  'email.sent', 'email.delivered', 'email.opened', 'email.clicked',
  'email.bounced', 'email.complained', 'email.failed',
  'subscriber.added', 'subscriber.unsubscribed', 'subscriber.confirmed',
];

cmd
  .command('list')
  .description('List all webhooks')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Fetching webhooks…').start();
    try {
      const data = await client.get('/webhooks');
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const webhooks = data.webhooks || [];
      if (!webhooks.length) return info('No webhooks. Run: ' + chalk.cyan('sendcraft webhooks create <url>'));
      table(
        ['ID', 'URL', 'Events', 'Status', 'Created'],
        webhooks.map(w => [
          chalk.dim(String(w._id).slice(-8)),
          chalk.cyan(w.url.slice(0, 45)),
          w.events?.length === ALL_EVENTS.length ? chalk.dim('all') : chalk.dim((w.events || []).slice(0, 3).join(', ') + (w.events?.length > 3 ? ` +${w.events.length - 3}` : '')),
          w.isActive ? chalk.green('active') : chalk.dim('inactive'),
          w.createdAt ? chalk.dim(new Date(w.createdAt).toLocaleDateString()) : '—',
        ])
      );
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('create <url>')
  .description('Create a new webhook endpoint')
  .option('--events <list>', 'Comma-separated event types (default: all)', ALL_EVENTS.join(','))
  .option('--json', 'Output raw JSON')
  .action(async (url, opts) => {
    const events = opts.events.split(',').map(e => e.trim()).filter(Boolean);
    const sp = spinner(`Creating webhook for ${chalk.cyan(url)}…`).start();
    try {
      const data = await client.post('/webhooks', { url, events });
      sp.succeed(chalk.dim('Created'));
      if (opts.json) return json(data);
      const w = data.webhook || data;
      success(`Webhook created  ${chalk.dim('ID: ' + (w._id || '—'))}`);
      info(`Listening for: ${chalk.dim(events.join(', '))}`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('delete <webhookId>')
  .description('Delete a webhook')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    const sp = spinner(`Deleting webhook ${chalk.dim(id.slice(-8))}…`).start();
    try {
      const data = await client.delete(`/webhooks/${id}`);
      sp.succeed(chalk.dim('Deleted'));
      if (opts.json) return json(data);
      success('Webhook deleted.');
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('test <webhookId>')
  .description('Send a test payload to a webhook endpoint')
  .option('--event <type>', 'Event type to simulate', 'email.delivered')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    const sp = spinner(`Sending test ${chalk.dim(opts.event)} event…`).start();
    try {
      const data = await client.post(`/webhooks/${id}/test`, { event: opts.event });
      sp.succeed(chalk.dim('Test sent'));
      if (opts.json) return json(data);
      const status = data.statusCode || data.status;
      if (status && status >= 200 && status < 300) {
        success(`Endpoint responded ${chalk.green(status + ' OK')}`);
      } else {
        require('../output').warn(`Endpoint responded ${chalk.yellow(status || '?')}`);
      }
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('events')
  .description('List all supported webhook event types')
  .action(() => {
    console.log('\n  ' + chalk.bold('Supported webhook events:') + '\n');
    ALL_EVENTS.forEach(e => {
      const [resource, action] = e.split('.');
      console.log(`  ${chalk.cyan(resource + '.')}${chalk.bold(action)}`);
    });
    console.log();
  });

module.exports = cmd;
