# Reference: Direct GitHub API via curl (Session 2026-05-09)

## Context
User (Junior / aajunior43) explicitly rejected MCP setup and prefers direct `curl` API calls.
Token is stored in `/opt/data/.hermes/config.yaml` under the `mcp_servers.github.env` key.

## Token Extraction Command

```bash
TOKEN=$(grep -o 'ghp_[A-Za-z0-9_]*' /opt/data/.hermes/config.yaml | head -1)
```

## Verified API Calls from Session

### List repos (last 10 updated)
```bash
TOKEN=$(grep -o 'ghp_[A-Za-z0-9_]*' /opt/data/.hermes/config.yaml | head -1)
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/user/repos?sort=updated&per_page=10" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for repo in data:
    visibility = '🔒' if repo['private'] else '🌐'
    lang = repo.get('language') or 'N/A'
    print(f\"{visibility} {repo['full_name']}\")
    print(f\"   📝 {repo.get('description') or 'Sem descrição'}\")
    print(f\"   ⭐ {repo['stargazers_count']} | 🍴 {repo['forks_count']} | 💻 {lang} | 🕐 {repo['updated_at'][:10]}\")
    print()
"
```

### Read file contents
```bash
TOKEN=$(grep -o 'ghp_[A-Za-z0-9_]*' /opt/data/.hermes/config.yaml | head -1)
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/OWNER/REPO/contents/PATH/FILE | python3 -c "
import sys, json, base64
r = json.load(sys.stdin)
if 'content' in r:
    print(base64.b64decode(r['content']).decode('utf-8'))
else:
    print(r.get('message', 'Error'))
"
```

### Search code
```bash
TOKEN=$(grep -o 'ghp_[A-Za-z0-9_]*' /opt/data/.hermes/config.yaml | head -1)
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.github.com/search/code?q=QUERY+repo:OWNER/REPO" | python3 -c "
import sys, json
r = json.load(sys.stdin)
for item in r.get('items', []):
    print(f\"{item['html_url']}  ({item['path']})\")
"
```

### List issues
```bash
TOKEN=$(grep -o 'ghp_[A-Za-z0-9_]*' /opt/data/.hermes/config.yaml | head -1)
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.github.com/repos/OWNER/REPO/issues?state=open&per_page=10" | python3 -c "
import sys, json
for i in json.load(sys.stdin):
    print(f\"#{i['number']} [{i['state']}] {i['title']}\")
    print(f\"   👤 @{i['user']['login']}  🕐 {i['created_at'][:10]}\")
    print()
"
```

### Create issue
```bash
TOKEN=$(grep -o 'ghp_[A-Za-z0-9_]*' /opt/data/.hermes/config.yaml | head -1)
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/OWNER/REPO/issues \
  -d '{"title": "TITLE", "body": "BODY", "labels": ["bug"]}'
```

### Create pull request
```bash
TOKEN=$(grep -o 'ghp_[A-Za-z0-9_]*' /opt/data/.hermes/config.yaml | head -1)
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/OWNER/REPO/pulls \
  -d '{
    "title": "PR title",
    "body": "Description",
    "head": "feature-branch",
    "base": "main"
  }'
```

## User Preferences
- Name: Aleksandro Alves da Rocha Junior. Goes by **Junior**.
- Do NOT call him "Professor" (he corrected this explicitly).
- GitHub username: `aajunior43`
- Email: aajunior43@gmail.com
- Prefers direct API via curl over MCP configuration.
- When asked about GitHub, do not suggest installing MCP or restarting the agent.
