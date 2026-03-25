const { Command } = require('commander');
const chalk = require('chalk');
const _grad2 = require('gradient-string'); const gradient = _grad2.default || _grad2;
const _boxen = require('boxen'); const boxen = _boxen.default || _boxen;
const { success, info } = require('../output');
const { getWebUrl } = require('../config');

const cmd = new Command('mcp').description('MCP (Model Context Protocol) server setup for AI agents');

cmd
  .command('info')
  .description('Show how to configure the SendCraft MCP server in Claude / Cursor / etc.')
  .action(() => {
    console.log('\n' + gradient(['#6366f1', '#8b5cf6', '#ec4899'])('  ✦ SendCraft MCP Server') + '\n');

    const apiKey = process.env.SENDCRAFT_API_KEY || '<your-api-key>';

    const claudeConfig = JSON.stringify({
      mcpServers: {
        sendcraft: {
          command: 'npx',
          args: ['sendcraft-mcp'],
          env: {
            SENDCRAFT_API_KEY: apiKey,
          },
        },
      },
    }, null, 2);

    console.log(chalk.bold('  1. Install the MCP server:'));
    console.log(`     ${chalk.cyan('npm install -g sendcraft-mcp')}\n`);

    console.log(chalk.bold('  2. Add to Claude Desktop config') + chalk.dim(' (~/Library/Application Support/Claude/claude_desktop_config.json):'));
    console.log(boxen(claudeConfig, {
      padding: 1,
      margin: { left: 4 },
      borderStyle: 'round',
      borderColor: 'cyan',
    }));

    console.log(chalk.bold('  3. Available MCP tools:'));
    const tools = [
      ['sendcraft_send_email',            'Send a transactional email'],
      ['sendcraft_schedule_email',        'Schedule an email for later'],
      ['sendcraft_cancel_scheduled_email','Cancel a scheduled email'],
      ['sendcraft_batch_send',            'Send up to 100 emails at once'],
      ['sendcraft_get_email',             'Get delivery status of an email'],
      ['sendcraft_list_emails',           'List sent emails'],
      ['sendcraft_get_stats',             'Get email statistics'],
      ['sendcraft_list_campaigns',        'List campaigns'],
      ['sendcraft_create_campaign',       'Create a new campaign'],
      ['sendcraft_send_campaign',         'Send or schedule a campaign'],
      ['sendcraft_get_campaign_analytics','Campaign opens, clicks, heatmap'],
      ['sendcraft_list_subscribers',      'List subscribers'],
      ['sendcraft_add_subscriber',        'Add a new subscriber'],
      ['sendcraft_unsubscribe',           'Unsubscribe a contact'],
      ['sendcraft_list_templates',        'List email templates'],
      ['sendcraft_create_template',       'Save a reusable template'],
      ['sendcraft_list_domains',          'List verified sender domains'],
      ['sendcraft_add_domain',            'Add a new sender domain'],
      ['sendcraft_verify_domain',         'Check DNS records for a domain'],
      ['sendcraft_analyze_dmarc',         'Analyze DMARC record health'],
      ['sendcraft_list_segments',         'List subscriber segments'],
      ['sendcraft_list_topics',           'List email topics/categories'],
      ['sendcraft_get_subscriber_topics', 'Get subscriber topic preferences'],
      ['sendcraft_get_send_time',         'AI best day/hour to send campaigns'],
      ['sendcraft_get_warmup_status',     'SMTP warmup day and daily quota'],
      ['sendcraft_list_api_keys',         'List API keys'],
    ];
    tools.forEach(([name, desc]) => {
      console.log(`     ${chalk.green('•')} ${chalk.cyan(name)} ${chalk.dim('— ' + desc)}`);
    });
    console.log();
    info(`Docs: ${chalk.underline(getWebUrl() + '/docs')}`);
  });

cmd
  .command('install')
  .description('Install the sendcraft-mcp package globally')
  .action(() => {
    const { execSync } = require('child_process');
    const ora = require('ora');
    const sp = ora({ text: 'Installing sendcraft-mcp…', spinner: 'dots', color: 'cyan' }).start();
    try {
      execSync('npm install -g sendcraft-mcp', { stdio: 'pipe' });
      sp.succeed(chalk.dim('Installed'));
      success('sendcraft-mcp installed! Run ' + chalk.cyan('sendcraft mcp info') + ' for config instructions.');
    } catch (e) {
      sp.fail(chalk.red('Install failed'));
      console.error(e.stderr?.toString() || e.message);
      process.exit(1);
    }
  });

module.exports = cmd;
