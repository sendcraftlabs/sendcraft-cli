'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get } = require('../../lib/client');
const { json: printJson, error } = require('../../lib/output');

module.exports = new Command('get')
  .description('Get a template')
  .argument('<id>', 'Template ID')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    try {
      const res = await get(`/templates/${id}`);
      const t = res.data || res.template || res;

      if (opts.json) return printJson(t);

      console.log();
      console.log('  ' + chalk.bold('ID:')      + '  ' + chalk.dim(t.id || t._id));
      console.log('  ' + chalk.bold('Name:')    + '  ' + chalk.cyan(t.name));
      console.log('  ' + chalk.bold('Subject:') + '  ' + t.subject);
      console.log('  ' + chalk.bold('Updated:') + '  ' + (t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '-'));
      console.log();
      if (t.html) {
        console.log(chalk.dim('  ── HTML preview (first 200 chars) ──'));
        console.log('  ' + t.html.slice(0, 200).replace(/\n/g, '\n  '));
        console.log();
      }
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
