/**
 * Interactive TUI — shown when `sendcraft` is run with no arguments.
 * Uses prompts for arrow-key navigation through menus.
 */
const prompts = require('prompts');
const chalk = require('chalk');
const _grad = require('gradient-string'); const gradient = _grad.default || _grad;
const { banner, sendcraftGradient } = require('./banner');
const client = require('./client');
const { table, colorStatus, info, success, error, spinner } = require('./output');
const pkg = require('../package.json');

const sendcraftColor = gradient(['#6366f1', '#8b5cf6', '#ec4899']);

// ─── Menus ────────────────────────────────────────────────────────────────────

const MAIN_MENU = [
  { title: '📧  ' + chalk.bold('Send Email'),         value: 'send' },
  { title: '📋  ' + chalk.bold('Emails'),             value: 'emails' },
  { title: '📣  ' + chalk.bold('Campaigns'),          value: 'campaigns' },
  { title: '👥  ' + chalk.bold('Subscribers'),        value: 'subscribers' },
  { title: '📊  ' + chalk.bold('Analytics'),          value: 'analytics' },
  { title: '📜  ' + chalk.bold('Logs'),               value: 'logs' },
  { title: '🌐  ' + chalk.bold('Domains'),            value: 'domains' },
  { title: '🔑  ' + chalk.bold('API Keys'),           value: 'keys' },
  { title: '🔥  ' + chalk.bold('SMTP Warmup'),        value: 'warmup' },
  { title: '🤖  ' + chalk.bold('MCP Setup'),          value: 'mcp' },
  { title: '🩺  ' + chalk.bold('Doctor'),             value: 'doctor' },
  { title: '🌍  ' + chalk.bold('Open in Browser'),    value: 'open' },
  { title: '🔐  ' + chalk.bold('Login'),              value: 'login' },
  { title: '⚙️   ' + chalk.bold('Config'),            value: 'config' },
  { title: chalk.dim('✕   Exit'),                     value: 'exit' },
];

// ─── Screens ──────────────────────────────────────────────────────────────────

async function screenSendEmail() {
  const answers = await prompts([
    { type: 'text',     name: 'to',      message: 'Recipient email' },
    { type: 'text',     name: 'subject', message: 'Subject' },
    { type: 'text',     name: 'html',    message: 'HTML body (or press Enter to use text)' },
    { type: 'text',     name: 'text',    message: 'Plain text body' },
    { type: 'text',     name: 'from',    message: 'From address (leave blank for default)' },
  ], { onCancel: () => null });

  if (!answers.to || !answers.subject) return;

  const sp = spinner(`Sending to ${chalk.cyan(answers.to)}…`).start();
  try {
    const result = await client.post('/emails/send', {
      toEmail: answers.to,
      subject: answers.subject,
      htmlContent: answers.html || undefined,
      plainTextContent: answers.text || undefined,
      fromEmail: answers.from || undefined,
    });
    sp.succeed(chalk.dim('Done'));
    success(`Email sent!  ${chalk.dim('ID: ' + (result.emailId || result._id || '—'))}`);
  } catch (e) {
    sp.fail(chalk.red('Failed'));
    error(e.message);
  }
}

async function screenEmails() {
  const { action } = await prompts({
    type: 'select',
    name: 'action',
    message: 'Emails',
    choices: [
      { title: 'List emails',  value: 'list' },
      { title: 'Stats summary', value: 'stats' },
      { title: chalk.dim('← Back'), value: 'back' },
    ],
  });
  if (!action || action === 'back') return;

  if (action === 'list') {
    const sp = spinner('Fetching emails…').start();
    try {
      const data = await client.get('/emails?page=1&limit=20');
      sp.succeed(chalk.dim('Loaded'));
      const emails = data.emails || [];
      if (!emails.length) return info('No emails found.');
      table(
        ['ID', 'To', 'Subject', 'Status', 'Sent At'],
        emails.map(e => [
          chalk.dim(String(e._id).slice(-8)),
          chalk.cyan(e.toEmail),
          (e.subject || '').slice(0, 35),
          colorStatus(e.status),
          e.createdAt ? chalk.dim(new Date(e.createdAt).toLocaleString()) : '—',
        ])
      );
      info(`Showing last 20 emails. Use ${chalk.cyan('sendcraft emails list --limit 50')} for more.`);
    } catch (e) { sp.fail(chalk.red('Failed')); error(e.message); }
  }

  if (action === 'stats') {
    const sp = spinner('Loading stats…').start();
    try {
      const data = await client.get('/emails/stats/summary');
      sp.succeed(chalk.dim('Loaded'));
      const s = data.stats || data;
      table(
        ['Metric', 'Value'],
        [
          ['Total Sent',  chalk.bold(String(s.totalSent  ?? '—'))],
          ['Delivered',   chalk.green(String(s.delivered  ?? '—'))],
          ['Opened',      chalk.cyan(String(s.opened      ?? '—'))],
          ['Clicked',     chalk.cyan(String(s.clicked     ?? '—'))],
          ['Bounced',     chalk.red(String(s.bounced      ?? '—'))],
          ['Open Rate',   s.openRate  != null ? chalk.green(`${(s.openRate  * 100).toFixed(1)}%`) : '—'],
          ['Click Rate',  s.clickRate != null ? chalk.cyan( `${(s.clickRate * 100).toFixed(1)}%`) : '—'],
        ]
      );
    } catch (e) { sp.fail(chalk.red('Failed')); error(e.message); }
  }
}

async function screenCampaigns() {
  const sp = spinner('Fetching campaigns…').start();
  try {
    const data = await client.get('/campaigns');
    sp.succeed(chalk.dim('Loaded'));
    const campaigns = data.campaigns || [];
    if (!campaigns.length) return info('No campaigns found.');
    table(
      ['ID', 'Name', 'Status', 'Recipients', 'Created'],
      campaigns.map(c => [
        chalk.dim(String(c._id).slice(-8)),
        chalk.bold((c.name || '').slice(0, 30)),
        colorStatus(c.status),
        c.recipientCount != null ? chalk.cyan(String(c.recipientCount)) : '—',
        c.createdAt ? chalk.dim(new Date(c.createdAt).toLocaleDateString()) : '—',
      ])
    );

    const { campaignId } = await prompts({
      type: 'text',
      name: 'campaignId',
      message: 'Enter campaign ID to send (or leave blank to go back)',
    });
    if (!campaignId) return;

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `Send campaign ${chalk.cyan(campaignId)}?`,
      initial: false,
    });
    if (!confirm) return;

    const sp2 = spinner('Sending campaign…').start();
    await client.post(`/campaigns/${campaignId}/send`, {});
    sp2.succeed(chalk.dim('Done'));
    success('Campaign sent!');
  } catch (e) { error(e.message); }
}

async function screenSubscribers() {
  const sp = spinner('Fetching subscribers…').start();
  try {
    const data = await client.get('/subscribers?page=1&limit=20');
    sp.succeed(chalk.dim('Loaded'));
    const subs = data.subscribers || [];
    if (!subs.length) return info('No subscribers found.');
    table(
      ['Email', 'Name', 'Status', 'Joined'],
      subs.map(s => [
        chalk.cyan(s.email),
        [s.firstName, s.lastName].filter(Boolean).join(' ') || chalk.dim('—'),
        colorStatus(s.status),
        s.createdAt ? chalk.dim(new Date(s.createdAt).toLocaleDateString()) : '—',
      ])
    );
    info(`Showing first 20. Use ${chalk.cyan('sendcraft subscribers list')} for more options.`);
  } catch (e) { error(e.message); }
}

async function screenDomains() {
  const sp = spinner('Fetching domains…').start();
  try {
    const data = await client.get('/domains');
    sp.succeed(chalk.dim('Loaded'));
    const domains = data.domains || [];
    if (!domains.length) {
      info('No domains added yet.');
      const { add } = await prompts({ type: 'confirm', name: 'add', message: 'Add a domain now?', initial: true });
      if (!add) return;
    } else {
      table(
        ['Domain', 'Status', 'SPF', 'DKIM', 'DMARC'],
        domains.map(d => [
          chalk.bold(d.domain),
          colorStatus(d.status),
          d.spfVerified  ? chalk.green('✓') : chalk.red('✗'),
          d.dkimVerified ? chalk.green('✓') : chalk.red('✗'),
          d.dmarcVerified? chalk.green('✓') : chalk.red('✗'),
        ])
      );
    }

    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'Domains',
      choices: [
        { title: 'Add a domain',    value: 'add' },
        { title: 'Verify a domain', value: 'verify' },
        { title: chalk.dim('← Back'), value: 'back' },
      ],
    });
    if (!action || action === 'back') return;

    if (action === 'add') {
      const { domain } = await prompts({ type: 'text', name: 'domain', message: 'Domain (e.g. mystore.com)' });
      if (!domain) return;
      const sp2 = spinner(`Adding ${chalk.cyan(domain)}…`).start();
      const result = await client.post('/domains', { domain });
      sp2.succeed(chalk.dim('Added'));
      success(`${domain} added.`);
      console.log('\n' + sendcraftColor('  ─── Add these DNS records ───') + '\n');
      (result.dnsRecords || []).forEach(r => {
        console.log(`  ${chalk.bold.cyan(r.purpose)}${r.optional ? chalk.dim(' (optional)') : ''}`);
        console.log(`    Name:  ${r.name}`);
        console.log(`    Value: ${r.value}\n`);
      });
    }

    if (action === 'verify') {
      const { id } = await prompts({ type: 'text', name: 'id', message: 'Domain ID' });
      if (!id) return;
      const sp2 = spinner('Checking DNS…').start();
      const result = await client.post(`/domains/${id}/verify`);
      result.verified ? sp2.succeed(gradient(['#10b981', '#3b82f6'])('All verified!')) : sp2.warn(chalk.yellow('Still pending'));
      const r = result.results || {};
      table(['Record', 'Status'], [
        ['SPF',   r.spf   ? chalk.green('✓') : chalk.red('✗')],
        ['DKIM',  r.dkim  ? chalk.green('✓') : chalk.red('✗')],
        ['DMARC', r.dmarc ? chalk.green('✓') : chalk.red('✗')],
      ]);
    }
  } catch (e) { error(e.message); }
}

async function screenKeys() {
  const sp = spinner('Fetching API keys…').start();
  try {
    const data = await client.get('/user/keys');
    sp.succeed(chalk.dim('Loaded'));
    const keys = data.keys || [];
    if (keys.length) {
      table(
        ['Name', 'Key', 'Permissions', 'Last Used'],
        keys.map(k => [
          chalk.bold(k.name),
          chalk.dim(k.maskedKey || '***'),
          k.permissions === 'full_access' ? chalk.green('full') : chalk.yellow('sending'),
          k.lastUsedAt ? chalk.dim(new Date(k.lastUsedAt).toLocaleDateString()) : chalk.dim('Never'),
        ])
      );
    } else {
      info('No API keys yet.');
    }

    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'API Keys',
      choices: [
        { title: 'Create a new key', value: 'create' },
        { title: chalk.dim('← Back'), value: 'back' },
      ],
    });
    if (!action || action === 'back') return;

    const { name, permissions } = await prompts([
      { type: 'text',   name: 'name',        message: 'Key name' },
      { type: 'select', name: 'permissions',  message: 'Permissions',
        choices: [
          { title: 'full_access — can do everything',    value: 'full_access' },
          { title: 'sending_access — email send only',   value: 'sending_access' },
        ]
      },
    ]);
    if (!name) return;

    const sp2 = spinner(`Creating "${chalk.cyan(name)}"…`).start();
    const result = await client.post('/user/keys', { name, permissions });
    sp2.succeed(chalk.dim('Created'));
    const key = result.key;
    console.log(`\n  ${chalk.bold.yellow('API Key (save this — shown once):')}`);
    console.log(`  ${chalk.bgBlack.green.bold(' ' + key.key + ' ')}\n`);
    success('Key created. Store it securely!');
  } catch (e) { error(e.message); }
}

async function screenWarmup() {
  const sp = spinner('Checking warmup…').start();
  try {
    const data = await client.get('/smtp/warmup');
    sp.succeed(chalk.dim('Loaded'));
    if (data.isWarmedUp) {
      console.log('\n  ' + gradient(['#10b981', '#3b82f6']).bold('✓ IP fully warmed up — no daily limits!') + '\n');
    } else {
      const ratio  = data.dailyLimit ? Math.min(data.todayCount / data.dailyLimit, 1) : 0;
      const filled = Math.round(ratio * 24);
      const bar    = chalk.dim('[') + chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(24 - filled)) + chalk.dim(']');
      console.log(`\n  ${chalk.bold.magenta('Day ' + data.warmupDay)}  ${bar}  ${chalk.cyan(data.todayCount)}${chalk.dim('/' + data.dailyLimit)}\n`);
    }
    table(['Field', 'Value'], [
      ['Warmup Day',  chalk.bold(String(data.warmupDay))],
      ['Daily Limit', data.isWarmedUp ? chalk.green('Unlimited') : chalk.yellow(String(data.dailyLimit))],
      ['Sent Today',  chalk.cyan(String(data.todayCount))],
      ['Remaining',   data.isWarmedUp ? '∞' : String(data.remainingToday)],
    ]);
  } catch (e) { error(e.message); }
}

async function screenMcp() {
  const apiKey = process.env.SENDCRAFT_API_KEY || '<your-api-key>';
  console.log('\n' + sendcraftColor('  ✦ SendCraft MCP Server') + '\n');
  console.log(chalk.bold('  Install:'));
  console.log(`    ${chalk.cyan('npm install -g sendcraft-mcp')}\n`);
  console.log(chalk.bold('  Claude Desktop config:'));
  console.log(chalk.dim('    ~/Library/Application Support/Claude/claude_desktop_config.json\n'));
  const cfg = { mcpServers: { sendcraft: { command: 'npx', args: ['sendcraft-mcp'], env: { SENDCRAFT_API_KEY: apiKey } } } };
  console.log('    ' + chalk.bgBlack(JSON.stringify(cfg, null, 2).split('\n').join('\n    ')) + '\n');
  const { getWebUrl } = require('./config');
  info(`Docs: ${getWebUrl()}/docs`);
}

async function screenAnalytics() {
  const sp = spinner('Loading analytics…').start();
  try {
    const [ov, st] = await Promise.allSettled([
      client.get('/analytics/overview'),
      client.get('/analytics/send-time'),
    ]);
    sp.succeed(chalk.dim('Loaded'));
    const o = ov.status === 'fulfilled' ? (ov.value.analytics || ov.value) : null;
    if (!o) return error('Could not load analytics');
    const openRate  = parseFloat(o.openRate)  || 0;
    const clickRate = parseFloat(o.clickRate) || 0;
    const bounceRate = o.totalEmails > 0 ? ((o.totalBounced / o.totalEmails) * 100) : 0;
    table(
      ['Metric', 'Value'],
      [
        ['Total Sent',  chalk.bold((o.totalEmails || 0).toLocaleString())],
        ['Open Rate',   openRate  >= 20 ? chalk.green(`${openRate.toFixed(1)}%`)  : chalk.yellow(`${openRate.toFixed(1)}%`)],
        ['Click Rate',  clickRate >= 3  ? chalk.green(`${clickRate.toFixed(1)}%`) : chalk.yellow(`${clickRate.toFixed(1)}%`)],
        ['Bounce Rate', bounceRate > 5  ? chalk.red(`${bounceRate.toFixed(1)}%`)  : chalk.green(`${bounceRate.toFixed(1)}%`)],
        ['Total Cost',  chalk.dim(`$${(o.totalCost || 0).toFixed(2)}`)],
      ]
    );
    const r = st.status === 'fulfilled' ? st.value?.recommendation : null;
    if (r) {
      console.log(`\n  ${chalk.bold('Best send time:')} ${chalk.cyan(`${r.bestDay} at ${r.bestHour}:00 UTC`)} ${chalk.dim(`(${r.confidence} confidence)`)}`);
      console.log(chalk.dim(`  ${r.reasoning}\n`));
    }
  } catch (e) { sp.fail(chalk.red('Failed')); error(e.message); }
}

async function screenLogs() {
  const sp = spinner('Fetching logs…').start();
  try {
    const data = await client.get('/logs?limit=20&page=1');
    sp.succeed(chalk.dim('Loaded'));
    const logs = data.logs || [];
    if (!logs.length) return info('No logs found.');
    const { colorStatus } = require('./output');
    table(
      ['Time', 'To', 'Subject', 'Status'],
      logs.map(l => [
        chalk.dim(new Date(l.createdAt || l.sentAt).toLocaleTimeString()),
        chalk.cyan((l.toEmail || '').slice(0, 28)),
        (l.subject || '').slice(0, 35),
        colorStatus(l.status),
      ])
    );
    info(`Showing ${logs.length} most recent logs.`);
  } catch (e) { sp.fail(chalk.red('Failed')); error(e.message); }
}

async function screenDoctor() {
  const { getApiKey, getBaseUrl, CONFIG_FILE } = require('./config');
  console.log('\n' + chalk.bold('  SendCraft Doctor\n'));
  const apiKey = getApiKey();
  const checks = [
    { name: 'Config file', ok: true, detail: chalk.dim(CONFIG_FILE) },
    { name: 'API key',     ok: !!apiKey, detail: apiKey ? chalk.dim(apiKey.slice(0, 8) + '••••') : chalk.red('Not set — run: sendcraft config init') },
    { name: 'Base URL',    ok: true, detail: chalk.cyan(getBaseUrl()) },
  ];
  const sp = spinner('Checking connectivity…').start();
  try {
    await client.get('/public/stats');
    sp.stop();
    checks.push({ name: 'API reachable', ok: true });
  } catch { sp.stop(); checks.push({ name: 'API reachable', ok: false, detail: chalk.red('Cannot connect') }); }
  if (apiKey) {
    const sp2 = spinner('Verifying key…').start();
    try { await client.get('/auth/me'); sp2.stop(); checks.push({ name: 'API key valid', ok: true }); }
    catch (e) { sp2.stop(); checks.push({ name: 'API key valid', ok: false, detail: e.response?.status === 401 ? chalk.red('Invalid or revoked') : chalk.yellow('Unverifiable') }); }
  }
  console.log();
  checks.forEach(c => {
    const icon = c.ok ? chalk.green('  ✓') : chalk.red('  ✗');
    console.log(`${icon}  ${chalk.bold((c.name + ' ').padEnd(20, '·'))}  ${c.detail || ''}`);
  });
  const failed = checks.filter(c => !c.ok);
  console.log();
  if (!failed.length) console.log(chalk.green('  ✓ All good!\n'));
  else console.log(chalk.red(`  ✗ ${failed.length} issue(s) found.\n`));
}

async function screenOpen() {
  const { getWebUrl } = require('./config');
  const { execSync } = require('child_process');
  const { choice } = await prompts({
    type: 'select', name: 'choice', message: 'Open page',
    choices: [
      { title: 'Dashboard',   value: '' },
      { title: 'Analytics',   value: '/dashboard/analytics' },
      { title: 'Settings',    value: '/dashboard/settings' },
      { title: 'Billing',     value: '/dashboard/billing' },
      { title: 'Docs',        value: '/docs' },
      { title: chalk.dim('← Back'), value: 'back' },
    ],
  });
  if (!choice && choice !== '') return;
  if (choice === 'back') return;
  const url = getWebUrl() + choice;
  try {
    const cmd = process.platform === 'darwin' ? `open "${url}"` : process.platform === 'win32' ? `start "" "${url}"` : `xdg-open "${url}"`;
    execSync(cmd, { stdio: 'ignore' });
    info(`Opened ${chalk.cyan(url)}`);
  } catch { info(`Visit: ${chalk.cyan(url)}`); }
}

async function screenConfig() {
  const { action } = await prompts({
    type: 'select',
    name: 'action',
    message: 'Config',
    choices: [
      { title: 'Set API key',  value: 'key' },
      { title: 'Show config',  value: 'show' },
      { title: chalk.dim('← Back'), value: 'back' },
    ],
  });
  if (!action || action === 'back') return;

  if (action === 'key') {
    const { key } = await prompts({ type: 'password', name: 'key', message: 'Paste your API key' });
    if (!key) return;
    const cfg = require('./config').load();
    cfg.api_key = key;
    require('./config').save(cfg);
    success('API key saved.');
  }

  if (action === 'show') {
    const { getApiKey, getBaseUrl, CONFIG_FILE } = require('./config');
    const k = getApiKey();
    if (!k) return error('No key set. Choose "Set API key".');
    const masked = k.length > 12 ? k.slice(0, 8) + '…' + k.slice(-4) : '***';
    console.log(`\n  ${chalk.bold('Key:')}  ${chalk.green(masked)}`);
    console.log(`  ${chalk.bold('URL:')}  ${chalk.cyan(getBaseUrl())}`);
    console.log(`  ${chalk.bold('File:')} ${chalk.dim(CONFIG_FILE)}\n`);
  }
}

// ─── Main loop ────────────────────────────────────────────────────────────────

module.exports = async function interactive() {
  banner(pkg.version);

  // Check for API key
  const { getApiKey } = require('./config');
  if (!getApiKey()) {
    console.log(chalk.yellow('  ⚠  No API key configured yet.\n'));
    const { setup } = await prompts({
      type: 'confirm', name: 'setup',
      message: 'Log in to SendCraft now?',
      initial: true,
    });
    if (setup) await require('./commands/login').runInteractive();
  }

  while (true) {
    console.log();
    const { choice } = await prompts({
      type: 'select',
      name: 'choice',
      message: sendcraftGradient('What would you like to do?'),
      choices: MAIN_MENU,
      hint: 'Use arrow keys + Enter',
    }, { onCancel: () => process.exit(0) });

    if (!choice || choice === 'exit') {
      console.log('\n  ' + chalk.dim('Bye! 👋') + '\n');
      process.exit(0);
    }

    console.log();
    try {
      if (choice === 'send')        await screenSendEmail();
      if (choice === 'emails')      await screenEmails();
      if (choice === 'campaigns')   await screenCampaigns();
      if (choice === 'subscribers') await screenSubscribers();
      if (choice === 'domains')     await screenDomains();
      if (choice === 'keys')        await screenKeys();
      if (choice === 'warmup')      await screenWarmup();
      if (choice === 'mcp')         await screenMcp();
      if (choice === 'analytics')   await screenAnalytics();
      if (choice === 'logs')        await screenLogs();
      if (choice === 'doctor')      await screenDoctor();
      if (choice === 'open')        await screenOpen();
      if (choice === 'login')       await require('./commands/login').runInteractive();
      if (choice === 'config')      await screenConfig();
    } catch (e) {
      error('Unexpected error: ' + e.message);
    }
  }
};
