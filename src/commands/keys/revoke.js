'use strict';
const { Command } = require('commander');
const { delete: del } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('revoke')
  .description('Revoke an API key')
  .argument('<id>', 'API key ID')
  .action(async (id) => {
    try {
      await del(`/user/api-keys/${id}`);
      success(`API key revoked  ${id}`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
