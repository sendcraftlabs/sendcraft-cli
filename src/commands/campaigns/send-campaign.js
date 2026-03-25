'use strict';
const { Command } = require('commander');
const { post } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('send')
  .description('Send or schedule a campaign')
  .argument('<id>', 'Campaign ID')
  .option('--schedule <when>', 'Schedule date/time (ISO 8601 or natural language)')
  .action(async (id, opts) => {
    try {
      let scheduledAt = null;
      if (opts.schedule) {
        try {
          const chrono = require('chrono-node');
          const parsed = chrono.parseDate(opts.schedule);
          scheduledAt = parsed ? parsed.toISOString() : new Date(opts.schedule).toISOString();
        } catch {
          scheduledAt = new Date(opts.schedule).toISOString();
        }
      }

      await post(`/campaigns/${id}/send`, scheduledAt ? { scheduledAt } : {});
      success(scheduledAt ? `Campaign scheduled for ${scheduledAt}` : `Campaign ${id} is now sending`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
