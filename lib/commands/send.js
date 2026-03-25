const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const client = require('../client');
const { success, error, spinner } = require('../output');

/**
 * Parse a date string — supports ISO 8601 and natural language via chrono-node.
 * Falls back gracefully if chrono-node is not installed.
 */
function parseDate(str) {
  if (!str) return undefined;
  // Try native Date first (ISO 8601)
  const direct = new Date(str);
  if (!isNaN(direct)) return direct.toISOString();
  // Try chrono-node (natural language: "tomorrow at 9am", "next Monday", "in 1 hour")
  try {
    const chrono = require('chrono-node');
    const parsed = chrono.parseDate(str);
    if (parsed) return parsed.toISOString();
  } catch (_) {}
  throw new Error(`Could not parse date: "${str}"\n  Use ISO 8601 (2025-12-25T09:00:00Z) or natural language ("tomorrow at 9am")`);
}

const cmd = new Command('send')
  .description('Send a transactional email')
  .requiredOption('-t, --to <email...>', 'Recipient(s) — space-separated for multiple')
  .requiredOption('-s, --subject <text>', 'Email subject')
  .option('-H, --html <html>', 'HTML body (inline)')
  .option('--html-file <path>', 'HTML body from file')
  .option('-T, --text <text>', 'Plain text body (inline)')
  .option('--text-file <path>', 'Plain text body from file')
  .option('-f, --from <email>', 'From address (uses account default if omitted)')
  .option('-r, --reply-to <email>', 'Reply-To address')
  .option('--cc <email...>', 'CC recipient(s)')
  .option('--bcc <email...>', 'BCC recipient(s)')
  .option('--schedule <date>', 'Schedule send — ISO 8601 or natural language ("tomorrow at 9am")')
  .option('--idempotency-key <key>', 'Idempotency key for safe retries')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    // Resolve HTML content
    let html = opts.html;
    if (!html && opts.htmlFile) {
      if (!fs.existsSync(opts.htmlFile)) { error(`File not found: ${opts.htmlFile}`); process.exit(1); }
      html = fs.readFileSync(opts.htmlFile, 'utf8');
    }

    // Resolve text content
    let text = opts.text;
    if (!text && opts.textFile) {
      if (!fs.existsSync(opts.textFile)) { error(`File not found: ${opts.textFile}`); process.exit(1); }
      text = fs.readFileSync(opts.textFile, 'utf8');
    }

    if (!html && !text) {
      error('Provide at least one of: --html, --html-file, --text, --text-file');
      process.exit(1);
    }

    // Parse schedule date
    let scheduledAt;
    if (opts.schedule) {
      try { scheduledAt = parseDate(opts.schedule); }
      catch (e) { error(e.message); process.exit(1); }
    }

    const toList = Array.isArray(opts.to) ? opts.to : [opts.to];
    const label = toList.length === 1 ? chalk.cyan(toList[0]) : chalk.cyan(`${toList.length} recipients`);
    const sp = spinner(scheduledAt ? `Scheduling to ${label}…` : `Sending to ${label}…`).start();

    try {
      const headers = {};
      if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

      const result = await client.post('/emails/send', {
        toEmail: toList.length === 1 ? toList[0] : toList,
        subject: opts.subject,
        htmlContent: html,
        plainTextContent: text,
        fromEmail: opts.from,
        replyTo: opts.replyTo,
        cc: opts.cc,
        bcc: opts.bcc,
        scheduledAt,
      }, { headers });

      sp.succeed(chalk.dim('Done'));
      if (opts.json) return require('../output').json(result);

      if (scheduledAt) {
        success(`Scheduled for ${chalk.cyan(new Date(scheduledAt).toLocaleString())}  ${chalk.dim('ID: ' + (result.emailId || result._id || '—'))}`);
      } else {
        success(`Sent!  ${chalk.dim('ID: ' + (result.emailId || result._id || '—'))}`);
      }
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

module.exports = cmd;
