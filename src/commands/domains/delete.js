'use strict';
const { Command } = require('commander');
const { delete: del } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('delete')
  .description('Remove a domain')
  .argument('<domain>', 'Domain name')
  .action(async (domain) => {
    try {
      await del(`/domains/${encodeURIComponent(domain)}`);
      success(`Domain removed  ${domain}`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
