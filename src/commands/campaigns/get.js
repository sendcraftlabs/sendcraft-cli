'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { json: printJson, error, kv, colorStatus } = require('../../lib/output');
const { sectionTitle } = require('../../lib/logo');

module.exports = new Command('get')
  .description('Get campaign details')
  .argument('<id>', 'Campaign ID')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    try {
      const res = await get(`/campaigns/${id}`);
      const c = res.data || res.campaign || res;

      if (opts.json) return printJson(c);

      const w = Math.min((process.stdout.columns || 80) - 2, 68);
      const line = chalk.hex('#6366f1')('─'.repeat(w));

      console.log('\n  ' + line);
      console.log(sectionTitle('Campaign'));
      console.log('  ' + line + '\n');

      kv('ID',          chalk.dim(c.id || c._id));
      kv('Name',        chalk.bold(c.name));
      kv('Status',      colorStatus(c.status || 'draft'));
      kv('Subject',     c.subject || chalk.dim('—'));
      if (c.fromEmail)  kv('From',     chalk.hex('#8b5cf6')(c.fromEmail));
      if (c.scheduledAt) kv('Scheduled', new Date(c.scheduledAt).toLocaleString());
      if (c.sentAt)      kv('Sent',      new Date(c.sentAt).toLocaleString());
      kv('Recipients',  chalk.hex('#8b5cf6')(String(c.recipientCount ?? '—')));

      console.log('\n  ' + line + '\n');
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
