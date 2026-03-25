'use strict';
const { Command } = require('commander');

const cmd = new Command('topics').description('Manage subscriber topics / mailing lists');
cmd.addCommand(require('./list'));
cmd.addCommand(require('./create'));
cmd.addCommand(require('./delete'));
module.exports = cmd;
