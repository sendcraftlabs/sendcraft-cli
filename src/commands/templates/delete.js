'use strict';
const { Command } = require('commander');
const { delete: del } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('delete')
  .description('Delete a template')
  .argument('<id>', 'Template ID')
  .action(async (id) => {
    try {
      await del(`/templates/${id}`);
      success(`Template deleted  ${id}`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
