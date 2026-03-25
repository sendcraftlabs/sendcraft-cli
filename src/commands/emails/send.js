'use strict';
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const { post } = require('../../lib/client');
const { success, error, json: printJson } = require('../../lib/output');

module.exports = new Command('send')
  .description('Send a transactional email')
  .requiredOption('-t, --to <emails...>', 'Recipient email(s)')
  .requiredOption('-f, --from <email>', 'Sender email address')
  .requiredOption('-s, --subject <subject>', 'Email subject')
  .option('--html <html>', 'HTML body (inline)')
  .option('--html-file <file>', 'Path to HTML file')
  .option('--text <text>', 'Plain-text body')
  .option('--text-file <file>', 'Path to plain-text file')
  .option('--cc <emails...>', 'CC recipient(s)')
  .option('--bcc <emails...>', 'BCC recipient(s)')
  .option('--reply-to <email>', 'Reply-To address')
  .option('--schedule <when>', 'Schedule send (e.g. "tomorrow at 9am", "in 2 hours", ISO 8601)')
  .option('--idempotency-key <key>', 'Idempotency key to prevent duplicate sends')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      // Resolve HTML
      let html = opts.html || null;
      if (!html && opts.htmlFile) {
        const p = path.resolve(opts.htmlFile);
        if (!fs.existsSync(p)) { error(`File not found: ${opts.htmlFile}`); process.exit(1); }
        html = fs.readFileSync(p, 'utf8');
      }

      // Resolve text
      let text = opts.text || null;
      if (!text && opts.textFile) {
        const p = path.resolve(opts.textFile);
        if (!fs.existsSync(p)) { error(`File not found: ${opts.textFile}`); process.exit(1); }
        text = fs.readFileSync(p, 'utf8');
      }

      if (!html && !text) { error('Provide --html, --html-file, --text, or --text-file'); process.exit(1); }

      // Resolve schedule
      let scheduledAt = null;
      if (opts.schedule) {
        try {
          const chrono = require('chrono-node');
          const parsed = chrono.parseDate(opts.schedule);
          if (parsed) {
            scheduledAt = parsed.toISOString();
          } else {
            // Try raw ISO date
            const d = new Date(opts.schedule);
            if (isNaN(d.getTime())) { error(`Cannot parse schedule: "${opts.schedule}"`); process.exit(1); }
            scheduledAt = d.toISOString();
          }
        } catch {
          const d = new Date(opts.schedule);
          if (isNaN(d.getTime())) { error(`Cannot parse schedule: "${opts.schedule}"`); process.exit(1); }
          scheduledAt = d.toISOString();
        }
      }

      const body = {
        to: opts.to,
        from: opts.from,
        subject: opts.subject,
        ...(html  ? { html }  : {}),
        ...(text  ? { text }  : {}),
        ...(opts.cc       ? { cc: opts.cc }             : {}),
        ...(opts.bcc      ? { bcc: opts.bcc }           : {}),
        ...(opts.replyTo  ? { replyTo: opts.replyTo }   : {}),
        ...(scheduledAt   ? { scheduledAt }              : {}),
        ...(opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}),
      };

      const headers = opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : {};
      const res = await post('/emails', body, headers);

      if (opts.json) return printJson(res);
      success(`Email sent  ${res.data?.id || res.id || ''}`);
      if (scheduledAt) console.log(`  Scheduled for: ${scheduledAt}`);
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
