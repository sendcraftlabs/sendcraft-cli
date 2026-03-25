'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const { post } = require('../../lib/client');
const { success, error } = require('../../lib/output');

module.exports = new Command('create')
  .description('Create a new API key')
  .requiredOption('-n, --name <name>', 'Key name / label')
  .option('--scope <scope>', 'Permission scope: full_access | sending_access', 'full_access')
  .option('--domains <domains...>', 'Allowed sender domains (for sending_access scope)')
  .option('--expires <date>', 'Expiry date (ISO 8601 or natural language)')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const VALID_SCOPES = ['full_access', 'sending_access'];
      if (!VALID_SCOPES.includes(opts.scope)) {
        error(`Invalid scope "${opts.scope}". Must be: ${VALID_SCOPES.join(' | ')}`); process.exit(1);
      }

      let expiresAt = null;
      if (opts.expires) {
        try {
          const chrono = require('chrono-node');
          const parsed = chrono.parseDate(opts.expires);
          expiresAt = parsed ? parsed.toISOString() : new Date(opts.expires).toISOString();
        } catch {
          expiresAt = new Date(opts.expires).toISOString();
        }
      }

      const body = {
        name: opts.name,
        permissions: opts.scope,
        ...(opts.domains ? { allowedDomains: opts.domains } : {}),
        ...(expiresAt ? { expiresAt } : {}),
      };

      const res = await post('/user/api-keys', body);
      const key = res.data?.key || res.key || res.apiKey || '';
      const id  = res.data?.id  || res.id  || res._id  || '';

      if (opts.json) return console.log(JSON.stringify(res, null, 2));

      success(`API key created  ${id}`);
      if (key) {
        console.log('\n  ' + chalk.bold('Key:  ') + chalk.green(key));
        console.log('  ' + chalk.yellow('⚠  Copy this key — it will not be shown again.') + '\n');
      }
    } catch (err) {
      error(err.message); process.exit(1);
    }
  });
