---
description: Deploy and manage Supabase Edge Functions via MCP
---

# Supabase Edge Functions Skill

## Quick Deploy via MCP

Use the Supabase MCP server to deploy Edge Functions directly:

```
mcp_supabase-mcp-server_deploy_edge_function
  project_id: "dlflpvmdzkeouhgqwqba"
  name: "<function-name>"
  entrypoint_path: "index.ts"
  verify_jwt: true
  files: [{"name": "index.ts", "content": "<file-content>"}]
```

## Key Functions

| Function | Purpose |
|----------|---------|
| `regenerate-carousel-images` | AI image generation for carousels |
| `generate-style-embeddings` | Populate pgvector style embeddings |
| `generate-linkedin-carousel` | Create carousel content |
| `chat` | AI assistant with RAG |

## Check Logs

// turbo
```bash
# Via MCP
mcp_supabase-mcp-server_get_logs
  project_id: "dlflpvmdzkeouhgqwqba"
  service: "edge-function"
```

## List Functions

```
mcp_supabase-mcp-server_list_edge_functions
  project_id: "dlflpvmdzkeouhgqwqba"
```

## Common Issues

1. **Error 546** = Timeout (150s limit exceeded)
2. **CORS** = Add corsHeaders to response
3. **env vars** = Check Supabase Dashboard > Edge Functions > Secrets
