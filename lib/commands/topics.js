const { Command } = require('commander');
const chalk = require('chalk');
const client = require('../client');
const { table, json, info, success, error, spinner } = require('../output');

const cmd = new Command('topics').description('Manage email topics (subscription preferences)');

cmd
  .command('list')
  .description('List all topics')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Fetching topics…').start();
    try {
      const data = await client.get('/topics');
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const topics = data.topics || [];
      if (!topics.length) return info('No topics yet. Run: ' + chalk.cyan('sendcraft topics create'));
      table(
        ['ID', 'Name', 'Description', 'Subscribers'],
        topics.map(t => [
          chalk.dim(String(t._id).slice(-8)),
          chalk.bold(t.name),
          (t.description || '—').slice(0, 40),
          chalk.cyan(String(t.subscriberCount ?? '—')),
        ])
      );
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('create')
  .description('Create a new topic')
  .requiredOption('--name <name>', 'Topic name')
  .option('--description <text>', 'Topic description')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner(`Creating topic "${chalk.cyan(opts.name)}"…`).start();
    try {
      const data = await client.post('/topics', {
        name: opts.name,
        description: opts.description,
      });
      sp.succeed(chalk.dim('Created'));
      if (opts.json) return json(data);
      const t = data.topic || data;
      success(`Topic ${chalk.bold(t.name)} created  ${chalk.dim('ID: ' + (t._id || '—'))}`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('delete <topicId>')
  .description('Delete a topic')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    const sp = spinner(`Deleting topic ${chalk.dim(id.slice(-8))}…`).start();
    try {
      const data = await client.delete(`/topics/${id}`);
      sp.succeed(chalk.dim('Deleted'));
      if (opts.json) return json(data);
      success('Topic deleted.');
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

module.exports = cmd;
