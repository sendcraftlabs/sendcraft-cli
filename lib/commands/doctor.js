/**
 * sendcraft doctor
 * Diagnoses the CLI configuration and API connectivity.
 */
const { Command } = require('commander');
const chalk = require('chalk');
const { load, getApiKey, getBaseUrl, getWebUrl, CONFIG_FILE } = require('../config');
const client = require('../client');
const { spinner } = require('../output');

const cmd = new Command('doctor')
  .description('Check your CLI setup, API key, and connectivity')
  .action(async () => {
    console.log('\n' + chalk.bold('  SendCraft Doctor') + chalk.dim(' — diagnosing your setup\n'));

    const checks = [];

    // 1. Config file
    const cfg = load();
    checks.push({
      name: 'Config file',
      ok: true,
      detail: chalk.dim(CONFIG_FILE),
    });

    // 2. API key
    const apiKey = getApiKey();
    checks.push({
      name: 'API key',
      ok: !!apiKey,
      detail: apiKey
        ? chalk.dim(apiKey.slice(0, 8) + '••••••••')
        : chalk.red('Not set — run: sendcraft config init'),
    });

    // 3. Base URL
    const baseUrl = getBaseUrl();
    checks.push({
      name: 'API base URL',
      ok: true,
      detail: chalk.cyan(baseUrl),
    });

    // 4. Connectivity
    const sp = spinner('Checking API connectivity…').start();
    let stats = null;
    try {
      const res = await client.get('/public/stats');
      sp.stop();
      checks.push({ name: 'API reachable', ok: true, detail: chalk.dim(baseUrl) });
      stats = res;
    } catch (e) {
      sp.stop();
      const detail = e.response
        ? chalk.red(`HTTP ${e.response.status} from ${baseUrl}`)
        : chalk.red(`Cannot connect — ${e.message}`);
      checks.push({ name: 'API reachable', ok: false, detail });
    }

    // 5. Auth check (if key set)
    if (apiKey) {
      const sp2 = spinner('Verifying API key…').start();
      try {
        await client.get('/auth/me');
        sp2.stop();
        checks.push({ name: 'API key valid', ok: true });
      } catch (e) {
        sp2.stop();
        const isAuth = e.response?.status === 401 || e.response?.status === 403;
        checks.push({
          name: 'API key valid',
          ok: false,
          detail: isAuth
            ? chalk.red('Invalid or revoked — run: sendcraft login')
            : chalk.yellow('Could not verify (API unreachable)'),
        });
      }
    }

    // 6. Stats check
    if (stats) {
      const emailsSent = stats.totalEmails ?? stats.emailsSent ?? null;
      checks.push({
        name: 'Platform stats',
        ok: true,
        detail: emailsSent != null ? chalk.dim(`${emailsSent.toLocaleString()} emails sent on platform`) : chalk.dim('Live'),
      });
    }

    // Print results
    console.log();
    for (const c of checks) {
      const icon = c.ok ? chalk.green('  ✓') : chalk.red('  ✗');
      const name = chalk.bold((c.name + ' ').padEnd(22, '·'));
      const detail = c.detail ? '  ' + c.detail : '';
      console.log(`${icon}  ${name}${detail}`);
    }

    const failed = checks.filter(c => !c.ok);
    console.log();
    if (failed.length === 0) {
      console.log(chalk.green('  ✓ Everything looks good!') + chalk.dim('  Run sendcraft --help for commands.\n'));
    } else {
      console.log(chalk.red(`  ✗ ${failed.length} issue(s) found.`) + '  Fix the items above and re-run ' + chalk.cyan('sendcraft doctor') + '\n');
      process.exit(1);
    }
  });

module.exports = cmd;
