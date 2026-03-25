/**
 * sendcraft open [page]
 * Open SendCraft pages in the system browser.
 */
const { Command } = require('commander');
const chalk = require('chalk');
const { execSync } = require('child_process');
const { getWebUrl } = require('../config');
const { info, error } = require('../output');

const PAGES = {
  dashboard:  '',
  settings:   '/dashboard/settings',
  billing:    '/dashboard/billing',
  domains:    '/dashboard/domains',
  docs:       '/docs',
  analytics:  '/dashboard/analytics',
  campaigns:  '/dashboard/campaigns',
  subscribers:'/dashboard/subscribers',
  logs:       '/dashboard/logs',
  team:       '/dashboard/team',
};

function openBrowser(url) {
  try {
    const cmd =
      process.platform === 'darwin' ? `open "${url}"` :
      process.platform === 'win32'  ? `start "" "${url}"` :
      `xdg-open "${url}"`;
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

const cmd = new Command('open')
  .description('Open SendCraft in the browser')
  .argument('[page]', `Page to open: ${Object.keys(PAGES).join(', ')}`, 'dashboard')
  .action((page) => {
    const path = PAGES[page];
    if (path === undefined) {
      error(`Unknown page "${page}". Available: ${Object.keys(PAGES).join(', ')}`);
      process.exit(1);
    }
    const url = getWebUrl() + path;
    const opened = openBrowser(url);
    if (opened) {
      info(`Opening ${chalk.cyan(url)}`);
    } else {
      info(`Could not open browser — visit: ${chalk.cyan(url)}`);
    }
  });

module.exports = cmd;
