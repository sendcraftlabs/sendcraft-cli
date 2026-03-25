'use strict';
const { Command } = require('commander');

const cmd = new Command('domains').description('Manage sending domains');
cmd.addCommand(require('./list'));
cmd.addCommand(require('./add'));
cmd.addCommand(require('./verify'));
cmd.addCommand(require('./records'));
cmd.addCommand(require('./delete'));
module.exports = cmd;
