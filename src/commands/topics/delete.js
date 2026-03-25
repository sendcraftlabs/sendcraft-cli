'use strict';
const { Command } = require('commander');
const { delete: del } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('delete')
  .description('Delete a topic')
  .argument('<id>', 'Topic ID')
  .action(async (id) => {
    try {
      await del(`/topics/${id}`);
      success(`Topic deleted  ${id}`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
