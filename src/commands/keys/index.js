'use strict';
const { Command } = require('commander');

const cmd = new Command('keys').description('Manage API keys');
cmd.addCommand(require('./list'));
cmd.addCommand(require('./create'));
cmd.addCommand(require('./revoke'));
module.exports = cmd;
