const { Command } = require('commander');
const chalk = require('chalk');
const client = require('../client');
const { table, json, colorStatus, info, success, error, spinner } = require('../output');

const cmd = new Command('templates').description('Manage email templates');

cmd
  .command('list')
  .description('List all templates')
  .option('-p, --page <n>', 'Page', '1')
  .option('-l, --limit <n>', 'Limit', '20')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    const sp = spinner('Fetching templates…').start();
    try {
      const params = new URLSearchParams({ page: opts.page, limit: opts.limit });
      const data = await client.get(`/templates?${params}`);
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const templates = data.templates || [];
      if (!templates.length) return info('No templates yet. Run: ' + chalk.cyan('sendcraft templates create'));
      table(
        ['ID', 'Name', 'Subject', 'Updated'],
        templates.map(t => [
          chalk.dim(String(t._id).slice(-8)),
          chalk.bold(t.name),
          (t.subject || '').slice(0, 40),
          t.updatedAt ? chalk.dim(new Date(t.updatedAt).toLocaleDateString()) : '—',
        ])
      );
      info(`${templates.length} of ${data.total ?? '?'} templates`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('get <templateId>')
  .description('Get details of a template')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    const sp = spinner('Fetching template…').start();
    try {
      const data = await client.get(`/templates/${id}`);
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const t = data.template || data;
      table(
        ['Field', 'Value'],
        [
          ['ID',      chalk.dim(t._id)],
          ['Name',    chalk.bold(t.name)],
          ['Subject', t.subject || '—'],
          ['Updated', t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '—'],
          ['Version', t.currentVersion != null ? String(t.currentVersion) : '—'],
        ]
      );
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('create')
  .description('Create a new template')
  .requiredOption('--name <name>', 'Template name')
  .requiredOption('--subject <subject>', 'Email subject')
  .option('--html <html>', 'HTML content (inline)')
  .option('--html-file <path>', 'HTML content from file')
  .option('--text <text>', 'Plain text fallback')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    let html = opts.html;
    if (!html && opts.htmlFile) {
      const fs = require('fs');
      if (!require('fs').existsSync(opts.htmlFile)) { error(`File not found: ${opts.htmlFile}`); process.exit(1); }
      html = fs.readFileSync(opts.htmlFile, 'utf8');
    }
    if (!html) { error('Provide --html or --html-file'); process.exit(1); }

    const sp = spinner(`Creating template "${chalk.cyan(opts.name)}"…`).start();
    try {
      const data = await client.post('/templates', {
        name: opts.name,
        subject: opts.subject,
        htmlContent: html,
        plainTextContent: opts.text,
      });
      sp.succeed(chalk.dim('Created'));
      if (opts.json) return json(data);
      const t = data.template || data;
      success(`Template ${chalk.bold(t.name)} created  ${chalk.dim('ID: ' + (t._id || '—'))}`);
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('delete <templateId>')
  .description('Delete a template')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    const sp = spinner(`Deleting template ${chalk.dim(id.slice(-8))}…`).start();
    try {
      const data = await client.delete(`/templates/${id}`);
      sp.succeed(chalk.dim('Deleted'));
      if (opts.json) return json(data);
      success('Template deleted.');
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

cmd
  .command('versions <templateId>')
  .description('List version history of a template')
  .option('--json', 'Output raw JSON')
  .action(async (id, opts) => {
    const sp = spinner('Loading version history…').start();
    try {
      const data = await client.get(`/templates/${id}/versions`);
      sp.succeed(chalk.dim('Loaded'));
      if (opts.json) return json(data);
      const versions = data.versions || [];
      if (!versions.length) return info('No version history found.');
      table(
        ['Version', 'Subject', 'Saved'],
        versions.map(v => [
          chalk.bold(`v${v.version}`),
          (v.subject || '').slice(0, 40),
          v.createdAt ? chalk.dim(new Date(v.createdAt).toLocaleString()) : '—',
        ])
      );
    } catch (err) {
      sp.fail(chalk.red('Failed'));
      error(err.message);
      process.exit(1);
    }
  });

module.exports = cmd;
