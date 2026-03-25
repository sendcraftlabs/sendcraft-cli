'use strict';
const { Command } = require('commander');
const chalk = require('chalk');

const EVENTS = [
  { event: 'email.sent',            description: 'Email accepted for delivery' },
  { event: 'email.delivered',       description: 'Email confirmed delivered' },
  { event: 'email.opened',          description: 'Recipient opened the email' },
  { event: 'email.clicked',         description: 'Recipient clicked a link' },
  { event: 'email.bounced',         description: 'Permanent or temporary bounce' },
  { event: 'email.complained',      description: 'Spam complaint received' },
  { event: 'email.failed',          description: 'Send failed (max retries exceeded)' },
  { event: 'subscriber.added',      description: 'New subscriber added' },
  { event: 'subscriber.unsubscribed', description: 'Subscriber unsubscribed' },
  { event: 'subscriber.confirmed',  description: 'Double opt-in confirmed' },
];

module.exports = new Command('events')
  .description('List all webhook event types')
  .action(() => {
    console.log('\n  ' + chalk.bold('Webhook Event Types') + '\n');
    for (const { event, description } of EVENTS) {
      console.log('  ' + chalk.cyan(event.padEnd(30)) + chalk.dim(description));
    }
    console.log();
  });
