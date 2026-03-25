'use strict';
const { Command } = require('commander');
const { post } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('add')
  .description('Add a subscriber')
  .requiredOption('-e, --email <email>', 'Email address')
  .option('-n, --name <name>', 'Display name')
  .option('--tags <tags...>', 'Tags to assign')
  .option('--double-opt-in', 'Send double opt-in confirmation email')
  .action(async (opts) => {
    try {
      const body = {
        email: opts.email,
        ...(opts.name ? { name: opts.name } : {}),
        ...(opts.tags ? { tags: opts.tags } : {}),
        ...(opts.doubleOptIn ? { doubleOptIn: true } : {}),
      };
      await post('/subscribers', body);
      success(`Subscriber added  ${opts.email}`);
      if (opts.doubleOptIn) console.log('  Confirmation email sent.');
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
