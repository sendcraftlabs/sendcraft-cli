'use strict';
const { Command } = require('commander');
const { post } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('test')
  .description('Send a test ping to a webhook endpoint')
  .argument('<id>', 'Webhook ID')
  .action(async (id) => {
    try {
      const res = await post(`/webhooks/${id}/test`, {});
      if (res.success || res.statusCode === 200) {
        success(`Test event delivered  (HTTP ${res.statusCode || 200})`);
      } else {
        error(`Webhook responded with error: ${JSON.stringify(res)}`);
        process.exit(1);
      }
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
