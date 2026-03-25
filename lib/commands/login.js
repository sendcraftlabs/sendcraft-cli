/**
 * sendcraft login
 *
 * Two flows:
 *   1. Browser — opens the dashboard settings page so the user can copy their API key
 *   2. Email + Password — calls /auth/login, then auto-creates a "CLI" API key
 *
 * URLs are derived from the configured base URL — no domains hardcoded.
 */
const { Command } = require('commander');
const prompts = require('prompts');
const chalk = require('chalk');
const { load, save, getWebUrl, CONFIG_FILE } = require('../config');
const client = require('../client');
const { success, error, info, warn, spinner } = require('../output');
const { sendcraftGradient } = require('../banner');

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Open a URL in the system's default browser (cross-platform). */
function openBrowser(url) {
  const { execSync } = require('child_process');
  try {
    const cmd =
      process.platform === 'darwin' ? `open "${url}"` :
      process.platform === 'win32'  ? `start "" "${url}"` :
      `xdg-open "${url}"`;
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// ─── browser flow ─────────────────────────────────────────────────────────────

async function browserFlow() {
  const webUrl = getWebUrl();
  const settingsUrl = `${webUrl}/dashboard/settings`;

  console.log('\n' + sendcraftGradient('  ✦ Browser Login\n'));
  info(`Opening dashboard: ${chalk.cyan(settingsUrl)}`);
  console.log(chalk.dim('  1. Open the API Keys tab'));
  console.log(chalk.dim('  2. Create or copy an existing key'));
  console.log(chalk.dim('  3. Paste it below\n'));

  const opened = openBrowser(settingsUrl);
  if (!opened) {
    warn('Could not open browser automatically.');
    console.log(`  Open manually: ${chalk.cyan(settingsUrl)}\n`);
  }

  const { apiKey } = await prompts(
    {
      type: 'password',
      name: 'apiKey',
      message: 'Paste your API key here',
      validate: (v) => (v && v.length > 10) ? true : 'Enter a valid API key',
    },
    { onCancel: () => { error('Cancelled.'); process.exit(0); } }
  );

  if (!apiKey) return;

  // Quick verify the key works
  const sp = spinner('Verifying key…').start();
  try {
    // Store temporarily to use the authenticated client
    const cfg = load();
    cfg.api_key = apiKey;
    save(cfg);

    await client.get('/auth/me');
    sp.succeed(chalk.dim('Verified'));
    success(`Logged in! Key stored at ${chalk.dim(CONFIG_FILE)}`);
  } catch (e) {
    // Restore old key if verification fails
    const cfg = load();
    if (cfg.api_key === apiKey) delete cfg.api_key;
    save(cfg);
    sp.fail(chalk.red('Invalid key'));
    error(e.message);
  }
}

// ─── email+password flow ───────────────────────────────────────────────────────

async function apiFlow() {
  console.log('\n' + sendcraftGradient('  ✦ Sign In\n'));

  const answers = await prompts(
    [
      {
        type: 'text',
        name: 'email',
        message: 'Email address',
        validate: (v) => v && v.includes('@') ? true : 'Enter a valid email',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password',
        validate: (v) => v && v.length >= 4 ? true : 'Enter your password',
      },
    ],
    { onCancel: () => { error('Cancelled.'); process.exit(0); } }
  );

  if (!answers.email || !answers.password) return;

  const sp = spinner('Signing in…').start();
  let token, userName;
  try {
    const result = await client.postNoAuth('/auth/login', {
      email: answers.email,
      password: answers.password,
    });
    token = result.token;
    userName = result.user?.name || answers.email;
    sp.succeed(chalk.dim('Authenticated'));
  } catch (e) {
    sp.fail(chalk.red('Login failed'));
    error(e.message === 'Invalid credentials'
      ? 'Wrong email or password. Try again.'
      : e.message);
    return;
  }

  // Auto-create a CLI API key using the JWT
  const sp2 = spinner('Creating CLI API key…').start();
  try {
    const result = await client.postWithToken('/user/keys', {
      name: 'CLI',
      permissions: 'full_access',
    }, token);

    const apiKey = result.apiKey?.key || result.key?.key;
    if (!apiKey) throw new Error('No key returned from server');

    sp2.succeed(chalk.dim('API key created'));

    const cfg = load();
    cfg.api_key = apiKey;
    save(cfg);

    console.log('\n  ' + chalk.bold.green(`Welcome, ${userName}!`));
    success(`Logged in! Key stored at ${chalk.dim(CONFIG_FILE)}`);
    console.log(
      '\n  ' + chalk.dim('Tip: run ') + chalk.cyan('sendcraft config show') +
      chalk.dim(' to confirm your setup.\n')
    );
  } catch (e) {
    sp2.fail(chalk.red('Could not create API key'));
    error(e.message);
    info(`You can create a key manually at ${chalk.cyan(getWebUrl() + '/dashboard/settings')}`);
  }
}

// ─── command ──────────────────────────────────────────────────────────────────

const cmd = new Command('login')
  .description('Log in to SendCraft and save your API key')
  .option('--browser', 'Open dashboard in browser to copy an API key')
  .option('--api',     'Log in with email and password via the API')
  .action(async (opts) => {
    if (opts.browser) return browserFlow();
    if (opts.api)     return apiFlow();
    return runInteractive();
  });

/** Exported so the interactive TUI can call it directly */
async function runInteractive() {
  console.log('\n' + sendcraftGradient('  ✦ SendCraft Login\n'));

  const { method } = await prompts(
    {
      type: 'select',
      name: 'method',
      message: 'How would you like to log in?',
      choices: [
        {
          title: '🌐  ' + chalk.bold('Browser') +
                 chalk.dim(' — open dashboard, copy your API key'),
          value: 'browser',
        },
        {
          title: '🔐  ' + chalk.bold('Email & Password') +
                 chalk.dim(' — sign in and auto-generate a CLI key'),
          value: 'api',
        },
        {
          title: chalk.dim('✕   Back'),
          value: 'cancel',
        },
      ],
    },
    { onCancel: () => null }
  );

  if (!method || method === 'cancel') return;
  if (method === 'browser') return browserFlow();
  if (method === 'api')     return apiFlow();
}

cmd.runInteractive = runInteractive;
module.exports = cmd;
