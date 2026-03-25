'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { post } = require('../../lib/client');
const { success, error } = require('../../lib/output');

const VALID_EVENTS = [
  'email.sent', 'email.delivered', 'email.opened', 'email.clicked',
  'email.bounced', 'email.complained', 'email.failed',
  'subscriber.added', 'subscriber.unsubscribed', 'subscriber.confirmed',
];

module.exports = new Command('create')
  .description('Create a webhook endpoint')
  .requiredOption('-u, --url <url>', 'Endpoint URL (must be HTTPS)')
  .option('-e, --events <events...>', 'Events to subscribe to (default: all)')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      if (opts.events) {
        const invalid = opts.events.filter((e) => !VALID_EVENTS.includes(e));
        if (invalid.length) {
          error(`Unknown event(s): ${invalid.join(', ')}`);
          console.log('  Valid events: ' + VALID_EVENTS.join(', '));
          process.exit(1);
        }
      }

      const body = {
        url: opts.url,
        ...(opts.events ? { events: opts.events } : {}),
      };

      const res = await post('/webhooks', body);
      const id = res.data?.id || res.id || res._id || '';
      if (opts.json) return console.log(JSON.stringify(res, null, 2));
      success(`Webhook created  ${id}`);
      console.log(`  URL: ${chalk.cyan(opts.url)}`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
