'use strict';
const { Command } = require('commander');
const { delete: del } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('delete')
  .description('Delete a webhook endpoint')
  .argument('<id>', 'Webhook ID')
  .action(async (id) => {
    try {
      await del(`/webhooks/${id}`);
      success(`Webhook deleted  ${id}`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
