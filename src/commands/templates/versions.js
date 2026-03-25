'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get, post } = require('../../lib/client');
const { table, json: printJson, success, error } = require('../../lib/output');

const cmd = new Command('versions').description('Manage template versions');

cmd.command('list <templateId>')
  .description('List versions of a template')
  .option('--json', 'Output raw JSON')
  .action(async (templateId, opts) => {
    try {
      const res = await get(`/templates/${templateId}/versions`);
      const items = res.data || res.versions || [];

      if (opts.json) return printJson(res);
      if (!items.length) { console.log('\n  No versions found.\n'); return; }

      table(
        ['Version', 'Subject', 'Created'],
        items.map((v) => [
          v.version ?? v.versionNumber ?? '-',
          (v.subject || '').slice(0, 40),
          v.createdAt ? new Date(v.createdAt).toLocaleString() : '-',
        ])
      );
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });

cmd.command('restore <templateId> <version>')
  .description('Restore a template to a specific version')
  .action(async (templateId, version) => {
    try {
      await post(`/templates/${templateId}/versions/${version}/restore`, {});
      success(`Template ${templateId} restored to version ${version}`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });

module.exports = cmd;
