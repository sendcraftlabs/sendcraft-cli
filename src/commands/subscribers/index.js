'use strict';
const { Command } = require('commander');

const cmd = new Command('subscribers').description('Manage subscribers');
cmd.addCommand(require('./list'));
cmd.addCommand(require('./get'));
cmd.addCommand(require('./add'));
cmd.addCommand(require('./remove'));
module.exports = cmd;
