const { Command } = require('commander');
const chalk = require('chalk');
const _grad = require('gradient-string'); const gradient = _grad.default || _grad;
const client = require('../client');
const { table, json, info, success, error, spinner } = require('../output');

const cmd = new Command('keys').description('Manage API keys');

cmd
  .command('list')
  .description('List all API keys')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Fetching API keys…').start();
    try {
      const data = await client.get('/user/keys');
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const keys = data.keys || [];
      if (!keys.length) return info('No API keys. Run: ' + chalk.cyan('sendcraft keys create <name>'));
      table(
        ['ID', 'Name', 'Key', 'Permissions', 'Last Used', 'Created'],
        keys.map(k => [
          chalk.dim(String(k._id).slice(-8)),
          chalk.bold(k.name),
          chalk.dim(k.maskedKey || '***'),
          k.permissions === 'full_access' ? chalk.green('full_access') : chalk.yellow('sending_access'),
          k.lastUsedAt ? chalk.dim(new Date(k.lastUsedAt).toLocaleDateString()) : chalk.dim('Never'),
          k.createdAt  ? chalk.dim(new Date(k.createdAt).toLocaleDateString())  : '—',
        ])
      );
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('create <name>')
  .description('Create a new API key')
  .option('--permissions <type>', 'full_access (default) or sending_access', 'full_access')
  .option('--domains <list>', 'Comma-separated allowed sender domains')
  .option('--json', 'Output raw JSON')
  .action(async (name, opts) => {
    const sp = spinner(`Creating key "${chalk.cyan(name)}"…`).start();
    try {
      const body = {
        name,
        permissions: opts.permissions,
        allowedDomains: opts.domains ? opts.domains.split(',').map(d => d.trim()) : undefined,
      };
      const data = await client.post('/user/keys', body);
      sp.succeed(chalk.dim('Created'));
      if (opts.json) return json(data);

      const key = data.key;
      console.log('\n' + gradient(['#6366f1', '#10b981'])('  ─── New API Key ───') + '\n');
      console.log(`  ${chalk.bold('Name:')}        ${chalk.cyan(key.name)}`);
      console.log(`  ${chalk.bold('Permissions:')} ${key.permissions === 'full_access' ? chalk.green('full_access') : chalk.yellow('sending_access')}`);
      if (key.allowedDomains?.length) {
        console.log(`  ${chalk.bold('Domains:')}     ${key.allowedDomains.join(', ')}`);
      }
      console.log(`\n  ${chalk.bold.yellow('Key (save this — shown once only):')}`);
      console.log(`  ${chalk.bgBlack.green.bold(' ' + (key.key || '—') + ' ')}\n`);

      success('Store this key securely. It cannot be retrieved again.');
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('revoke <keyId>')
  .description('Permanently revoke an API key')
  .option('--json', 'Output raw JSON')
  .action(async (keyId, opts) => {
    const sp = spinner(`Revoking key ${chalk.dim(keyId.slice(-8))}…`).start();
    try {
      const data = await client.delete(`/user/keys/${keyId}`);
      sp.succeed(chalk.dim('Revoked'));
      if (opts.json) return json(data);
      success(`Key ${chalk.dim(keyId)} permanently revoked.`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

module.exports = cmd;
