# MCP on Docker / HVPS / Hostinger Deployments

## Environment

| Variable | Value | Notes |
|----------|-------|-------|
| `HERMES_HOME` | `/opt/data` | Persistent volume; survives container restarts |
| Hermes venv | `/opt/hermes/.venv/bin/python` | The interpreter that runs the agent |
| `~/.hermes/` | `/root/.hermes/` | **Ephemeral** — disappears on container recreate |

## Where to place config.yaml

```bash
# ✓ Persistent (survives restart)
cat /opt/data/.hermes/config.yaml

# ✗ Ephemeral (lost on restart)
cat /root/.hermes/config.yaml
```

Always write MCP server configuration to `/opt/data/.hermes/config.yaml`.

## Where to install the mcp package

```bash
# ✓ Correct — install into the Hermes venv
uv pip install --python /opt/hermes/.venv/bin/python mcp

# ✗ Wrong — system Python is ignored by the agent
pip install mcp
```

The Docker image does **not** have `pip` or `pip3` in the venv, but `uv` is available globally.

## Restart requirement

Installing `mcp` or editing `config.yaml` **both** require a container restart for the agent to pick them up on startup discovery.

## Verification after restart

```bash
# Confirm config is in the right place
cat /opt/data/.hermes/config.yaml

# Confirm mcp is in the venv
/opt/hermes/.venv/bin/python -c "import mcp; print('ok')"

# Check startup logs for MCP discovery
# Look for: "Discovered N MCP tools" or "MCP SDK not available"
```

## Token security

Never paste GitHub PATs or API keys into chat messages. If a user shares a token:
1. Immediately warn them to revoke it
2. Write it directly to the config file via file tools (never echo it back)
3. In the config, the token is still stored in plaintext — remind the user that anyone with container/filesystem access can read it
