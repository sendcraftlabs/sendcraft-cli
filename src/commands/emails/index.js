'use strict';
const { Command } = require('commander');

const cmd = new Command('emails').description('Manage emails');
cmd.addCommand(require('./send'));
cmd.addCommand(require('./list'));
cmd.addCommand(require('./get'));
cmd.addCommand(require('./cancel'));
cmd.addCommand(require('./batch'));
cmd.addCommand(require('./stats'));
module.exports = cmd;
