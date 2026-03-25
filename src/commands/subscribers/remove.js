'use strict';
const { Command } = require('commander');
const { delete: del } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('remove')
  .description('Unsubscribe or delete a subscriber')
  .argument('<email>', 'Subscriber email address')
  .option('--delete', 'Permanently delete instead of unsubscribe')
  .action(async (email, opts) => {
    try {
      if (opts.delete) {
        await del(`/subscribers/${encodeURIComponent(email)}`);
        success(`Subscriber deleted  ${email}`);
      } else {
        const { post } = require('../../lib/client');
        await post(`/subscribers/${encodeURIComponent(email)}/unsubscribe`, {});
        success(`Subscriber unsubscribed  ${email}`);
      }
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
