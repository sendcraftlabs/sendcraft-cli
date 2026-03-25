'use strict';
const { Command } = require('commander');
const { delete: del } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('cancel')
  .description('Cancel a scheduled email')
  .argument('<id>', 'Email ID')
  .action(async (id) => {
    try {
      await del(`/emails/${id}/cancel`);
      success(`Cancelled scheduled email  ${id}`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
