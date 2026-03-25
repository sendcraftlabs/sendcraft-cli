'use strict';
const { Command } = require('commander');

const cmd = new Command('auth').description('Manage authentication');
cmd.addCommand(require('./login'));
cmd.addCommand(require('./logout'));

// Top-level aliases: `sendcraft login` / `sendcraft logout`
module.exports = cmd;
