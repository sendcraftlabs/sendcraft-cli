'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { getBaseUrl } = require('../lib/config');
const { sectionTitle } = require('../lib/logo');

module.exports = new Command('mcp')
  .description('Show MCP server configuration for AI assistants')
  .option('--json', 'Output as JSON (for Claude Desktop config)')
  .action((opts) => {
    const baseUrl = getBaseUrl();

    const config = {
      mcpServers: {
        sendcraft: {
          command: 'npx',
          args: ['-y', 'sendcraft-mcp'],
          env: {
            SENDCRAFT_API_KEY: '<your-api-key>',
            SENDCRAFT_BASE_URL: baseUrl,
          },
        },
      },
    };

    if (opts.json) {
      console.log(JSON.stringify(config, null, 2));
      return;
    }

    const w = Math.min((process.stdout.columns || 80) - 2, 68);
    const line = chalk.hex('#6366f1')('─'.repeat(w));

    console.log('\n  ' + line);
    console.log(sectionTitle('MCP Server'));
    console.log('  ' + chalk.dim('Connect SendCraft to Claude Desktop and other AI agents'));
    console.log('  ' + line + '\n');

    console.log('  Add this to your ' + chalk.bold('claude_desktop_config.json') + ':\n');

    const snippet = JSON.stringify(config, null, 2)
      .split('\n')
      .map(l => '  ' + chalk.dim(l))
      .join('\n')
      .replace(/"sendcraft"/, chalk.hex('#8b5cf6').bold('"sendcraft"'))
      .replace(/"<your-api-key>"/, chalk.yellow('"<your-api-key>"'))
      .replace(/("SENDCRAFT_BASE_URL": ")([^"]+)(")/, `$1${chalk.hex('#06b6d4')(baseUrl)}$3`);

    console.log(snippet);
    console.log();
    console.log('  ' + chalk.dim('Config file locations:'));
    console.log('  ' + chalk.dim('  macOS:   ~/Library/Application Support/Claude/claude_desktop_config.json'));
    console.log('  ' + chalk.dim('  Windows: %APPDATA%\\Claude\\claude_desktop_config.json'));
    console.log();
    console.log('  ' + chalk.hex('#8b5cf6')('›') + '  ' + chalk.dim('Docs: ') + chalk.hex('#06b6d4')('https://sendcraft.online/docs/mcp'));
    console.log('\n  ' + line + '\n');
  });
