'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { getApiKey, getBaseUrl } = require('../lib/config');
const { get } = require('../lib/client');
const { spinner } = require('../lib/output');
const { sectionTitle } = require('../lib/logo');

function pass(label, detail = '') {
  console.log('  ' + chalk.hex('#10b981').bold('✓') + '  ' + chalk.bold(label.padEnd(20)) + chalk.dim(detail));
}
function fail(label, hint = '') {
  console.log('  ' + chalk.hex('#ef4444').bold('✗') + '  ' + chalk.bold(label.padEnd(20)) + chalk.hex('#ef4444')(hint));
}
function warn(label, hint = '') {
  console.log('  ' + chalk.hex('#f59e0b').bold('○') + '  ' + chalk.bold(label.padEnd(20)) + chalk.dim(hint));
}

module.exports = new Command('doctor')
  .description('Check configuration and API connectivity')
  .action(async () => {
    const w = Math.min((process.stdout.columns || 80) - 2, 68);
    const line = chalk.hex('#6366f1')('─'.repeat(w));

    console.log('\n  ' + line);
    console.log(sectionTitle('Doctor'));
    console.log('  ' + chalk.dim('Checking your SendCraft setup…'));
    console.log('  ' + line + '\n');

    const key = getApiKey();
    const url = getBaseUrl();

    // 1. API key
    if (key) {
      pass('API key', key.slice(0, 4) + '…[redacted]');
    } else {
      fail('API key', 'Not set  →  run sendcraft auth login');
    }

    // 2. Base URL
    if (url) {
      pass('Base URL', url);
    } else {
      fail('Base URL', 'Not set');
    }

    if (!key) {
      console.log('\n  ' + line);
      console.log('\n  Run ' + chalk.hex('#8b5cf6').bold('sendcraft auth login') + ' to authenticate.\n');
      return;
    }

    // 3. API connectivity
    const sp = spinner('API ping').start();
    try {
      await get('/health');
      sp.stop();
      pass('API ping', url);
    } catch (e) {
      sp.stop();
      fail('API ping', e.message);
    }

    // 4. Auth check
    const sp2 = spinner('Auth check').start();
    let me;
    try {
      me = await get('/auth/me');
      sp2.stop();
      const name = me?.user?.name || me?.name || '';
      pass('Auth check', name ? `Authenticated as ${name}` : 'Valid');
    } catch (e) {
      sp2.stop();
      if (e.status === 401) {
        fail('Auth check', 'Unauthorized — run sendcraft auth login');
      } else {
        warn('Auth check', e.message);
      }
    }

    // 5. SMTP relay
    const sp3 = spinner('SMTP relay').start();
    try {
      const smtp = await get('/smtp/credentials');
      sp3.stop();
      if (smtp.relayEnabled) {
        pass('SMTP relay', `${smtp.smtp?.host || ''}:${smtp.smtp?.port || 2587}`);
      } else {
        warn('SMTP relay', 'Disabled  (set SMTP_RELAY_ENABLED=true to enable)');
      }
    } catch {
      sp3.stop();
      warn('SMTP relay', 'Unavailable');
    }

    // 6. Warmup status
    const sp4 = spinner('IP warmup').start();
    try {
      const w2 = await get('/smtp/warmup/status');
      sp4.stop();
      const s = w2.data || w2;
      if (s.isWarmedUp) {
        pass('IP warmup', 'Warmed up ✓');
      } else if (s.warmupDay) {
        pass('IP warmup', `Day ${s.warmupDay}/60  —  ${s.todaySent ?? 0}/${s.todayLimit ?? '-'} sent today`);
      } else {
        warn('IP warmup', 'Not started');
      }
    } catch {
      sp4.stop();
      warn('IP warmup', 'Unavailable (own SMTP not configured)');
    }

    console.log('\n  ' + line + '\n');
  });
