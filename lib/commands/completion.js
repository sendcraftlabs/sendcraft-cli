/**
 * sendcraft completion <shell>
 * Output shell completion scripts for bash, zsh, or fish.
 *
 * Usage:
 *   bash:  echo 'source <(sendcraft completion bash)' >> ~/.bashrc
 *   zsh:   echo 'source <(sendcraft completion zsh)'  >> ~/.zshrc
 *   fish:  sendcraft completion fish > ~/.config/fish/completions/sendcraft.fish
 */
const { Command } = require('commander');
const { error, info } = require('../output');
const chalk = require('chalk');

const COMMANDS = [
  'login', 'logout', 'send', 'emails', 'campaigns', 'subscribers',
  'domains', 'keys', 'warmup', 'mcp', 'analytics', 'logs', 'doctor',
  'open', 'config', 'completion',
];

const SUB_COMMANDS = {
  emails:      ['list', 'stats', 'get'],
  campaigns:   ['list', 'stats', 'create'],
  subscribers: ['list', 'add', 'remove'],
  domains:     ['list', 'add', 'verify', 'records'],
  keys:        ['list', 'create', 'revoke'],
  analytics:   ['overview', 'campaigns', 'send-time'],
  logs:        ['list', 'tail'],
  mcp:         ['info', 'install'],
  config:      ['init', 'set-key', 'set-url', 'show'],
  completion:  ['bash', 'zsh', 'fish'],
  open:        ['dashboard', 'settings', 'billing', 'docs', 'domains', 'analytics', 'campaigns', 'subscribers', 'logs', 'team'],
};

const BASH_SCRIPT = () => `
# SendCraft CLI bash completion
_sendcraft_completions() {
  local cur prev words
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  local commands="${COMMANDS.join(' ')}"

  case "\${prev}" in
${Object.entries(SUB_COMMANDS).map(([cmd, subs]) =>
  `    ${cmd})\n      COMPREPLY=($(compgen -W "${subs.join(' ')}" -- "\${cur}"))\n      return 0\n      ;;`
).join('\n')}
  esac

  COMPREPLY=($(compgen -W "\${commands}" -- "\${cur}"))
  return 0
}

complete -F _sendcraft_completions sendcraft
`.trim();

const ZSH_SCRIPT = () => `
#compdef sendcraft

_sendcraft() {
  local state

  _arguments \\
    '1: :->command' \\
    '2: :->subcommand'

  case $state in
    command)
      _values 'command' ${COMMANDS.map(c => `'${c}'`).join(' ')}
      ;;
    subcommand)
      case $words[2] in
${Object.entries(SUB_COMMANDS).map(([cmd, subs]) =>
  `        ${cmd})\n          _values 'subcommand' ${subs.map(s => `'${s}'`).join(' ')}\n          ;;`
).join('\n')}
      esac
      ;;
  esac
}

_sendcraft
`.trim();

const FISH_SCRIPT = () => {
  const lines = [];
  lines.push('# SendCraft CLI fish completion');
  lines.push(`set -l sendcraft_commands ${COMMANDS.join(' ')}`);
  lines.push('complete -c sendcraft -f');
  lines.push(`complete -c sendcraft -n "not __fish_seen_subcommand_from $sendcraft_commands" -a "$sendcraft_commands"`);
  for (const [cmd, subs] of Object.entries(SUB_COMMANDS)) {
    lines.push(`complete -c sendcraft -n "__fish_seen_subcommand_from ${cmd}" -a "${subs.join(' ')}"`);
  }
  return lines.join('\n');
};

const cmd = new Command('completion')
  .description('Generate shell completion script')
  .argument('<shell>', 'Shell to generate completion for: bash, zsh, fish')
  .action((shell) => {
    switch (shell) {
      case 'bash':
        console.log(BASH_SCRIPT());
        break;
      case 'zsh':
        console.log(ZSH_SCRIPT());
        break;
      case 'fish':
        console.log(FISH_SCRIPT());
        break;
      default:
        error(`Unknown shell "${shell}". Use: bash, zsh, fish`);
        process.exit(1);
    }
  });

// Print install instructions when no shell arg
cmd.addHelpText('after', `
${chalk.bold('Setup instructions:')}

  ${chalk.cyan('bash')}   echo 'source <(sendcraft completion bash)' >> ~/.bashrc && source ~/.bashrc
  ${chalk.cyan('zsh')}    echo 'source <(sendcraft completion zsh)'  >> ~/.zshrc  && source ~/.zshrc
  ${chalk.cyan('fish')}   sendcraft completion fish > ~/.config/fish/completions/sendcraft.fish
`);

module.exports = cmd;
