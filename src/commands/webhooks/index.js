'use strict';
const { Command } = require('commander');

const cmd = new Command('webhooks').description('Manage webhook endpoints');
cmd.addCommand(require('./list'));
cmd.addCommand(require('./create'));
cmd.addCommand(require('./delete'));
cmd.addCommand(require('./test'));
cmd.addCommand(require('./events'));
module.exports = cmd;
