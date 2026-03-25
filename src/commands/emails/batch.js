'use strict';
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const { post } = require('../../lib/client');
const { success, error, json: printJson } = require('../../lib/output');

module.exports = new Command('batch')
  .description('Send up to 100 emails from a JSON file')
  .argument('<file>', 'Path to JSON file (array of email objects)')
  .option('--json', 'Output raw JSON')
  .action(async (file, opts) => {
    try {
      const p = path.resolve(file);
      if (!fs.existsSync(p)) { error(`File not found: ${file}`); process.exit(1); }

      let emails;
      try {
        emails = JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch {
        error('Invalid JSON in file'); process.exit(1);
      }

      if (!Array.isArray(emails)) { error('JSON file must contain an array of email objects'); process.exit(1); }
      if (emails.length > 100) { error('Maximum 100 emails per batch'); process.exit(1); }

      const ALLOWED_KEYS = new Set(['to', 'from', 'subject', 'html', 'text', 'cc', 'bcc', 'replyTo', 'scheduledAt', 'idempotencyKey']);
      const safe = emails.map(e => {
        if (!e || typeof e !== 'object' || Array.isArray(e)) { error('Each item must be an email object'); process.exit(1); }
        const out = {};
        for (const k of Object.keys(e)) { if (ALLOWED_KEYS.has(k)) out[k] = e[k]; }
        return out;
      });
      emails = safe;

      const res = await post('/emails/batch', { emails });

      if (opts.json) return printJson(res);
      success(`Batch sent: ${emails.length} emails queued`);
      if (res.data?.length) {
        res.data.forEach((e, i) => console.log(`  [${i + 1}] ${e.id || e._id || '—'}`));
      }
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
