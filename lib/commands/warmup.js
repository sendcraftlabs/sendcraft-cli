const { Command } = require('commander');
const chalk = require('chalk');
const _grad = require('gradient-string'); const gradient = _grad.default || _grad;
const client = require('../client');
const { table, json, error, spinner } = require('../output');

const cmd = new Command('warmup').description('View SMTP IP warmup status');

cmd
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Checking warmup status…').start();
    try {
      const data = await client.get('/smtp/warmup');
      sp.succeed(chalk.dim('Done'));

      if (opts.json) return json(data);

      console.log();

      if (data.isWarmedUp) {
        const g = gradient(['#10b981', '#3b82f6']);
        console.log(g.multiline(
          '  ██╗    ██╗ █████╗ ██████╗ ███╗   ███╗███████╗██████╗ \n' +
          '  ██║    ██║██╔══██╗██╔══██╗████╗ ████║██╔════╝██╔══██╗\n' +
          '  ██║ █╗ ██║███████║██████╔╝██╔████╔██║█████╗  ██║  ██║\n' +
          '  ██║███╗██║██╔══██║██╔══██╗██║╚██╔╝██║██╔══╝  ██║  ██║\n' +
          '  ╚███╔███╔╝██║  ██║██║  ██║██║ ╚═╝ ██║███████╗██████╔╝\n' +
          '   ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═════╝ '
        ));
        console.log('  ' + chalk.green.bold('✓ IP fully warmed up — no daily limits!\n'));
      } else {
        const pct = data.percentComplete || 0;
        const bar = buildAnimatedBar(data.todayCount, data.dailyLimit, 30);
        console.log(`  ${chalk.bold.magenta('Warmup Day ' + data.warmupDay)}`);
        console.log(`  ${bar}  ${chalk.cyan(data.todayCount)}${chalk.dim('/' + data.dailyLimit)} sent today`);
        console.log(`  ${chalk.dim(pct + '% of warmup complete')}\n`);
      }

      table(
        ['Field', 'Value'],
        [
          ['Warmup Day',      chalk.bold(data.warmupDay)],
          ['Daily Limit',     data.isWarmedUp ? chalk.green('∞ Unlimited') : chalk.yellow(String(data.dailyLimit))],
          ['Sent Today',      chalk.cyan(String(data.todayCount))],
          ['Remaining Today', data.isWarmedUp ? '∞' : chalk.green(String(data.remainingToday))],
          ['Fully Warmed Up', data.isWarmedUp ? chalk.green('Yes ✓') : chalk.yellow('No')],
          ['Progress',        (data.percentComplete ?? 0) + '%'],
        ]
      );
    } catch (err) {
      sp.fail(chalk.red('Failed to fetch warmup status'));
      error(err.message);
      process.exit(1);
    }
  });

function buildAnimatedBar(count, limit, width) {
  if (!limit) return '';
  const ratio = Math.min(count / limit, 1);
  const filled = Math.round(ratio * width);
  const empty  = width - filled;

  // Gradient bar: green→yellow→red based on fill level
  let barColor;
  if (ratio < 0.5)       barColor = chalk.green;
  else if (ratio < 0.85) barColor = chalk.yellow;
  else                   barColor = chalk.red;

  return chalk.dim('[') + barColor('█'.repeat(filled)) + chalk.dim('░'.repeat(empty)) + chalk.dim(']');
}

module.exports = cmd;
