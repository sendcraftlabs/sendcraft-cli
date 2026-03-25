'use strict';
const { Command } = require('commander');
const prompts = require('prompts');
const chalk = require('chalk');
const { save } = require('../../lib/config');
const { success, error, spinner } = require('../../lib/output');
const { primary } = require('../../lib/logo');

module.exports = new Command('init')
  .description('Interactive first-time setup')
  .action(async () => {
    console.log('\n' + primary('  ✦ SendCraft Setup\n'));
    const answers = await prompts([
      { type: 'password', name: 'api_key',  message: 'API key', validate: v => (v?.length > 10) || 'Invalid key' },
      { type: 'text', name: 'base_url', message: 'API base URL', initial: 'https://api.sendcraft.online/api',
        validate: v => { try { const u = new URL(v); return (u.protocol === 'https:' || u.protocol === 'http:') || 'Must be http or https'; } catch { return 'Invalid URL'; } } },
    ], { onCancel: () => { error('Cancelled.'); process.exit(0); } });
    if (answers.base_url && new URL(answers.base_url).protocol === 'http:')
      console.warn(chalk.yellow('  ⚠  Warning: using http:// sends credentials in plaintext.'));
    const sp = spinner('Saving…').start();
    save({ api_key: answers.api_key, base_url: answers.base_url.replace(/\/$/, '') });
    sp.succeed(chalk.dim('Saved'));
    success(`Ready! Run ${chalk.cyan('sendcraft doctor')} to verify.`);
  });
