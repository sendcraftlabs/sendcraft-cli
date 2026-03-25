'use strict';
const chalk = require('chalk');
const Table = require('cli-table3');
const ora   = require('ora');

// ─── Status colour map ───────────────────────────────────────────────────────

const STATUS_COLORS = {
  delivered: '#10b981', sent: '#10b981', active: '#10b981',
  verified: '#10b981',  warmed_up: '#10b981', completed: '#10b981',
  opened: '#06b6d4',    clicked: '#06b6d4',
  pending: '#f59e0b',   scheduled: '#f59e0b', draft: '#f59e0b', processing: '#f59e0b',
  failed: '#ef4444',    bounced: '#ef4444',   complained: '#ef4444', error: '#ef4444',
  cancelled: '#6b7280', paused: '#6b7280',    inactive: '#6b7280', unsubscribed: '#6b7280',
};

const STATUS_ICONS = {
  delivered: '●', sent: '●', active: '●', verified: '✓', warmed_up: '✓', completed: '✓',
  opened: '◉',    clicked: '◉',
  pending: '○',   scheduled: '◔', draft: '○', processing: '◔',
  failed: '✗',    bounced: '✗',   complained: '✗', error: '✗',
  cancelled: '–', paused: '‖',    inactive: '–', unsubscribed: '–',
};

function colorStatus(status = '') {
  const key = status.toLowerCase();
  const hex  = STATUS_COLORS[key] || '#9ca3af';
  const icon = STATUS_ICONS[key]  || '·';
  return chalk.hex(hex)(`${icon} ${status}`);
}

// ─── Table ───────────────────────────────────────────────────────────────────

function table(headers, rows) {
  const BRAND = '#6366f1';
  const t = new Table({
    head: headers.map(h => chalk.hex(BRAND).bold(h)),
    style: {
      compact: false,
      border: [],        // will be set via chars
      head: [],
      'padding-left': 1,
      'padding-right': 1,
    },
    chars: {
      'top':        chalk.dim('─'),
      'top-mid':    chalk.dim('┬'),
      'top-left':   chalk.dim('┌'),
      'top-right':  chalk.dim('┐'),
      'bottom':     chalk.dim('─'),
      'bottom-mid': chalk.dim('┴'),
      'bottom-left':  chalk.dim('└'),
      'bottom-right': chalk.dim('┘'),
      'left':       chalk.dim('│'),
      'left-mid':   chalk.dim('├'),
      'mid':        chalk.dim('─'),
      'mid-mid':    chalk.dim('┼'),
      'right':      chalk.dim('│'),
      'right-mid':  chalk.dim('┤'),
      'middle':     chalk.dim('│'),
    },
  });

  rows.forEach((row, i) => {
    // Dim alternating rows slightly
    if (i % 2 !== 0) {
      t.push(row.map(c => (typeof c === 'string' ? chalk.dim(c) : c)));
    } else {
      t.push(row);
    }
  });

  console.log('\n' + t.toString() + '\n');
}

// ─── Key-value display ────────────────────────────────────────────────────────

function kv(key, value, { indent = '  ' } = {}) {
  const pad = 14;
  const k = chalk.bold((key + ':').padEnd(pad));
  const v = typeof value === 'string' ? value : String(value ?? chalk.dim('—'));
  console.log(indent + k + '  ' + v);
}

// ─── Section divider ─────────────────────────────────────────────────────────

function divider(label = '') {
  const w = Math.min(process.stdout.columns || 80, 68);
  if (label) {
    const side = Math.floor((w - label.length - 2) / 2);
    const bar = chalk.dim('─'.repeat(Math.max(side, 1)));
    console.log('\n  ' + bar + ' ' + chalk.bold(label) + ' ' + bar);
  } else {
    console.log('\n  ' + chalk.dim('─'.repeat(w)));
  }
}

function section(title) {
  console.log('\n  ' + chalk.hex('#8b5cf6').bold('✦') + '  ' + chalk.bold(title));
}

// ─── Messaging ───────────────────────────────────────────────────────────────

function success(msg) {
  console.log('\n  ' + chalk.hex('#10b981').bold('✓') + '  ' + chalk.bold(msg) + '\n');
}

function error(msg) {
  console.error('\n  ' + chalk.hex('#ef4444').bold('✗') + '  ' + msg + '\n');
}

function warn(msg) {
  console.log('  ' + chalk.hex('#f59e0b').bold('⚠') + '  ' + msg);
}

function info(msg) {
  console.log('  ' + chalk.dim('›') + '  ' + chalk.dim(msg));
}

function hint(msg) {
  console.log('  ' + chalk.hex('#6366f1')('›') + '  ' + chalk.dim(msg));
}

function json(data) {
  console.log(JSON.stringify(data, null, 2));
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function spinner(text) {
  return ora({
    text: chalk.dim(text),
    spinner: 'dots',
    color: 'magenta',
    prefixText: ' ',
  });
}

// ─── Badge ───────────────────────────────────────────────────────────────────

function badge(text, hex = '#6366f1') {
  return chalk.bgHex(hex).bold.black(` ${text} `);
}

// ─── Count summary line ───────────────────────────────────────────────────────

function summary(items, noun = 'result') {
  const n = items?.length ?? 0;
  console.log('  ' + chalk.dim(`${n} ${noun}${n !== 1 ? 's' : ''}`));
}

module.exports = {
  table, kv, divider, section,
  success, error, warn, info, hint,
  json, spinner, badge, summary, colorStatus,
};
