#!/bin/bash

# Parallel Story Runner for BMAD v6
# Spawns independent Gemini agents in Git worktrees to implement stories in parallel.
# Usage: ./scripts/parallel-story-runner.sh [--dry-run] [--all-ready] [--cleanup] [story-id...]

set -e

# Resolve the repo root (where this script is called from or the script's parent)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

STORY_DIR="$REPO_ROOT/_bmad-output/implementation-artifacts/stories"
SPRINT_STATUS="$REPO_ROOT/_bmad-output/implementation-artifacts/sprint-status.yaml"
PROJECT_CONTEXT="$REPO_ROOT/_bmad-output/project-context.md"
AGENTS_MD="$REPO_ROOT/AGENTS.md"
LOG_DIR="$REPO_ROOT/scripts/agent-logs"
WORKTREE_BASE="$(dirname "$REPO_ROOT")"  # parent of repo, e.g. ~/code

# Configuration
MAX_CONCURRENCY=3
USE_SANDBOX=false   # set --sandbox only when Gemini supports it with prompts
DRY_RUN=false

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

log()     { echo -e "[$(date +'%H:%M:%S')] $1"; }
log_ok()  { echo -e "[$(date +'%H:%M:%S')] ${GREEN}$1${NC}"; }
log_warn(){ echo -e "[$(date +'%H:%M:%S')] ${YELLOW}$1${NC}"; }
log_err() { echo -e "[$(date +'%H:%M:%S')] ${RED}$1${NC}"; }

usage() {
    echo ""
    echo "  Parallel Story Runner — BMAD v6"
    echo ""
    echo "  Usage: $0 [options] [story-id...]"
    echo ""
    echo "  Options:"
    echo "    --all-ready      Run all stories with 'Status: ready-for-dev'"
    echo "    --dry-run        Show what would happen without executing"
    echo "    --cleanup        Remove all lifetrek-wt-* worktrees"
    echo "    --max <n>        Max parallel agents (default: $MAX_CONCURRENCY)"
    echo "    --no-sandbox     Don't pass --sandbox to gemini"
    echo "    --help           Show this help"
    echo ""
    echo "  Examples:"
    echo "    $0 --dry-run 4-3 6-4"
    echo "    $0 4-3"
    echo "    $0 --all-ready"
    echo "    $0 --cleanup"
    echo ""
    exit 1
}

cleanup_worktrees() {
    log "Scanning for lifetrek-wt-* worktrees..."
    local removed=0
    while IFS= read -r line; do
        if [[ "$line" == worktree* ]]; then
            local wt_path="${line#worktree }"
            if [[ "$wt_path" == *"/lifetrek-wt-"* ]]; then
                log "  Removing: $wt_path"
                git -C "$REPO_ROOT" worktree remove --force "$wt_path" 2>/dev/null || true
                removed=$((removed + 1))
            fi
        fi
    done < <(git -C "$REPO_ROOT" worktree list --porcelain)
    log_ok "Cleanup done. Removed $removed worktree(s)."
}

update_sprint_status() {
    local story_id="$1"
    local new_status="$2"
    # Replace e.g. "  4-3: ready-for-dev" with "  4-3: review"
    # Use a temp file approach for portability
    local tmp
    tmp=$(mktemp)
    sed "s/  $story_id: [a-z-]*$/  $story_id: $new_status/" "$SPRINT_STATUS" > "$tmp"
    mv "$tmp" "$SPRINT_STATUS"
    log_ok "  sprint-status.yaml: $story_id → $new_status"
}

# ---------- main ----------

# Handle --cleanup as first arg
if [[ "${1:-}" == "--cleanup" ]]; then
    cleanup_worktrees
    exit 0
fi

# Parse args
STORIES=()
while [[ $# -gt 0 ]]; do
    case $1 in
        --all-ready)
            while IFS= read -r f; do
                # Extract just the numeric prefix, e.g. "4-3" from "4-3-operator-failure-recovery-ux.md"
                fname=$(basename "$f" .md)
                prefix=$(echo "$fname" | grep -oE '^[0-9]+-[0-9]+')
                [[ -n "$prefix" ]] && STORIES+=("$prefix")
            done < <(grep -rl "Status: ready-for-dev" "$STORY_DIR" 2>/dev/null)
            shift
            ;;
        --dry-run)   DRY_RUN=true;  shift ;;
        --no-sandbox) USE_SANDBOX=false; shift ;;
        --max)       MAX_CONCURRENCY="$2"; shift 2 ;;
        --help|-h)   usage ;;
        -*)          log_err "Unknown option: $1"; usage ;;
        *)           STORIES+=("$1"); shift ;;
    esac
done

if [[ ${#STORIES[@]} -eq 0 ]]; then
    log_err "No stories specified."
    usage
fi

echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log " BMAD Parallel Story Runner"
log " Stories  : ${STORIES[*]}"
log " Max para : $MAX_CONCURRENCY"
log " Dry-run  : $DRY_RUN"
log " Sandbox  : $USE_SANDBOX"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Only create log dir when actually running
if [[ "$DRY_RUN" == "false" ]]; then
    mkdir -p "$LOG_DIR"
fi

RUNNING_COUNT=0
PIDS=()
STORY_OF_PID=()

for STORY_ID in "${STORIES[@]}"; do
    # Match story file by prefix, e.g. "4-3" → "4-3-operator-failure-recovery-ux.md"
    STORY_FILE=$(ls "$STORY_DIR/${STORY_ID}-"*.md 2>/dev/null | head -1)

    if [[ -z "$STORY_FILE" || ! -f "$STORY_FILE" ]]; then
        log_err "Story not found for prefix '$STORY_ID' in $STORY_DIR — skipping."
        continue
    fi
    log "  File     : $(basename "$STORY_FILE")"

    WT_PATH="$WORKTREE_BASE/lifetrek-wt-$STORY_ID"
    LOG_FILE="$LOG_DIR/${STORY_ID}.log"

    log "📋 Story: $STORY_ID"
    log "   Worktree : $WT_PATH"
    log "   Log      : $LOG_FILE"

    if [[ "$DRY_RUN" == "true" ]]; then
        STORY_TITLE=$(grep -m1 "^# Story" "$STORY_FILE" | sed 's/^# //')
        log_warn "  [DRY-RUN] Would spawn: gemini -p '<prompt>' for: $STORY_TITLE"
        echo ""
        continue
    fi

    # — Worktree —
    if [[ -d "$WT_PATH" ]]; then
        log_warn "  Worktree exists, reusing: $WT_PATH"
    else
        log "  Creating worktree (branch story/$STORY_ID)..."
        git -C "$REPO_ROOT" worktree add "$WT_PATH" -b "story/$STORY_ID" 2>&1 | sed 's/^/    /'
    fi

    # — Build prompt file —
    PROMPT_FILE="$WT_PATH/.agent_prompt.txt"
    {
        cat "$AGENTS_MD"
        echo -e "\n---\n"
        cat "$PROJECT_CONTEXT"
        echo -e "\n---\n"
        echo "IMPLEMENTATION TASK:"
        echo "You are a Dev Agent implementing a BMAD v6 user story."
        echo "Read the story below and implement it exactly, following all acceptance criteria."
        echo "Do NOT gold-plate — only do what the story requires."
        echo "When done, run: npm run build (must pass)."
        echo ""
        echo "STORY:"
        cat "$STORY_FILE"
    } > "$PROMPT_FILE"

    # — Sandbox flag —
    SANDBOX_FLAG=""
    if [[ "$USE_SANDBOX" == "true" ]]; then
        SANDBOX_FLAG="--sandbox"
    fi

    # — Spawn agent in background —
    log_ok "  Spawning Gemini agent (logs → $LOG_FILE)"
    (
        set +e
        cd "$WT_PATH"

        # Install deps if missing
        if [[ ! -d "node_modules" ]]; then
            log "  [$STORY_ID] Installing node_modules..." | tee -a "$LOG_FILE"
            npm ci --silent >> "$LOG_FILE" 2>&1
        fi

        # Run gemini
        PROMPT=$(cat .agent_prompt.txt)
        gemini -p "$PROMPT" $SANDBOX_FLAG >> "$LOG_FILE" 2>&1
        EXIT_CODE=$?

        if [[ $EXIT_CODE -eq 0 ]]; then
            echo "" >> "$LOG_FILE"
            echo "[SUCCESS] Story $STORY_ID completed." >> "$LOG_FILE"
            # Update sprint status
            # Update sprint-status.yaml (key is full slug, not just prefix)
        STORY_SLUG=$(basename "$STORY_FILE" .md)
        update_sprint_status "$STORY_SLUG" "review"
        else
            echo "" >> "$LOG_FILE"
            echo "[FAILED] Story $STORY_ID exited with code $EXIT_CODE" >> "$LOG_FILE"
            log_err "  [$STORY_ID] agent FAILED — see $LOG_FILE"
        fi
    ) &

    PIDS+=($!)
    STORY_OF_PID+=("$STORY_ID")
    RUNNING_COUNT=$((RUNNING_COUNT + 1))
    echo ""

    # — Concurrency gate —
    if [[ $RUNNING_COUNT -ge $MAX_CONCURRENCY ]]; then
        log_warn "Concurrency limit ($MAX_CONCURRENCY) reached — waiting for one agent to finish..."
        # Wait for the earliest background job
        wait "${PIDS[0]}"
        PIDS=("${PIDS[@]:1}")
        STORY_OF_PID=("${STORY_OF_PID[@]:1}")
        RUNNING_COUNT=$((RUNNING_COUNT - 1))
    fi
done

# Wait for all remaining agents
if [[ ${#PIDS[@]} -gt 0 ]]; then
    log "Waiting for remaining agents: ${STORY_OF_PID[*]} ..."
    wait "${PIDS[@]}"
fi

echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_ok " All agents done!"
if [[ "$DRY_RUN" == "false" ]]; then
    log " Logs: $LOG_DIR"
    log " Worktrees: $WORKTREE_BASE/lifetrek-wt-*"
    log " Run --cleanup to remove worktrees when done."
fi
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
