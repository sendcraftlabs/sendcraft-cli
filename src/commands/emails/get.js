'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { json: printJson, error, kv, colorStatus } = require('../../lib/output');
const { sectionTitle } = require('../../lib/logo');

module.exports = new Command('get')
  .description('Get details of a single email')
  .argument('<id>', 'Email ID')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    try {
      const res = await get(`/emails/${id}`);
      const e = res.data || res.email || res;

      if (opts.json) return printJson(e);

      const w = Math.min((process.stdout.columns || 80) - 2, 68);
      const line = chalk.hex('#6366f1')('─'.repeat(w));

      console.log('\n  ' + line);
      console.log(sectionTitle('Email'));
      console.log('  ' + line + '\n');

      kv('ID',      chalk.dim(e.id || e._id));
      kv('From',    chalk.hex('#8b5cf6')(e.from));
      kv('To',      Array.isArray(e.to) ? e.to.join(', ') : e.to);
      if (e.cc?.length)  kv('CC',  Array.isArray(e.cc)  ? e.cc.join(', ')  : e.cc);
      if (e.bcc?.length) kv('BCC', Array.isArray(e.bcc) ? e.bcc.join(', ') : e.bcc);
      kv('Subject', chalk.bold(e.subject));
      kv('Status',  colorStatus(e.status || 'sent'));
      if (e.scheduledAt) kv('Scheduled', new Date(e.scheduledAt).toLocaleString());
      kv('Sent',    e.createdAt ? new Date(e.createdAt).toLocaleString() : chalk.dim('—'));

      console.log('\n  ' + line + '\n');
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
