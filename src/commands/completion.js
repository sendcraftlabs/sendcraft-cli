'use strict';
const { Command } = require('commander');
const chalk = require('chalk');

const BASH_COMPLETION = `
# SendCraft CLI bash completion
# Usage: sendcraft completion bash >> ~/.bashrc && source ~/.bashrc
_sendcraft_completion() {
  local cur prev words
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  local top_cmds="auth emails campaigns subscribers templates domains webhooks topics keys analytics logs config warmup doctor mcp open completion"

  case "\$prev" in
    sendcraft)   COMPREPLY=(\$(compgen -W "\$top_cmds" -- "\$cur")); return ;;
    auth)        COMPREPLY=(\$(compgen -W "login logout" -- "\$cur")); return ;;
    emails)      COMPREPLY=(\$(compgen -W "send list get cancel batch stats" -- "\$cur")); return ;;
    campaigns)   COMPREPLY=(\$(compgen -W "list get send" -- "\$cur")); return ;;
    subscribers) COMPREPLY=(\$(compgen -W "list get add remove" -- "\$cur")); return ;;
    templates)   COMPREPLY=(\$(compgen -W "list get create delete versions" -- "\$cur")); return ;;
    domains)     COMPREPLY=(\$(compgen -W "list add verify records delete" -- "\$cur")); return ;;
    webhooks)    COMPREPLY=(\$(compgen -W "list create delete test events" -- "\$cur")); return ;;
    topics)      COMPREPLY=(\$(compgen -W "list create delete" -- "\$cur")); return ;;
    keys)        COMPREPLY=(\$(compgen -W "list create revoke" -- "\$cur")); return ;;
    analytics)   COMPREPLY=(\$(compgen -W "overview campaign send-time" -- "\$cur")); return ;;
    logs)        COMPREPLY=(\$(compgen -W "list tail" -- "\$cur")); return ;;
    config)      COMPREPLY=(\$(compgen -W "init set-key set-url show" -- "\$cur")); return ;;
    warmup)      COMPREPLY=(\$(compgen -W "status reset" -- "\$cur")); return ;;
    open)        COMPREPLY=(\$(compgen -W "dashboard docs billing templates campaigns analytics settings status github" -- "\$cur")); return ;;
  esac
}
complete -F _sendcraft_completion sendcraft
`;

const ZSH_COMPLETION = `
#compdef sendcraft
# Usage: sendcraft completion zsh > \${fpath[1]}/_sendcraft
_sendcraft() {
  local state line
  typeset -A opt_args
  _arguments -C '1: :->cmd' '*: :->args'
  case \$state in
    cmd)
      _values 'command' \\
        'auth[Manage authentication]' \\
        'emails[Manage emails]' \\
        'campaigns[Manage campaigns]' \\
        'subscribers[Manage subscribers]' \\
        'templates[Manage templates]' \\
        'domains[Manage domains]' \\
        'webhooks[Manage webhooks]' \\
        'topics[Manage topics]' \\
        'keys[Manage API keys]' \\
        'analytics[View analytics]' \\
        'logs[View logs]' \\
        'config[Manage config]' \\
        'warmup[SMTP warmup]' \\
        'doctor[Check setup]' \\
        'mcp[MCP config]' \\
        'open[Open in browser]' \\
        'completion[Shell completion]'
      ;;
    args)
      case \$line[1] in
        auth)        _values 'action' login logout ;;
        emails)      _values 'action' send list get cancel batch stats ;;
        campaigns)   _values 'action' list get send ;;
        subscribers) _values 'action' list get add remove ;;
        templates)   _values 'action' list get create delete versions ;;
        domains)     _values 'action' list add verify records delete ;;
        webhooks)    _values 'action' list create delete test events ;;
        topics)      _values 'action' list create delete ;;
        keys)        _values 'action' list create revoke ;;
        analytics)   _values 'action' overview campaign send-time ;;
        logs)        _values 'action' list tail ;;
        config)      _values 'action' init set-key set-url show ;;
        warmup)      _values 'action' status reset ;;
      esac
      ;;
  esac
}
_sendcraft "\$@"
`;

const POWERSHELL_COMPLETION = `
# SendCraft CLI PowerShell completion
# Usage: Add this to your PowerShell profile ($PROFILE)
#        Or run: sendcraft completion powershell >> $PROFILE

$_sendcraft_cmds = @('auth','emails','campaigns','subscribers','templates','domains','webhooks','topics','keys','analytics','logs','config','warmup','doctor','mcp','open','completion')
$_sendcraft_sub = @{
  'auth'        = @('login','logout')
  'emails'      = @('send','list','get','cancel','batch','stats')
  'campaigns'   = @('list','get','send')
  'subscribers' = @('list','get','add','remove')
  'templates'   = @('list','get','create','delete','versions')
  'domains'     = @('list','add','verify','records','delete')
  'webhooks'    = @('list','create','delete','test','events')
  'topics'      = @('list','create','delete')
  'keys'        = @('list','create','revoke')
  'analytics'   = @('overview','campaign','send-time')
  'logs'        = @('list','tail')
  'config'      = @('init','set-key','set-url','show')
  'warmup'      = @('status','reset')
  'open'        = @('dashboard','docs','billing','templates','campaigns','analytics','settings','status','github')
}

Register-ArgumentCompleter -Native -CommandName sendcraft -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)
  $tokens = $commandAst.CommandElements
  if ($tokens.Count -eq 1) {
    $_sendcraft_cmds | Where-Object { $_ -like "$wordToComplete*" } |
      ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
  } elseif ($tokens.Count -eq 2) {
    $cmd = $tokens[1].Value
    if ($_sendcraft_sub.ContainsKey($cmd)) {
      $_sendcraft_sub[$cmd] | Where-Object { $_ -like "$wordToComplete*" } |
        ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
    }
  }
}
`;

const FISH_COMPLETION = `
# SendCraft CLI fish completion
# Usage: sendcraft completion fish > ~/.config/fish/completions/sendcraft.fish

set -l cmds auth emails campaigns subscribers templates domains webhooks topics keys analytics logs config warmup doctor mcp open completion

complete -c sendcraft -f -n '__fish_use_subcommand' -a "$cmds"

complete -c sendcraft -f -n '__fish_seen_subcommand_from auth'        -a 'login logout'
complete -c sendcraft -f -n '__fish_seen_subcommand_from emails'       -a 'send list get cancel batch stats'
complete -c sendcraft -f -n '__fish_seen_subcommand_from campaigns'    -a 'list get send'
complete -c sendcraft -f -n '__fish_seen_subcommand_from subscribers'  -a 'list get add remove'
complete -c sendcraft -f -n '__fish_seen_subcommand_from templates'    -a 'list get create delete versions'
complete -c sendcraft -f -n '__fish_seen_subcommand_from domains'      -a 'list add verify records delete'
complete -c sendcraft -f -n '__fish_seen_subcommand_from webhooks'     -a 'list create delete test events'
complete -c sendcraft -f -n '__fish_seen_subcommand_from topics'       -a 'list create delete'
complete -c sendcraft -f -n '__fish_seen_subcommand_from keys'         -a 'list create revoke'
complete -c sendcraft -f -n '__fish_seen_subcommand_from analytics'    -a 'overview campaign send-time'
complete -c sendcraft -f -n '__fish_seen_subcommand_from logs'         -a 'list tail'
complete -c sendcraft -f -n '__fish_seen_subcommand_from config'       -a 'init set-key set-url show'
complete -c sendcraft -f -n '__fish_seen_subcommand_from warmup'       -a 'status reset'
`;

module.exports = new Command('completion')
  .description('Generate shell completion script')
  .argument('[shell]', 'Shell: bash | zsh | powershell | fish', 'bash')
  .addHelpText('after', `
Examples:
  $ sendcraft completion bash >> ~/.bashrc && source ~/.bashrc
  $ sendcraft completion zsh  > \${fpath[1]}/_sendcraft
  $ sendcraft completion powershell >> $PROFILE
  $ sendcraft completion fish > ~/.config/fish/completions/sendcraft.fish
`)
  .action((shell) => {
    switch (shell.toLowerCase()) {
      case 'bash':        process.stdout.write(BASH_COMPLETION);        break;
      case 'zsh':         process.stdout.write(ZSH_COMPLETION);         break;
      case 'powershell':
      case 'pwsh':        process.stdout.write(POWERSHELL_COMPLETION);  break;
      case 'fish':        process.stdout.write(FISH_COMPLETION);        break;
      default:
        console.error(chalk.red(`  Unknown shell: ${shell}.`));
        console.error('  Supported: bash | zsh | powershell | fish');
        process.exit(1);
    }
  });
