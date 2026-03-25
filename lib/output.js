/**
 * Formatting helpers — tables, status badges, JSON flag support.
 */
const chalk = require('chalk');
const Table = require('cli-table3');
const ora   = require('ora');

const STATUS_COLORS = {
  delivered: 'green',
  sent: 'green',
  active: 'green',
  verified: 'green',
  warmed_up: 'green',
  opened: 'cyan',
  clicked: 'cyan',
  pending: 'yellow',
  scheduled: 'yellow',
  draft: 'yellow',
  failed: 'red',
  bounced: 'red',
  complained: 'red',
  cancelled: 'gray',
  paused: 'gray',
};

function colorStatus(status) {
  const color = STATUS_COLORS[status] || 'white';
  return chalk[color](status);
}

function table(headers, rows) {
  const t = new Table({
    head: headers.map(h => chalk.bold.cyan(h)),
    style: { compact: false, border: ['dim'] },
  });
  rows.forEach(row => t.push(row));
  console.log(t.toString());
}

function json(data) {
  console.log(JSON.stringify(data, null, 2));
}

// Use gradient helpers from banner if available, fallback to plain chalk
function success(msg) {
  try {
    const { printSuccess } = require('./banner');
    printSuccess(msg);
  } catch { console.log(chalk.green('  ✓ ') + chalk.bold(msg)); }
}

function error(msg) {
  try {
    const { printError } = require('./banner');
    printError(msg);
  } catch { console.error(chalk.red('  ✗ ') + msg); }
}

function info(msg) {
  try {
    const { printInfo } = require('./banner');
    printInfo(msg);
  } catch { console.log(chalk.blue('  ℹ ') + msg); }
}

function warn(msg) {
  try {
    const { printWarn } = require('./banner');
    printWarn(msg);
  } catch { console.log(chalk.yellow('  ⚠ ') + msg); }
}

/** Returns an ora spinner with a consistent style */
function spinner(text) {
  return ora({ text, spinner: 'dots', color: 'magenta' });
}

function printOrJson(data, asJson, printFn) {
  if (asJson) return json(data);
  printFn(data);
}

module.exports = { table, json, success, error, info, warn, spinner, printOrJson, colorStatus };
