const { Command } = require('commander');
const chalk = require('chalk');
const client = require('../client');
const { table, json, colorStatus, info, success, error, spinner } = require('../output');

const cmd = new Command('emails').description('Manage emails');

cmd
  .command('list')
  .description('List sent emails')
  .option('-p, --page <n>', 'Page number', '1')
  .option('-l, --limit <n>', 'Items per page', '20')
  .option('--status <s>', 'Filter: sent | delivered | failed | scheduled')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Fetching emails…').start();
    try {
      const params = new URLSearchParams({ page: opts.page, limit: opts.limit });
      if (opts.status) params.set('status', opts.status);
      const data = await client.get(`/emails?${params}`);
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const emails = data.emails || [];
      if (!emails.length) return info('No emails found.');
      table(
        ['ID', 'To', 'Subject', 'Status', 'Sent At'],
        emails.map(e => [
          chalk.dim(String(e._id).slice(-8)),
          chalk.cyan(e.toEmail),
          (e.subject || '').slice(0, 40),
          colorStatus(e.status),
          e.createdAt ? chalk.dim(new Date(e.createdAt).toLocaleString()) : '—',
        ])
      );
      info(`Page ${opts.page} · ${emails.length} of ${chalk.bold(data.total ?? '?')}`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('stats')
  .description('Show email stats summary')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Loading stats…').start();
    try {
      const data = await client.get('/emails/stats/summary');
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const s = data.stats || data;
      const openRate  = s.openRate  != null ? chalk.green(`${(s.openRate  * 100).toFixed(1)}%`) : '—';
      const clickRate = s.clickRate != null ? chalk.cyan( `${(s.clickRate * 100).toFixed(1)}%`) : '—';
      table(
        ['Metric', 'Value'],
        [
          ['Total Sent',  chalk.bold(String(s.totalSent  ?? '—'))],
          ['Delivered',   chalk.green(String(s.delivered  ?? '—'))],
          ['Opened',      chalk.cyan(String(s.opened      ?? '—'))],
          ['Clicked',     chalk.cyan(String(s.clicked     ?? '—'))],
          ['Bounced',     chalk.red(String(s.bounced      ?? '—'))],
          ['Failed',      chalk.red(String(s.failed       ?? '—'))],
          ['Open Rate',   openRate],
          ['Click Rate',  clickRate],
        ]
      );
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('get <emailId>')
  .description('Get details for a single email')
  .option('--json', 'Output raw JSON')
  .action(async (emailId, opts) => {
    const sp = spinner(`Fetching email ${chalk.dim(emailId.slice(-8))}…`).start();
    try {
      const data = await client.get(`/emails/${emailId}`);
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const e = data.email || data;
      table(
        ['Field', 'Value'],
        [
          ['ID',      chalk.dim(e._id)],
          ['To',      chalk.cyan(e.toEmail)],
          ['Subject', chalk.bold(e.subject)],
          ['Status',  colorStatus(e.status)],
          ['From',    e.fromEmail || '—'],
          ['Sent At', e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'],
          ['Opens',   String(e.openCount ?? '—')],
          ['Clicks',  String(e.clickCount ?? '—')],
        ]
      );
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('cancel <emailId>')
  .description('Cancel a scheduled email')
  .option('--json', 'Output raw JSON')
  .action(async (emailId, opts) => {
    const sp = spinner(`Cancelling ${chalk.dim(emailId.slice(-8))}…`).start();
    try {
      const data = await client.delete(`/emails/${emailId}/schedule`);
      sp.succeed(chalk.dim('Cancelled'));
      if (opts.json) return json(data);
      success('Scheduled email cancelled.');
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('batch <file>')
  .description('Send a batch of emails from a JSON file (array of email objects, max 100)')
  .option('--json', 'Output raw JSON')
  .action(async (file, opts) => {
    const fs = require('fs');
    if (!fs.existsSync(file)) { error(`File not found: ${file}`); process.exit(1); }
    let emails;
    try {
      emails = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      error('Invalid JSON file'); process.exit(1);
    }
    if (!Array.isArray(emails)) { error('JSON file must be an array of email objects'); process.exit(1); }
    if (emails.length > 100) { error('Batch limit is 100 emails per request'); process.exit(1); }

    const sp = spinner(`Sending batch of ${chalk.cyan(emails.length)} emails…`).start();
    try {
      const data = await client.post('/emails/batch', { emails });
      sp.succeed(chalk.dim('Done'));
      if (opts.json) return json(data);
      const results = data.results || [];
      const sent = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      success(`Batch complete — ${chalk.green(sent + ' sent')}${failed ? chalk.red('  ' + failed + ' failed') : ''}`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

module.exports = cmd;
