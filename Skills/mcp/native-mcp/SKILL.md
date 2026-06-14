---
name: native-mcp
description: "MCP client: connect servers, register tools (stdio/HTTP)."
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [MCP, Tools, Integrations]
    related_skills: [mcporter]
---

# Native MCP Client

Hermes Agent has a built-in MCP client that connects to MCP servers at startup, discovers their tools, and makes them available as first-class tools the agent can call directly. No bridge CLI needed -- tools from MCP servers appear alongside built-in tools like `terminal`, `read_file`, etc.

## When to Use

Use this whenever you want to:
- Connect to MCP servers and use their tools from within Hermes Agent
- Add external capabilities (filesystem access, GitHub, databases, APIs) via MCP
- Run local stdio-based MCP servers (npx, uvx, or any command)
- Connect to remote HTTP/StreamableHTTP MCP servers
- Have MCP tools auto-discovered and available in every conversation

For ad-hoc, one-off MCP tool calls from the terminal without configuring anything, see the `mcporter` skill instead.

## Prerequisites

- **mcp Python package** -- optional dependency. Install with `pip install mcp` or `uv pip install mcp`. If not installed, MCP support is silently disabled.
- **Node.js** -- required for `npx`-based MCP servers (most community servers)
- **uv** -- required for `uvx`-based MCP servers (Python-based servers)

> **Docker users:** The official Hermes Docker image runs the agent from `/opt/hermes/.venv/bin/python`. You must install `mcp` into that venv (not system Python) and place `config.yaml` under `/opt/data/.hermes/` (not `~/.hermes/`). See the *Troubleshooting* section below.

Install the MCP SDK:

```bash
# Local / non-Docker
pip install mcp
# or, if using uv:
uv pip install mcp

# Docker / official Hermes image
uv pip install --python /opt/hermes/.venv/bin/python mcp
```

## Quick Start

Add MCP servers to `~/.hermes/config.yaml` under the `mcp_servers` key:

```yaml
mcp_servers:
  time:
    command: "uvx"
    args: ["mcp-server-time"]
```

Restart Hermes Agent. On startup it will:
1. Connect to the server
2. Discover available tools
3. Register them with the prefix `mcp_time_*`
4. Inject them into all platform toolsets

You can then use the tools naturally -- just ask the agent to get the current time.

## Configuration Reference

Each entry under `mcp_servers` is a server name mapped to its config. There are two transport types: **stdio** (command-based) and **HTTP** (url-based).

### Stdio Transport (command + args)

```yaml
mcp_servers:
  server_name:
    command: "npx"             # (required) executable to run
    args: ["-y", "pkg-name"]   # (optional) command arguments, default: []
    env:                       # (optional) environment variables for the subprocess
      SOME_API_KEY: "value"
    timeout: 120               # (optional) per-tool-call timeout in seconds, default: 120
    connect_timeout: 60        # (optional) initial connection timeout in seconds, default: 60
```

### HTTP Transport (url)

```yaml
mcp_servers:
  server_name:
    url: "https://my-server.example.com/mcp"   # (required) server URL
    headers:                                     # (optional) HTTP headers
      Authorization: "Bearer sk-..."
    timeout: 180               # (optional) per-tool-call timeout in seconds, default: 120
    connect_timeout: 60        # (optional) initial connection timeout in seconds, default: 60
```

### All Config Options

| Option            | Type   | Default | Description                                       |
|-------------------|--------|---------|---------------------------------------------------|
| `command`         | string | --      | Executable to run (stdio transport, required)     |
| `args`            | list   | `[]`    | Arguments passed to the command                   |
| `env`             | dict   | `{}`    | Extra environment variables for the subprocess    |
| `url`             | string | --      | Server URL (HTTP transport, required)             |
| `headers`         | dict   | `{}`    | HTTP headers sent with every request              |
| `timeout`         | int    | `120`   | Per-tool-call timeout in seconds                  |
| `connect_timeout` | int    | `60`    | Timeout for initial connection and discovery      |

Note: A server config must have either `command` (stdio) or `url` (HTTP), not both.

## How It Works

### Startup Discovery

When Hermes Agent starts, `discover_mcp_tools()` is called during tool initialization:

1. Reads `mcp_servers` from `~/.hermes/config.yaml`
2. For each server, spawns a connection in a dedicated background event loop
3. Initializes the MCP session and calls `list_tools()` to discover available tools
4. Registers each tool in the Hermes tool registry

### Tool Naming Convention

MCP tools are registered with the naming pattern:

```
mcp_{server_name}_{tool_name}
```

Hyphens and dots in names are replaced with underscores for LLM API compatibility.

Examples:
- Server `filesystem`, tool `read_file` → `mcp_filesystem_read_file`
- Server `github`, tool `list-issues` → `mcp_github_list_issues`
- Server `my-api`, tool `fetch.data` → `mcp_my_api_fetch_data`

### Auto-Injection

After discovery, MCP tools are automatically injected into all `hermes-*` platform toolsets (CLI, Discord, Telegram, etc.). This means MCP tools are available in every conversation without any additional configuration.

### Connection Lifecycle

- Each server runs as a long-lived asyncio Task in a background daemon thread
- Connections persist for the lifetime of the agent process
- If a connection drops, automatic reconnection with exponential backoff kicks in (up to 5 retries, max 60s backoff)
- On agent shutdown, all connections are gracefully closed

### Idempotency

`discover_mcp_tools()` is idempotent -- calling it multiple times only connects to servers that aren't already connected. Failed servers are retried on subsequent calls.

## Transport Types

### Stdio Transport

The most common transport. Hermes launches the MCP server as a subprocess and communicates over stdin/stdout.

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
```

The subprocess inherits a **filtered** environment (see Security section below) plus any variables you specify in `env`.

### HTTP / StreamableHTTP Transport

For remote or shared MCP servers. Requires the `mcp` package to include HTTP client support (`mcp.client.streamable_http`).

```yaml
mcp_servers:
  remote_api:
    url: "https://mcp.example.com/mcp"
    headers:
      Authorization: "Bearer sk-..."
```

If HTTP support is not available in your installed `mcp` version, the server will fail with an ImportError and other servers will continue normally.

## Security

### Environment Variable Filtering

For stdio servers, Hermes does NOT pass your full shell environment to MCP subprocesses. Only safe baseline variables are inherited:

- `PATH`, `HOME`, `USER`, `LANG`, `LC_ALL`, `TERM`, `SHELL`, `TMPDIR`
- Any `XDG_*` variables

All other environment variables (API keys, tokens, secrets) are excluded unless you explicitly add them via the `env` config key. This prevents accidental credential leakage to untrusted MCP servers.

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      # Only this token is passed to the subprocess
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."
```

### Credential Stripping in Error Messages

If an MCP tool call fails, any credential-like patterns in the error message are automatically redacted before being shown to the LLM. This covers:

- GitHub PATs (`ghp_...`)
- OpenAI-style keys (`sk-...`)
- Bearer tokens
- Generic `token=`, `key=`, `API_KEY=`, `password=`, `secret=` patterns

## Docker / Container Deployment Pitfalls

When Hermes Agent runs inside a Docker container (e.g., the official `ghcr.io/hostinger/hvps-hermes-agent` image), MCP setup has extra steps beyond the local-machine instructions above.

### Config must be on the persistent volume

The container's `$HOME` (`/root`) is **not** persistent across restarts. Hermes stores durable state under `HERMES_HOME=/opt/data`.

- **Wrong:** `~/.hermes/config.yaml` (inside container — disappears on redeploy)
- **Right:** `/opt/data/.hermes/config.yaml` (mounted volume — survives restarts)

### Install `mcp` into the Hermes venv, not system Python

The container's `PATH` may not include `pip`, and the Hermes process runs from its own virtual environment.

- **Wrong:** `pip install mcp` or `uv pip install mcp` (installs to system Python, which Hermes doesn't use)
- **Right:** `/opt/hermes/.venv/bin/python -m pip install mcp` or `uv pip install --python /opt/hermes/.venv/bin/python mcp`

Verify the install by running:
```bash
/opt/hermes/.venv/bin/python -c "import mcp; print('ok')"
```

### Restart is required after installing the package

Hermes discovers MCP servers **at startup**. If you install the `mcp` package while the agent is already running, you must restart the container for the native MCP client to activate. There is no hot-reload.

### Node.js may not be in the Hermes venv

Many MCP servers (including `@modelcontextprotocol/server-github`) are distributed via `npm`/`npx`. The container image usually has Node.js installed at the system level (`/usr/bin/npx`), so `command: "npx"` in `config.yaml` typically works without extra setup — but verify with `which npx` inside the container.

## User-Preference Pitfalls

### User explicitly prefers direct API calls over MCP setup

When a user says something like *"Não configure o MCP, apenas use assim quando necessário"* (Don't configure MCP, just use it like this when needed) or *"just use the API directly"*, **stop all MCP setup immediately**. Do not:
- Install the `mcp` package
- Edit `config.yaml` with `mcp_servers`
- Ask the user to restart the container
- Attempt to spawn MCP server processes

Instead, switch to direct REST API calls via `curl` using the user's saved token (from memory or `/opt/data/.hermes/config.yaml`). Document the preference in memory so future sessions skip MCP setup for that service entirely.

See `references/github-api-fallback.md` for the direct-API workflow pattern.

## Troubleshooting

### "MCP SDK not available -- skipping MCP tool discovery"

The `mcp` Python package is not installed. Install it:

```bash
pip install mcp
# OR if pip is not available:
uv pip install --python /opt/hermes/.venv/bin/python mcp
```

### "No MCP servers configured"

No `mcp_servers` key in `~/.hermes/config.yaml`, or it's empty. Add at least one server.

### "Failed to connect to MCP server 'X'"

Common causes:
- **Command not found**: The `command` binary isn't on PATH. Ensure `npx`, `uvx`, or the relevant command is installed.
- **Package not found**: For npx servers, the npm package may not exist or may need `-y` in args to auto-install.
- **Timeout**: The server took too long to start. Increase `connect_timeout`.
- **Port conflict**: For HTTP servers, the URL may be unreachable.

### "MCP server 'X' requires HTTP transport but mcp.client.streamable_http is not available"

Your `mcp` package version doesn't include HTTP client support. Upgrade:

```bash
pip install --upgrade mcp
```

### Tools not appearing

- Check that the server is listed under `mcp_servers` (not `mcp` or `servers`)
- Ensure the YAML indentation is correct
- Look at Hermes Agent startup logs for connection messages
- Tool names are prefixed with `mcp_{server}_{tool}` -- look for that pattern

### "MCP SDK not available -- skipping MCP tool discovery" (Docker deployments)

In Docker deployments the `mcp` package must be installed into the Hermes venv, not system Python:

```bash
# NOT this (system Python has no pip, and Hermes ignores it anyway):
pip install mcp

# DO this — install into the Hermes venv using uv:
uv pip install --python /opt/hermes/.venv/bin/python mcp
```

After installing, **restart the Hermes container** so the agent discovers the SDK on startup.

### Config file not found after restart (Docker)

In the official Docker image `HERMES_HOME=/opt/data`. The config file must live at `/opt/data/.hermes/config.yaml`, **not** `~/.hermes/config.yaml` (the latter is inside the ephemeral container layer and disappears on restart).

Always verify:
```bash
cat /opt/data/.hermes/config.yaml
```

### "command not found: npx" / "command not found: uvx"

The subprocess PATH in Docker may differ from your shell. Check that the binary exists before configuring:

```bash
which npx   # /usr/bin/npx
which uvx   # verify uvx is available
```

If missing, install Node.js or uv in the container image, or use HTTP transport instead.

### Connection keeps dropping

The client retries up to 5 times with exponential backoff (1s, 2s, 4s, 8s, 16s, capped at 60s). If the server is fundamentally unreachable, it gives up after 5 attempts. Check the server process and network connectivity.

## Quick-start Templates

Ready-to-use config templates live in the skill's `templates/` directory and can be copied directly into `~/.hermes/config.yaml`:

- **`templates/github-mcp-config.yaml`** — GitHub server with token placeholder and scope hints.

## Examples

### Time Server (uvx)

```yaml
mcp_servers:
  time:
    command: "uvx"
    args: ["mcp-server-time"]
```

Registers tools like `mcp_time_get_current_time`.

### Filesystem Server (npx)

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/documents"]
    timeout: 30
```

Registers tools like `mcp_filesystem_read_file`, `mcp_filesystem_write_file`, `mcp_filesystem_list_directory`.

### GitHub Server with Authentication

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxxxxxxxxxxxxxxxxxxx"
    timeout: 60
```

Registers tools like `mcp_github_list_issues`, `mcp_github_create_pull_request`, etc.

### Remote HTTP Server

```yaml
mcp_servers:
  company_api:
    url: "https://mcp.mycompany.com/v1/mcp"
    headers:
      Authorization: "Bearer sk-xxxxxxxxxxxxxxxxxxxx"
      X-Team-Id: "engineering"
    timeout: 180
    connect_timeout: 30
```

### Multiple Servers

```yaml
mcp_servers:
  time:
    command: "uvx"
    args: ["mcp-server-time"]

  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]

  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxxxxxxxxxxxxxxxxxxx"

  company_api:
    url: "https://mcp.internal.company.com/mcp"
    headers:
      Authorization: "Bearer sk-xxxxxxxxxxxxxxxxxxxx"
    timeout: 300
```

All tools from all servers are registered and available simultaneously. Each server's tools are prefixed with its name to avoid collisions.

## Sampling (Server-Initiated LLM Requests)

Hermes supports MCP's `sampling/createMessage` capability — MCP servers can request LLM completions through the agent during tool execution. This enables agent-in-the-loop workflows (data analysis, content generation, decision-making).

Sampling is **enabled by default**. Configure per server:

```yaml
mcp_servers:
  my_server:
    command: "npx"
    args: ["-y", "my-mcp-server"]
    sampling:
      enabled: true           # default: true
      model: "gemini-3-flash" # model override (optional)
      max_tokens_cap: 4096    # max tokens per request
      timeout: 30             # LLM call timeout (seconds)
      max_rpm: 10             # max requests per minute
      allowed_models: []      # model whitelist (empty = all)
      max_tool_rounds: 5      # tool loop limit (0 = disable)
      log_level: "info"       # audit verbosity
```

Servers can also include `tools` in sampling requests for multi-turn tool-augmented workflows. The `max_tool_rounds` config prevents infinite tool loops. Per-server audit metrics (requests, errors, tokens, tool use count) are tracked via `get_mcp_status()`.

Disable sampling for untrusted servers with `sampling: { enabled: false }`.

## References

- `references/github-api-fallback.md` — Direct GitHub REST API calls via curl when the native MCP client is not yet active (container hasn't restarted after package install, etc.)

## Pitfalls

### User prefers direct API over MCP
When a user explicitly states they do NOT want MCP configured and prefers direct API calls instead (e.g. *"Não configure o mcp apenas use assim quando nescessário"* / *"Don't configure MCP, just use it directly when needed"*), **respect the preference immediately**. Do not insist on MCP setup or request additional restarts.

Fallback workflow:
1. Use `curl` with the user's stored token (read from memory or config file)
2. Call the API directly (e.g. `curl -H "Authorization: Bearer $TOKEN" https://api.github.com/...`)
3. Store the token in memory for future sessions if the user requests it
4. Skip all MCP connection, discovery, and tool-prefix logic

This pattern is common when:
- The user wants immediate results without installing extra packages
- The container environment lacks `mcp` Python package or Node.js
- The user operates multiple agents and prefers a simpler, stateless approach

## Notes

- MCP tools are called synchronously from the agent's perspective but run asynchronously on a dedicated background event loop
- Tool results are returned as JSON with either `{"result": "..."}` or `{"error": "..."}`
- The native MCP client is independent of `mcporter` -- you can use both simultaneously
- Server connections are persistent and shared across all conversations in the same agent process
- Adding or removing servers requires restarting the agent (no hot-reload currently)
- **User preference: if the user explicitly says not to configure MCP and to use direct API calls instead (e.g., `curl` with a bearer token), respect that preference. Store tokens securely and use the API directly when requested rather than insisting on MCP server setup.**
- For Docker/HVPS/Hostinger deployments, see `references/docker-deployment.md` for environment-specific paths and install procedures
