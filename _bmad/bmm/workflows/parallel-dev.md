---
description: Run multiple BMAD stories in parallel using independent agents in Git worktrees.
---

# Parallel Development Workflow

Use this workflow when multiple stories are in `ready-for-dev` status and you want to accelerate completion by running independent agents in isolated Git worktrees.

## Prerequisites

1. **Gemini CLI** must be installed and authenticated.
2. **Sprint Status** must have stories marked as `ready-for-dev`.

## Execution

### 1. Run All Ready Stories
// turbo
```bash
./scripts/parallel-story-runner.sh --all-ready
```

### 2. Run Specific Stories
// turbo
```bash
./scripts/parallel-story-runner.sh 4-3 6-4
```

### 3. Check Progress
Monitor logs in real-time:
```bash
tail -f logs/parallel-agents/4-3.log
```

## Post-Execution

1. Review the logs for each story.
2. The script updates `sprint-status.yaml` to `review` for successful runs.
3. Validate changes in the main branch (agents push or you merge worktree branches).
4. Run `./scripts/parallel-story-runner.sh --cleanup` to remove worktrees.
