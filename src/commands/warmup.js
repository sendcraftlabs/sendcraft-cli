'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { get, post } = require('../lib/client');
const { success, error, kv } = require('../lib/output');
const { sectionTitle } = require('../lib/logo');

// Warmup schedule (days → daily limit)
const SCHEDULE = [
  [1, 50], [2, 100], [3, 250], [4, 500], [5, 1000],
  [7, 3500], [10, 7000], [14, 10000], [21, 25000],
  [30, 50000], [45, 100000], [60, Infinity],
];

function getDayLimit(day) {
  for (let i = SCHEDULE.length - 1; i >= 0; i--) {
    if (day >= SCHEDULE[i][0]) return SCHEDULE[i][1];
  }
  return SCHEDULE[0][1];
}

function progressBar(value, max, width = 30) {
  if (max === Infinity || max === 0) return chalk.hex('#10b981')('█'.repeat(width)) + ' ∞';
  const pct   = Math.min(value / max, 1);
  const filled = Math.round(pct * width);
  const empty  = width - filled;
  const color  = pct < 0.5 ? '#10b981' : pct < 0.85 ? '#f59e0b' : '#ef4444';
  return chalk.hex(color)('█'.repeat(filled)) + chalk.dim('░'.repeat(empty)) + ' ' + Math.round(pct * 100) + '%';
}

const cmd = new Command('warmup').description('Manage SMTP IP warmup schedule');

cmd.command('status')
  .description('Show current warmup progress')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const res = await get('/smtp/warmup/status');
      const s = res.data || res;

      if (opts.json) return console.log(JSON.stringify(s, null, 2));

      const w = Math.min((process.stdout.columns || 80) - 2, 68);
      const line = chalk.hex('#6366f1')('─'.repeat(w));

      console.log('\n  ' + line);
      console.log(sectionTitle('SMTP IP Warmup'));
      console.log('  ' + line + '\n');

      if (s.isWarmedUp) {
        console.log('  ' + chalk.hex('#10b981').bold('✓') + '  ' + chalk.bold('IP is fully warmed up') + '  ' + chalk.dim('No daily send limit'));
      } else {
        const day   = s.warmupDay ?? 1;
        const limit = getDayLimit(day);
        const sent  = s.todaySent ?? 0;
        const total = s.totalSent ?? 0;

        kv('Day',       `${day} / 60`);
        kv('Today sent', `${sent.toLocaleString()} / ${limit === Infinity ? '∞' : limit.toLocaleString()}`);
        kv('Total sent', total.toLocaleString());
        console.log();
        console.log('  Today:  ' + progressBar(sent, limit));

        // Overall warmup progress (day/60)
        const dayBar = progressBar(day, 60);
        console.log('  Total:  ' + dayBar);
      }

      console.log('\n  ' + line + '\n');

      // Schedule table hint
      if (!s.isWarmedUp) {
        console.log('  ' + chalk.dim('Next milestone:'));
        const day = s.warmupDay ?? 1;
        const next = SCHEDULE.find(([d]) => d > day);
        if (next) {
          console.log('  ' + chalk.dim(`  Day ${next[0]} → ${next[1].toLocaleString()} emails/day`));
        }
        console.log();
      }
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });

cmd.command('reset')
  .description('Reset IP warmup schedule to Day 1 (admin only)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (opts) => {
    try {
      if (!opts.yes) {
        const prompts = require('prompts');
        const { ok } = await prompts({ type: 'confirm', name: 'ok', message: 'Reset warmup to Day 1? This cannot be undone.', initial: false });
        if (!ok) { console.log(chalk.dim('  Aborted.')); return; }
      }
      await post('/smtp/warmup/reset', {});
      success('Warmup schedule reset to Day 1');
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });

module.exports = cmd;
