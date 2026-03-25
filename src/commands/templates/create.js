'use strict';
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const { post } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('create')
  .description('Create a new template')
  .requiredOption('-n, --name <name>', 'Template name')
  .requiredOption('-s, --subject <subject>', 'Email subject')
  .option('--html <html>', 'HTML body (inline)')
  .option('--html-file <file>', 'Path to HTML file')
  .option('--text <text>', 'Plain-text body')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      let html = opts.html || null;
      if (!html && opts.htmlFile) {
        const p = path.resolve(opts.htmlFile);
        if (!fs.existsSync(p)) { error(`File not found: ${opts.htmlFile}`); process.exit(1); }
        html = fs.readFileSync(p, 'utf8');
      }
      if (!html) { error('Provide --html or --html-file'); process.exit(1); }

      const res = await post('/templates', {
        name: opts.name,
        subject: opts.subject,
        html,
        ...(opts.text ? { text: opts.text } : {}),
      });

      const id = res.data?.id || res.id || res._id || '';
      if (opts.json) return console.log(JSON.stringify(res, null, 2));
      success(`Template created  ${id}`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
