---
description: Enforce visual verification, screenshot capture, and user approval before completing tasks.
---

# Visual Verification & Approval Workflow

This workflow MUST be followed before marking any UI-related task as "Done" or "Completed".

1. **Prerequisite Check**
   - Ensure the development server is running (usually port 8080).
   - If not, start it: `npm run dev:web`.

2. **Visual Verification**
   - Use the browser tool to navigate to the feature/page you worked on.
   - Interact with the feature if necessary to show its state.
   - **MANDATORY**: Capture a screenshot or recording of the result.

3. **User Notification & Approval**
   - Use `notify_user` to send the screenshot path to the user.
   - **CRITICAL**: Explicitly ask: "Does this look correct? I need your approval to mark this as done."
   - Set `BlockedOnUser: true`.

4. **Completion**
   - ONLY after the user confirms (e.g., "Looks good", "Approved"), you may mark the task as `[x]` in `task.md`.
   - If the user requests changes, return to the **Implementation** phase, then repeat this workflow.
