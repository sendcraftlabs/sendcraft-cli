/**
 * Animated banner shown on `sendcraft` with no args.
 */
const _grad = require('gradient-string'); const gradient = _grad.default || _grad;
const _boxen = require('boxen'); const boxen = _boxen.default || _boxen;
const chalk = require('chalk');

const sendcraftGradient = gradient(['#6366f1', '#8b5cf6', '#ec4899']);
const successGradient   = gradient(['#10b981', '#3b82f6']);

const ASCII_ART = [
  ' ____                  _  ____            __ _   ',
  '/ ___|  ___ _ __   __| |/ ___|_ __ __ _ / _| |_ ',
  '\\___ \\ / _ \\ \'_ \\ / _` | |   | \'__/ _` | |_| __|',
  ' ___) |  __/ | | | (_| | |___| | | (_| |  _| |_ ',
  '|____/ \\___|_| |_|\\__,_|\\____|_|  \\__,_|_|  \\__|',
].join('\n');

function banner(version) {
  console.log(sendcraftGradient.multiline(ASCII_ART));

  const box = boxen(
    `${chalk.bold('SendCraft CLI')}  ${chalk.dim('v' + version)}\n` +
    `${chalk.dim('Official CLI for the SendCraft email platform')}\n\n` +
    `${chalk.cyan('sendcraft config init')}  ${chalk.dim('→ Setup your API key')}\n` +
    `${chalk.cyan('sendcraft send')}         ${chalk.dim('→ Send an email')}\n` +
    `${chalk.cyan('sendcraft --help')}       ${chalk.dim('→ All commands')}`,
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'magenta',
    }
  );
  console.log(box);
}

function printSuccess(msg) {
  console.log(successGradient('  ✓ ') + chalk.bold(msg));
}

function printError(msg) {
  console.error(chalk.red('  ✗ ') + msg);
}

function printInfo(msg) {
  console.log(chalk.blue('  ℹ ') + msg);
}

function printWarn(msg) {
  console.log(chalk.yellow('  ⚠ ') + msg);
}

module.exports = { banner, printSuccess, printError, printInfo, printWarn, sendcraftGradient, successGradient };
