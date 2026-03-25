/**
 * sendcraft analytics
 * View email stats, top campaigns, and AI send-time recommendation.
 */
const { Command } = require('commander');
const chalk = require('chalk');
const client = require('../client');
const { table, json, info, error, spinner } = require('../output');

const cmd = new Command('analytics').description('View email analytics and performance stats');

cmd
  .command('overview')
  .alias('stats')
  .description('Show overall email performance stats')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Loading analytics…').start();
    try {
      const [overview, sendTime] = await Promise.allSettled([
        client.get('/analytics/overview'),
        client.get('/analytics/send-time'),
      ]);
      sp.succeed(chalk.dim('Loaded'));

      const o = overview.status === 'fulfilled' ? (overview.value.analytics || overview.value) : null;
      const st = sendTime.status === 'fulfilled' ? sendTime.value : null;

      if (opts.json) return json({ overview: o, sendTime: st });

      if (!o) return error('Could not load analytics');

      const openRate  = parseFloat(o.openRate)  || 0;
      const clickRate = parseFloat(o.clickRate) || 0;
      const bounceRate = o.totalEmails > 0 ? ((o.totalBounced / o.totalEmails) * 100) : 0;

      const rateColor = (r) => r >= 20 ? chalk.green : r >= 10 ? chalk.yellow : chalk.red;

      table(
        ['Metric', 'Value', 'Count'],
        [
          ['Total Sent',   chalk.bold(o.totalEmails?.toLocaleString() ?? '—'), ''],
          ['Open Rate',    rateColor(openRate)(`${openRate.toFixed(1)}%`),     chalk.dim(`${o.totalOpened?.toLocaleString()} opens`)],
          ['Click Rate',   rateColor(clickRate)(`${clickRate.toFixed(1)}%`),   chalk.dim(`${o.totalClicked?.toLocaleString()} clicks`)],
          ['Bounce Rate',  bounceRate > 5 ? chalk.red(`${bounceRate.toFixed(1)}%`) : chalk.green(`${bounceRate.toFixed(1)}%`), chalk.dim(`${o.totalBounced?.toLocaleString()} bounces`)],
          ['Total Cost',   chalk.dim(`$${(o.totalCost || 0).toFixed(2)}`), ''],
        ]
      );

      if (bounceRate > 5) {
        console.log(chalk.red('  ⚠  Bounce rate above 5% — check your suppression list.'));
      }

      if (st?.recommendation) {
        const r = st.recommendation;
        console.log(
          '\n  ' + chalk.bold('Best send time: ') +
          chalk.cyan(`${r.bestDay} at ${r.bestHour}:00 UTC`) +
          chalk.dim(` (${r.confidence} confidence)`)
        );
        console.log(chalk.dim(`  ${r.reasoning}\n`));
      }
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('campaigns')
  .description('Show top campaign performance')
  .option('-l, --limit <n>', 'Number of campaigns', '10')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Loading campaigns…').start();
    try {
      const data = await client.get(`/campaigns?limit=${opts.limit}&status=sent`);
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);

      const list = (data.campaigns || []).filter(c => c.status === 'sent');
      if (!list.length) return info('No sent campaigns yet.');

      table(
        ['Campaign', 'Sent', 'Open Rate', 'Click Rate', 'Date'],
        list.map(c => {
          const or = c.totalSent > 0 ? ((c.totalOpened / c.totalSent) * 100).toFixed(1) : '0';
          const cr = c.totalSent > 0 ? ((c.totalClicked / c.totalSent) * 100).toFixed(1) : '0';
          return [
            c.name.slice(0, 30),
            chalk.bold(String(c.totalSent)),
            parseFloat(or) >= 20 ? chalk.green(`${or}%`) : chalk.yellow(`${or}%`),
            parseFloat(cr) >= 3  ? chalk.green(`${cr}%`) : chalk.yellow(`${cr}%`),
            chalk.dim(new Date(c.createdAt).toLocaleDateString()),
          ];
        })
      );
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('send-time')
  .description('Show AI-powered best time to send emails')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Analysing open patterns…').start();
    try {
      const data = await client.get('/analytics/send-time');
      sp.succeed(chalk.dim('Done'));
      if (opts.json) return json(data);

      const r = data.recommendation;
      if (!r) {
        info('Not enough open data yet. Send more campaigns to unlock recommendations.');
        return;
      }

      console.log('\n  ' + chalk.bold('AI Send-Time Recommendation') + '\n');
      console.log(`  Best day:   ${chalk.cyan.bold(r.bestDay)}`);
      console.log(`  Best hour:  ${chalk.cyan.bold(r.bestHour + ':00 UTC')}`);
      console.log(`  Confidence: ${r.confidence === 'high' ? chalk.green(r.confidence) : r.confidence === 'medium' ? chalk.yellow(r.confidence) : chalk.dim(r.confidence)}`);
      console.log(`\n  ${chalk.dim(r.reasoning)}\n`);

      if (data.byDay?.length) {
        console.log('  ' + chalk.bold('Opens by day:'));
        const maxOpens = Math.max(...data.byDay.map(d => d.opens));
        data.byDay.forEach(d => {
          const bar = '█'.repeat(Math.round((d.opens / maxOpens) * 20));
          const isTop = d.day === r.bestDay;
          console.log(`  ${(d.day + '    ').slice(0, 10)} ${isTop ? chalk.cyan(bar) : chalk.dim(bar)} ${chalk.dim(d.opens)}`);
        });
        console.log();
      }
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

module.exports = cmd;
