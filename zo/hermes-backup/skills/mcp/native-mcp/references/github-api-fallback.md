# GitHub API Direct-Access Workflow

When the user prefers direct REST API calls over MCP setup (explicitly stated as *"não configure o MCP, apenas use assim quando necessário"* or similar), use `curl` against the GitHub REST API. This avoids package installs, config edits, and container restarts.

## Token Sources

Read the PAT from the first available source:

1. **User memory** — check if a GitHub PAT is already stored
2. **`/opt/data/.hermes/config.yaml`** — look under `mcp_servers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN`
3. **Ask the user** — only if neither source has it

```bash
# Extract token from config
grep -o 'ghp_[A-Za-z0-9_]*' /opt/data/.hermes/config.yaml
```

## Common Operations

### List user repositories

```bash
TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
curl -s -H "Authorization: Bearer $TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     "https://api.github.com/user/repos?sort=updated&per_page=20" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for r in data:
    print(r['full_name'], r.get('description',''), r['updated_at'][:10])
"
```

### Download a repository as zipball

```bash
OWNER="aajunior43"
REPO="openclaw-backup"
TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
BRANCH="main"

curl -sL -H "Authorization: Bearer $TOKEN" \
     -o "${REPO}.zip" \
     "https://api.github.com/repos/${OWNER}/${REPO}/zipball/${BRANCH}"
```

Then extract with Python (since `unzip` may not be available):

```python3
import zipfile, os, glob
with zipfile.ZipFile('REPO.zip') as z:
    z.extractall('.')
folder = glob.glob('OWNER-REPO-*')[0]
os.rename(folder, REPO)
```

### Create an issue

```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/OWNER/REPO/issues" \
  -d '{"title":"Title","body":"Body"}'
```

### Read file contents

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     "https://api.github.com/repos/OWNER/REPO/contents/PATH"
```

### Get repo metadata

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     "https://api.github.com/repos/OWNER/REPO"
```

## Notes

- Authenticated rate limit: **5,000 requests/hour**
- `repo` scope required for private repositories
- This is **not just a fallback** — when the user explicitly prefers direct API access, treat it as the primary workflow
- For users comfortable sharing tokens in chat, save them to memory immediately and use from there in future sessions
- The native MCP client (`mcp_github_*`) remains preferable **only when the user has explicitly requested or accepted MCP setup**
