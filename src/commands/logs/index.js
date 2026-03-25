'use strict';
const { Command } = require('commander');

const cmd = new Command('logs').description('View activity logs');
cmd.addCommand(require('./list'));
cmd.addCommand(require('./tail'));
module.exports = cmd;
