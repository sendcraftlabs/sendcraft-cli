'use strict';
const { Command } = require('commander');
const chalk = require('chalk');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { getApiKey, getBaseUrl } = require('../../lib/config');
const { error } = require('../../lib/output');

function colorAction(action = '') {
  if (action.includes('error') || action.includes('fail')) return chalk.red(action);
  if (action.includes('warn'))  return chalk.yellow(action);
  if (action.includes('delete') || action.includes('revoke')) return chalk.red(action);
  if (action.includes('create') || action.includes('send')) return chalk.green(action);
  return chalk.cyan(action);
}

module.exports = new Command('tail')
  .description('Stream live activity logs (SSE)')
  .option('-n, --last <n>', 'Show last N entries before streaming', '10')
  .action(async (opts) => {
    const apiKey = getApiKey();
    if (!apiKey) { error('No API key. Run: sendcraft login'); process.exit(1); }

    console.log('\n' + chalk.bold('  Streaming live logs...') + chalk.dim('  Ctrl+C to stop\n'));

    const fullUrl = new URL(getBaseUrl() + '/stream');

    const mod = fullUrl.protocol === 'https:' ? https : http;

    const req = mod.get({
      hostname: fullUrl.hostname,
      port:     fullUrl.port || (fullUrl.protocol === 'https:' ? 443 : 80),
      path:     fullUrl.pathname + fullUrl.search,
      headers:  { Accept: 'text/event-stream', 'x-api-key': apiKey },
    }, (res) => {
      if (res.statusCode !== 200) {
        error(`SSE connect failed: HTTP ${res.statusCode}`);
        process.exit(1);
      }

      let buf = '';
      res.on('data', (chunk) => {
        buf += chunk.toString();
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim());
            const ts      = payload.timestamp ? new Date(payload.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
            const action  = colorAction(payload.action || payload.type || payload.event || '?');
            const detail  = payload.resourceName || payload.email || payload.campaignId || '';
            console.log(`  ${chalk.dim(ts)}  ${action}  ${chalk.dim(detail)}`);
          } catch { /* skip malformed events */ }
        }
      });

      res.on('error', (e) => { error(e.message); });
      res.on('end',   () => { console.log(chalk.dim('\n  Stream ended.')); });
    });

    req.on('error', (e) => { error(e.message); process.exit(1); });
    process.on('SIGINT', () => { req.destroy(); console.log(); process.exit(0); });
  });
