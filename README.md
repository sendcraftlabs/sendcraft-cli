# sendcraft-cli

<p align="center">
  <img src="https://sendcraft.online/logo.png" alt="SendCraft" width="72" />
</p>

<p align="center">
  <strong>Official CLI for <a href="https://sendcraft.online">SendCraft</a> — send emails, manage campaigns, domains, subscribers, and more from your terminal.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/sendcraft-cli"><img src="https://img.shields.io/npm/v/sendcraft-cli?color=6366f1&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/sendcraft-cli"><img src="https://img.shields.io/npm/dm/sendcraft-cli?color=10b981&label=downloads" alt="downloads" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="node" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" />
</p>

---

## Installation

### Standalone binary (no Node.js required)

**macOS / Linux**
```bash
curl -fsSL https://sendcraft.online/install.sh | bash
```

**Windows (PowerShell)**
```powershell
iwr https://sendcraft.online/install.ps1 | iex
```

### via npm

```bash
npm install -g sendcraft-cli
```

---

## Quick start

```bash
# Authenticate
sendcraft login

# Send an email
sendcraft emails send \
  --to hello@example.com \
  --from you@yourdomain.com \
  --subject "Hello from CLI" \
  --html "<h1>It works!</h1>"

# Check everything is working
sendcraft doctor
```

---

## Commands

### Auth
```bash
sendcraft auth login          # Save API key interactively
sendcraft auth logout         # Remove saved credentials
```

### Emails
```bash
sendcraft emails send         # Send a transactional email
sendcraft emails list         # List sent emails
sendcraft emails get <id>     # Email details
sendcraft emails cancel <id>  # Cancel a scheduled email
sendcraft emails batch <file> # Batch send from JSON (up to 100)
sendcraft emails stats        # Delivery stats summary
```

**Send flags**

| Flag | Description |
|------|-------------|
| `-t, --to <emails...>` | Recipient(s) — required |
| `-f, --from <email>` | Sender address — required |
| `-s, --subject <text>` | Subject line — required |
| `--html <html>` | HTML body (inline) |
| `--html-file <file>` | Path to HTML file |
| `--text <text>` | Plain-text body |
| `--cc <emails...>` | CC recipients |
| `--bcc <emails...>` | BCC recipients |
| `--reply-to <email>` | Reply-To address |
| `--schedule <when>` | Natural language: `"tomorrow at 9am"`, `"in 2 hours"`, ISO 8601 |
| `--idempotency-key <key>` | Prevent duplicate sends |
| `--json` | Raw JSON output |

**Examples**
```bash
# Send HTML from a file
sendcraft emails send \
  --to alice@example.com \
  --from hello@myapp.com \
  --subject "Welcome!" \
  --html-file templates/welcome.html

# Schedule with natural language
sendcraft emails send \
  --to team@myapp.com --from me@myapp.com \
  --subject "Weekly digest" --html-file digest.html \
  --schedule "next Monday at 9am"

# Batch send
sendcraft emails batch ./emails.json
# emails.json: [{ "to": "...", "from": "...", "subject": "...", "html": "..." }, ...]
```

### Campaigns
```bash
sendcraft campaigns list            # List campaigns
sendcraft campaigns get <id>        # Campaign details
sendcraft campaigns send <id>       # Send immediately or schedule
  --schedule "2026-06-01T09:00:00Z"
```

### Subscribers
```bash
sendcraft subscribers list                   # List subscribers
sendcraft subscribers get <email>            # Subscriber details
sendcraft subscribers add -e <email>         # Add a subscriber
sendcraft subscribers remove <email>         # Unsubscribe (or --delete to permanently remove)
```

### Templates
```bash
sendcraft templates list                         # List templates
sendcraft templates get <id>                     # Template details
sendcraft templates create -n "Name" -s "Subj" --html-file tmpl.html
sendcraft templates delete <id>                  # Delete
sendcraft templates versions list <id>           # Version history
sendcraft templates versions restore <id> <ver>  # Restore version
```

### Domains
```bash
sendcraft domains list                   # List domains
sendcraft domains add <domain>           # Add domain
sendcraft domains verify <domain>        # Trigger DNS check
sendcraft domains records <domain>       # Show required DNS records
sendcraft domains delete <domain>        # Remove domain
```

### Webhooks
```bash
sendcraft webhooks list                  # List endpoints
sendcraft webhooks create -u <url>       # Create endpoint
sendcraft webhooks delete <id>           # Delete endpoint
sendcraft webhooks test <id>             # Send a test ping
sendcraft webhooks events                # List all event types
```

### Topics
```bash
sendcraft topics list                    # List topics / mailing lists
sendcraft topics create -n "Name"        # Create a topic
sendcraft topics delete <id>             # Delete a topic
```

### API Keys
```bash
sendcraft keys list                      # List keys
sendcraft keys create -n "Name"          # Create key
  --scope sending_access                 # or full_access (default)
  --domains example.com newsletter.com   # Restrict to domains
  --expires "in 90 days"                 # Set expiry
sendcraft keys revoke <id>               # Revoke key
```

### Analytics
```bash
sendcraft analytics overview             # Overall stats (default: last 30 days)
  --days 7
sendcraft analytics campaign <id>        # Per-campaign stats
sendcraft analytics send-time            # AI-optimised send time recommendation
```

### Logs
```bash
sendcraft logs list                      # Audit log (paginated)
  --action email.sent                    # Filter by event type
sendcraft logs tail                      # Stream live events (SSE)
```

### Config
```bash
sendcraft config init                    # Interactive setup wizard
sendcraft config set-key <key>           # Set API key
sendcraft config set-url <url>           # Override base URL (self-hosted)
sendcraft config show                    # Print config
```

### Utilities
```bash
sendcraft warmup status                  # SMTP IP warmup progress
sendcraft warmup reset                   # Reset warmup (admin)
sendcraft doctor                         # Check config + connectivity
sendcraft mcp                            # Claude Desktop MCP config
sendcraft mcp --json                     # Machine-readable MCP config
sendcraft open [page]                    # Open in browser (dashboard|docs|billing|…)
sendcraft completion bash                # Bash completion script
sendcraft completion zsh                 # Zsh completion script
```

---

## Shell completion

```bash
# bash
sendcraft completion bash >> ~/.bashrc && source ~/.bashrc

# zsh
sendcraft completion zsh > ~/.zsh/completions/_sendcraft
```

---

## JSON output

Every command supports `--json` for scripting:

```bash
# Get email ID after send
ID=$(sendcraft emails send -t x@y.com -f me@y.com -s "Hi" --html "<p>Hello</p>" --json | jq -r '.data.id')

# List campaign IDs
sendcraft campaigns list --json | jq '.[].id'

# Check open rate
sendcraft analytics overview --json | jq '.openRate'
```

---

## CI/CD

```yaml
# GitHub Actions
- name: Send deploy notification
  env:
    SENDCRAFT_API_KEY: ${{ secrets.SENDCRAFT_API_KEY }}
  run: |
    npx sendcraft-cli@2 emails send \
      --to team@myapp.com \
      --from deploys@myapp.com \
      --subject "Deployed ${{ github.sha }}" \
      --html "<p>Deploy complete ✓</p>"
```

---

## Self-hosted

```bash
sendcraft config set-url https://api.yourinstance.com/api
sendcraft config set-key your-api-key
sendcraft doctor
```

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `SENDCRAFT_API_KEY` | API key — overrides config file |
| `SENDCRAFT_BASE_URL` | API base URL — for self-hosted instances |

---

## Building standalone binaries

```bash
cd sdk/cli
npm install
npm run build:bin
# Outputs: dist/sendcraft-linux-x64  dist/sendcraft-macos-x64
#          dist/sendcraft-macos-arm64  dist/sendcraft-win-x64.exe
```

---

## Related

| Package | Description |
|---------|-------------|
| [`sendcraft-sdk`](https://www.npmjs.com/package/sendcraft-sdk) | Node.js SDK |
| [`sendcraft-sdk` (PyPI)](https://pypi.org/project/sendcraft-sdk/) | Python SDK |
| [`sendcraft-mcp`](https://www.npmjs.com/package/sendcraft-mcp) | MCP server for AI agents |

---

## License

MIT © [SendCraft](https://sendcraft.online)
