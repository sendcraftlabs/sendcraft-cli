'use strict';
const { Command } = require('commander');

const cmd = new Command('campaigns').description('Manage email campaigns');
cmd.addCommand(require('./list'));
cmd.addCommand(require('./get'));
cmd.addCommand(require('./send-campaign'));
module.exports = cmd;
