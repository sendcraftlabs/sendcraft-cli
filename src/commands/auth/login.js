'use strict';
const { Command } = require('commander');
const prompts = require('prompts');
const chalk = require('chalk');
const { load, save, getWebUrl, CONFIG_FILE } = require('../../lib/config');
const client = require('../../lib/client');
const { success, error, info, warn, spinner } = require('../../lib/output');
const { primary } = require('../../lib/logo');

function openBrowser(url) {
  const { execFileSync } = require('child_process');
  try {
    if (process.platform === 'darwin')     execFileSync('open',     [url],              { stdio: 'ignore' });
    else if (process.platform === 'win32') execFileSync('cmd',      ['/c', 'start', '', url], { stdio: 'ignore' });
    else                                   execFileSync('xdg-open', [url],              { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

async function browserFlow() {
  const webBase = getWebUrl();
  let parsedScheme;
  try { parsedScheme = new URL(webBase).protocol; } catch { parsedScheme = 'https:'; }
  if (parsedScheme !== 'https:' && parsedScheme !== 'http:') {
    warn('Unexpected URL scheme in config — defaulting to sendcraft.online');
  }
  const url = `${webBase}/dashboard/settings`;
  console.log('\n' + primary('  ✦ Login\n'));
  info(`Opening: ${chalk.cyan(url)}`);
  console.log(chalk.dim('  Copy an API key from the API Keys tab and paste it below.\n'));
  if (!openBrowser(url)) warn(`Couldn't open browser — visit: ${chalk.cyan(url)}`);

  const { apiKey } = await prompts({
    type: 'password', name: 'apiKey', message: 'Paste your API key',
    validate: v => (v && v.length > 10) ? true : 'Enter a valid API key',
  }, { onCancel: () => { error('Cancelled.'); process.exit(0); } });
  if (!apiKey) return;

  const sp = spinner('Verifying…').start();
  try {
    const cfg = load(); cfg.api_key = apiKey; save(cfg);
    await client.get('/auth/me');
    sp.succeed(chalk.dim('Verified'));
    success(`Logged in!  ${chalk.dim(CONFIG_FILE)}`);
  } catch (e) {
    const cfg = load(); if (cfg.api_key === apiKey) delete cfg.api_key; save(cfg);
    sp.fail(chalk.red('Invalid key')); error(e.message);
  }
}

async function apiFlow() {
  console.log('\n' + primary('  ✦ Sign In\n'));
  const answers = await prompts([
    { type: 'text',     name: 'email',    message: 'Email',    validate: v => v?.includes('@') || 'Enter a valid email' },
    { type: 'password', name: 'password', message: 'Password', validate: v => (v?.length >= 4) || 'Enter your password' },
  ], { onCancel: () => { error('Cancelled.'); process.exit(0); } });
  if (!answers.email || !answers.password) return;

  const sp = spinner('Signing in…').start();
  let token, name;
  try {
    const res = await client.postNoAuth('/auth/login', { email: answers.email, password: answers.password });
    token = res.token; name = res.user?.name || answers.email;
    sp.succeed(chalk.dim('Authenticated'));
  } catch (e) {
    sp.fail(chalk.red('Failed'));
    error(e.message === 'Invalid credentials' ? 'Wrong email or password.' : e.message);
    return;
  }

  const sp2 = spinner('Creating CLI API key…').start();
  try {
    const res = await client.postWithToken('/user/keys', { name: 'CLI', permissions: 'full_access' }, token);
    const apiKey = res.apiKey?.key || res.key?.key;
    if (!apiKey) throw new Error('No key returned');
    sp2.succeed(chalk.dim('Key created'));
    const cfg = load(); cfg.api_key = apiKey; save(cfg);
    console.log('\n  ' + chalk.green.bold(`Welcome, ${name}!`));
    success(`Logged in!  ${chalk.dim(CONFIG_FILE)}`);
    info(`Run ${chalk.cyan('sendcraft doctor')} to verify your setup.`);
  } catch (e) {
    sp2.fail(chalk.red('Could not create API key')); error(e.message);
    info(`Create one at ${chalk.cyan(getWebUrl() + '/dashboard/settings')}`);
  }
}

const cmd = new Command('login')
  .description('Log in to SendCraft and save your API key')
  .option('--browser', 'Open dashboard to copy an API key')
  .option('--api',     'Sign in with email + password')
  .action(async (opts) => {
    if (opts.browser) return browserFlow();
    if (opts.api)     return apiFlow();
    // Default: prompt
    const { method } = await prompts({
      type: 'select', name: 'method', message: 'How would you like to log in?',
      choices: [
        { title: 'Browser  ' + chalk.dim('— open dashboard, copy your API key'), value: 'browser' },
        { title: 'API key  ' + chalk.dim('— paste an existing key'),             value: 'key' },
        { title: 'Password ' + chalk.dim('— sign in with email + password'),     value: 'api' },
      ],
    }, { onCancel: () => process.exit(0) });
    if (method === 'browser') return browserFlow();
    if (method === 'api')     return apiFlow();
    // key flow
    const { apiKey } = await prompts({
      type: 'password', name: 'apiKey', message: 'Paste your API key',
      validate: v => (v?.length > 10) || 'Invalid key',
    });
    if (!apiKey) return;
    const cfg = load(); cfg.api_key = apiKey; save(cfg);
    success(`API key saved.  ${chalk.dim(CONFIG_FILE)}`);
  });

module.exports = cmd;
