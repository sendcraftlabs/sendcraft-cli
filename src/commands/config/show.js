'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { getApiKey, getBaseUrl, CONFIG_FILE } = require('../../lib/config');
const { error, kv } = require('../../lib/output');
const { sectionTitle } = require('../../lib/logo');

module.exports = new Command('show')
  .description('Show current configuration')
  .action(() => {
    const key = getApiKey();
    const url = getBaseUrl();

    const w = Math.min((process.stdout.columns || 80) - 2, 68);
    const line = chalk.hex('#6366f1')('─'.repeat(w));

    console.log('\n  ' + line);
    console.log(sectionTitle('Config'));
    console.log('  ' + line + '\n');

    if (!key) {
      console.log('  ' + chalk.hex('#ef4444').bold('✗') + '  No API key set');
      console.log('  ' + chalk.dim('  Run: ') + chalk.hex('#8b5cf6').bold('sendcraft auth login'));
      console.log('  ' + chalk.dim('  Or set: ') + chalk.bold('SENDCRAFT_API_KEY'));
    } else {
      const masked = key.length > 12 ? key.slice(0, 8) + '…' + key.slice(-4) : '***';
      kv('API Key',  chalk.hex('#10b981')(masked));
    }

    kv('Base URL', chalk.hex('#06b6d4')(url));
    kv('Config',   chalk.dim(CONFIG_FILE));

    console.log('\n  ' + line + '\n');
  });
