const { Command } = require('commander');
const prompts = require('prompts');
const chalk = require('chalk');
const ora = require('ora');
const { load, save, getApiKey, getBaseUrl, CONFIG_FILE } = require('../config');
const { success, error, info } = require('../output');
const { sendcraftGradient } = require('../banner');

const cmd = new Command('config')
  .description('Configure your SendCraft credentials');

cmd
  .command('set-key <apiKey>')
  .description('Save your API key')
  .action((apiKey) => {
    const sp = ora({ text: 'Saving…', spinner: 'dots', color: 'cyan' }).start();
    const cfg = load();
    cfg.api_key = apiKey;
    save(cfg);
    sp.succeed(chalk.dim('Saved'));
    success(`API key stored at ${chalk.dim(CONFIG_FILE)}`);
  });

cmd
  .command('set-url <url>')
  .description('Override the API base URL')
  .action((url) => {
    const cfg = load();
    cfg.base_url = url;
    save(cfg);
    success(`Base URL updated: ${chalk.cyan(url)}`);
  });

cmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const key = getApiKey();
    const url = getBaseUrl();
    if (!key) {
      error('No API key set. Run: ' + chalk.cyan('sendcraft config set-key <key>'));
      info('Or set the ' + chalk.bold('SENDCRAFT_API_KEY') + ' environment variable.');
      return;
    }
    const masked = key.length > 12 ? key.slice(0, 8) + '…' + key.slice(-4) : '***';
    console.log('\n' + chalk.bold('  API Key:  ') + chalk.green(masked));
    console.log(chalk.bold('  Base URL: ') + chalk.cyan(url));
    console.log(chalk.bold('  Config:   ') + chalk.dim(CONFIG_FILE) + '\n');
  });

cmd
  .command('init')
  .description('Interactive first-time setup')
  .action(async () => {
    console.log('\n' + sendcraftGradient('  ✦ SendCraft Setup\n'));

    const answers = await prompts([
      {
        type: 'password',
        name: 'api_key',
        message: 'Paste your API key',
        validate: v => (v && v.length > 10) ? true : 'Enter a valid API key',
      },
      {
        type: 'text',
        name: 'base_url',
        message: 'API base URL',
        initial: 'https://api.sendcraft.online/api',
      },
    ], { onCancel: () => { error('Cancelled.'); process.exit(0); } });

    const sp = ora({ text: 'Saving config…', spinner: 'dots2', color: 'cyan' }).start();
    save(answers);
    sp.succeed(chalk.dim('Config saved'));
    success(`Ready! Run ${chalk.cyan('sendcraft send --help')} to get started.`);
  });

module.exports = cmd;
