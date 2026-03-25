'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { json: printJson, error, kv, colorStatus } = require('../../lib/output');
const { sectionTitle } = require('../../lib/logo');

module.exports = new Command('get')
  .description('Get subscriber details')
  .argument('<email>', 'Subscriber email address')
  .option('--json', 'Output raw JSON')
  .action(async (email, opts) => {
    try {
      const res = await get(`/subscribers/${encodeURIComponent(email)}`);
      const s = res.data || res.subscriber || res;

      if (opts.json) return printJson(s);

      const w = Math.min((process.stdout.columns || 80) - 2, 68);
      const line = chalk.hex('#6366f1')('─'.repeat(w));

      console.log('\n  ' + line);
      console.log(sectionTitle('Subscriber'));
      console.log('  ' + line + '\n');

      kv('Email',  chalk.hex('#8b5cf6')(s.email));
      kv('Name',   s.name || chalk.dim('—'));
      kv('Status', colorStatus(s.status || 'active'));
      if (s.tags?.length) kv('Tags', s.tags.map(t => chalk.hex('#6366f1')(t)).join('  '));
      kv('Joined', s.createdAt ? new Date(s.createdAt).toLocaleString() : chalk.dim('—'));
      if (s.confirmedAt) kv('Confirmed', new Date(s.confirmedAt).toLocaleString());

      console.log('\n  ' + line + '\n');
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
