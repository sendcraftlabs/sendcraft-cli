'use strict';
const { Command } = require('commander');

const cmd = new Command('templates').description('Manage email templates');
cmd.addCommand(require('./list'));
cmd.addCommand(require('./get'));
cmd.addCommand(require('./create'));
cmd.addCommand(require('./delete'));
cmd.addCommand(require('./versions'));
module.exports = cmd;
