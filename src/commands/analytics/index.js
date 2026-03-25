'use strict';
const { Command } = require('commander');

const cmd = new Command('analytics').description('View sending analytics');
cmd.addCommand(require('./overview'));
cmd.addCommand(require('./campaign'));
cmd.addCommand(require('./send-time'));
module.exports = cmd;
