'use strict';
const { Command } = require('commander');

const cmd = new Command('config').description('Manage CLI configuration');
cmd.addCommand(require('./init'));
cmd.addCommand(require('./set-key'));
cmd.addCommand(require('./set-url'));
cmd.addCommand(require('./show'));
module.exports = cmd;
