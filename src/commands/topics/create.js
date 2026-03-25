'use strict';
const { Command } = require('commander');
const { post } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('create')
  .description('Create a topic')
  .requiredOption('-n, --name <name>', 'Topic name')
  .option('--description <desc>', 'Topic description')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const res = await post('/topics', {
        name: opts.name,
        ...(opts.description ? { description: opts.description } : {}),
      });
      const id = res.data?.id || res.id || res._id || '';
      if (opts.json) return console.log(JSON.stringify(res, null, 2));
      success(`Topic created  ${id}`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
