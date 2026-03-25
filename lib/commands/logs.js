/**
 * sendcraft logs
 * View and tail real-time email delivery logs.
 */
const { Command } = require('commander');
const chalk = require('chalk');
const client = require('../client');
const { table, json, info, error, warn, spinner, colorStatus } = require('../output');

const cmd = new Command('logs').description('View email delivery logs');

cmd
  .command('list')
  .description('List recent email delivery logs')
  .option('-l, --limit <n>', 'Number of logs', '20')
  .option('-p, --page <n>',  'Page number', '1')
  .option('--status <s>',    'Filter by status (delivered, bounced, failed, opened, clicked)')
  .option('--json',          'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Fetching logs…').start();
    try {
      const params = new URLSearchParams({ limit: opts.limit, page: opts.page });
      if (opts.status) params.set('status', opts.status);
      const data = await client.get(`/logs?${params}`);
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);

      const logs = data.logs || [];
      if (!logs.length) return info('No logs found.');

      table(
        ['Time', 'To', 'Subject', 'Status', 'Provider'],
        logs.map(l => [
          chalk.dim(new Date(l.createdAt || l.sentAt).toLocaleTimeString()),
          chalk.cyan((l.toEmail || '').slice(0, 28)),
          (l.subject || '').slice(0, 35),
          colorStatus(l.status),
          chalk.dim(l.provider || l.messageId?.split('@')[1]?.slice(0, 10) || '—'),
        ])
      );
      info(`Page ${opts.page} · ${logs.length} of ${chalk.bold(data.total ?? '?')}`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('tail')
  .description('Live-tail delivery logs — polls every 3 seconds for new entries')
  .option('--interval <ms>', 'Poll interval in ms', '3000')
  .action(async (opts) => {
    const interval = parseInt(opts.interval, 10) || 3000;
    info(`Tailing logs (polling every ${interval / 1000}s) — press ${chalk.bold('Ctrl+C')} to stop\n`);

    const seen = new Set();
    let firstPoll = true;

    const poll = async () => {
      try {
        const data = await client.get('/logs?limit=20&page=1');
        const logs = (data.logs || []).reverse(); // oldest first

        for (const l of logs) {
          const id = l._id || l.messageId || JSON.stringify(l);
          if (seen.has(id)) continue;
          seen.add(id);

          if (firstPoll) continue; // skip initial batch — only show new ones after start

          const time    = chalk.dim(new Date(l.createdAt || l.sentAt).toLocaleTimeString());
          const status  = colorStatus(l.status);
          const to      = chalk.cyan((l.toEmail || '').slice(0, 30));
          const subject = chalk.dim((l.subject || '').slice(0, 40));
          console.log(`  ${time}  ${status.padEnd(20)}  ${to}  ${subject}`);
        }
        firstPoll = false;
      } catch (e) {
        warn(`Poll failed: ${e.message}`);
      }
    };

    await poll(); // seed seen set
    const id = setInterval(poll, interval);

    process.on('SIGINT', () => {
      clearInterval(id);
      console.log(chalk.dim('\n  Stopped.\n'));
      process.exit(0);
    });
  });

module.exports = cmd;
