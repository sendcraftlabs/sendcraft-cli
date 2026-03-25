'use strict';
const chalk = require('chalk');
const _grad = require('gradient-string');
const gradient = _grad.default || _grad;

// Brand gradients
const primary = gradient(['#6366f1', '#8b5cf6', '#ec4899']);   // indigo → violet → pink
const accent  = gradient(['#8b5cf6', '#ec4899']);               // violet → pink
const cool    = gradient(['#06b6d4', '#6366f1']);               // cyan → indigo
const success = gradient(['#10b981', '#3b82f6']);               // emerald → blue

// Small logo mark  ✦  in gradient
const mark = chalk.hex('#8b5cf6').bold('✦');

// ASCII wordmark — compact 3-line version
const WORDMARK = [
  '  ┌─┐  ┌─┐ ┌┐  ┌┐ ┌──┐   ┌─┐ ┌──┐  ┌─┐  ┌─┐ ┌┬┐',
  '  └─┐  ├┤  │└┐┌┘│ │  │   │    ├┬┘  ├─┤  ├┤   │ ',
  '  └─┘  └─┘ └ └┘ ┘ └──┘   └─┘ ┴└─  ┴ ┴  └─┘  ┴ ',
];

// Minimal clean logo — used in `sendcraft` no-arg startup
function banner(version) {
  const w = process.stdout.columns || 80;
  const line = chalk.hex('#6366f1')('─'.repeat(Math.min(w - 2, 68)));

  console.log();
  console.log('  ' + line);
  console.log();

  // Logo wordmark — gradient each line
  const grads = [
    gradient(['#6366f1', '#8b5cf6']),
    gradient(['#8b5cf6', '#a855f7']),
    gradient(['#a855f7', '#ec4899']),
  ];
  WORDMARK.forEach((l, i) => console.log(grads[i](l)));

  console.log();
  console.log(
    '  ' + chalk.dim(`v${version}`) +
    '  ' + chalk.hex('#8b5cf6')('The official SendCraft CLI') +
    '  ' + chalk.dim('https://sendcraft.online')
  );
  console.log();
  console.log('  ' + line);
  console.log();

  // Quick-start hints
  const c = (s) => chalk.hex('#8b5cf6')(s);
  console.log('  ' + chalk.bold('Quick start'));
  console.log('  ' + chalk.dim('  ') + c('sendcraft auth login') + '            ' + chalk.dim('authenticate'));
  console.log('  ' + chalk.dim('  ') + c('sendcraft emails send --help') + '    ' + chalk.dim('send an email'));
  console.log('  ' + chalk.dim('  ') + c('sendcraft doctor') + '                ' + chalk.dim('check connectivity'));
  console.log('  ' + chalk.dim('  ') + c('sendcraft --help') + '                ' + chalk.dim('all commands'));
  console.log();
  console.log('  ' + line);
  console.log();
}

// Inline header for a section (e.g. "  ✦ SMTP IP Warmup")
function sectionTitle(text) {
  return '  ' + chalk.hex('#8b5cf6').bold('✦') + '  ' + chalk.bold(text);
}

module.exports = { primary, accent, cool, success: success, mark, banner, sectionTitle };
