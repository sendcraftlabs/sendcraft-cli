const { Command } = require('commander');
const chalk = require('chalk');
const _grad = require('gradient-string'); const gradient = _grad.default || _grad;
const client = require('../client');
const { table, json, colorStatus, info, success, error, spinner } = require('../output');

const cmd = new Command('domains').description('Manage sender domains');

cmd
  .command('list')
  .description('List all domains')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Fetching domains…').start();
    try {
      const data = await client.get('/domains');
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const domains = data.domains || [];
      if (!domains.length) return info('No domains added yet. Run: ' + chalk.cyan('sendcraft domains add <domain>'));
      table(
        ['Domain', 'Status', 'SPF', 'DKIM', 'DMARC', 'Added'],
        domains.map(d => [
          chalk.bold(d.domain),
          colorStatus(d.status),
          d.spfVerified  ? chalk.green('✓') : chalk.red('✗'),
          d.dkimVerified ? chalk.green('✓') : chalk.red('✗'),
          d.dmarcVerified? chalk.green('✓') : chalk.red('✗'),
          d.createdAt ? chalk.dim(new Date(d.createdAt).toLocaleDateString()) : '—',
        ])
      );
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('add <domain>')
  .description('Add a new sender domain')
  .option('--json', 'Output raw JSON')
  .action(async (domain, opts) => {
    const sp = spinner(`Adding ${chalk.cyan(domain)}…`).start();
    try {
      const data = await client.post('/domains', { domain });
      sp.succeed(chalk.dim('Domain added'));
      if (opts.json) return json(data);
      success(`${chalk.bold(domain)} added.`);
      console.log('\n' + gradient(['#6366f1', '#ec4899'])('  ─── DNS Records to Configure ───') + '\n');
      (data.dnsRecords || []).forEach(r => {
        const verified = r.verified ? chalk.green(' ✓') : '';
        const optional = r.optional ? chalk.dim(' (optional)') : '';
        console.log(`  ${chalk.bold.cyan(r.purpose)}${optional}${verified}`);
        console.log(`    ${chalk.dim('Type:')}  ${r.type}`);
        console.log(`    ${chalk.dim('Name:')}  ${r.name}`);
        console.log(`    ${chalk.dim('Value:')} ${chalk.white(r.value)}\n`);
      });
      info(`Run ${chalk.cyan(`sendcraft domains verify <id>`)} after DNS propagates.`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('verify <domainId>')
  .description('Trigger a DNS verification check')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    const sp = spinner('Checking DNS records…').start();
    try {
      const data = await client.post(`/domains/${id}/verify`);
      if (data.verified) {
        sp.succeed(gradient(['#10b981', '#3b82f6'])('All records verified!'));
      } else {
        sp.warn(chalk.yellow('Some records still pending'));
      }
      if (opts.json) return json(data);
      const r = data.results || {};
      table(
        ['Record', 'Status'],
        [
          ['SPF',   r.spf   ? chalk.green('✓ Verified') : chalk.red('✗ Not found')],
          ['DKIM',  r.dkim  ? chalk.green('✓ Verified') : chalk.red('✗ Not found')],
          ['DMARC', r.dmarc ? chalk.green('✓ Verified') : chalk.red('✗ Not found')],
        ]
      );
      if (data.verified) success('Domain is ready to send email!');
      else info(data.message || 'DNS changes can take up to 48 hours to propagate.');
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('records <domainId>')
  .description('Show DNS records to configure')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    const sp = spinner('Loading DNS records…').start();
    try {
      const data = await client.get(`/domains/${id}`);
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data.dnsRecords);
      console.log('\n' + gradient(['#6366f1', '#ec4899'])('  ─── DNS Records ───') + '\n');
      (data.dnsRecords || []).forEach(r => {
        const status   = r.verified ? chalk.green('✓ verified') : chalk.yellow('⏳ pending');
        const optional = r.optional ? chalk.dim(' (optional)') : '';
        console.log(`  ${chalk.bold.cyan(r.purpose)}${optional}  ${status}`);
        console.log(`    ${chalk.dim('Type:')}  ${r.type}`);
        console.log(`    ${chalk.dim('Name:')}  ${r.name}`);
        console.log(`    ${chalk.dim('Value:')} ${chalk.white(r.value)}\n`);
      });
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

module.exports = cmd;
