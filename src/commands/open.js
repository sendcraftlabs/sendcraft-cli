'use strict';
const { Command } = require('commander');
const chalk = require('chalk');

const PAGES = {
  dashboard:  'https://sendcraft.online/dashboard',
  docs:       'https://sendcraft.online/docs',
  billing:    'https://sendcraft.online/dashboard/billing',
  templates:  'https://sendcraft.online/dashboard/templates',
  campaigns:  'https://sendcraft.online/dashboard/campaigns',
  analytics:  'https://sendcraft.online/dashboard/analytics',
  settings:   'https://sendcraft.online/dashboard/settings',
  status:     'https://sendcraft.online/status',
  github:     'https://github.com/sendcraft/sendcraft',
};

function openUrl(url) {
  const { execFile } = require('child_process');
  const [cmd, args] =
    process.platform === 'darwin' ? ['open',     [url]] :
    process.platform === 'win32'  ? ['cmd',      ['/c', 'start', '', url]] :
                                    ['xdg-open', [url]];
  execFile(cmd, args, (err) => { if (err) console.log('  URL: ' + chalk.cyan(url)); });
}

module.exports = new Command('open')
  .description('Open SendCraft pages in the browser')
  .argument('[page]', `Page to open: ${Object.keys(PAGES).join(', ')}`, 'dashboard')
  .action((page) => {
    const url = PAGES[page.toLowerCase()];
    if (!url) {
      console.error(chalk.red(`\n  ✗  Unknown page: ${page}`));
      console.error('  Available: ' + Object.keys(PAGES).join(', ') + '\n');
      process.exit(1);
    }
    console.log('  Opening ' + chalk.cyan(url));
    openUrl(url);
  });
