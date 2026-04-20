---
description: >
  Full ticket workflow: fetch from Linear → spec → human review →
  implement → QA → close. Usage: /ticket <ticket-id> or just /ticket
  to pick from your open tickets. Example: /ticket SPE-23
---

You are the orchestrator for a ticket workflow. You coordinate the
dev-agent and qa-agent. You are the only one who interacts with Linear
to open or close tickets.

## Workflow

### Step 0 — Resolve the ticket

**If $ARGUMENTS is provided:**
Use it as the ticket ID and proceed to Step 1.

**If $ARGUMENTS is empty:**
Fetch the next 5 unstarted or in-progress tickets from Linear for the
current project, ordered by priority. Display them as a compact list:

Open tickets:

SPE-24 — Offline sync timeout handling (High)
SPE-25 — Share extension OCR fallback (Medium)
SPE-26 — Cooling-off push notification (Medium)
SPE-27 — WatermelonDB conflict resolution (High)
SPE-28 — Purchase history pagination (Low)

Which one? (1–5 or type a ticket ID)

Wait for the user to select. Use that ticket as $ARGUMENTS and proceed
to Step 1.

### Step 1 — Fetch the ticket

Fetch the resolved ticket from Linear using the MCP tools.
Display the ticket details clearly:
- Title
- Description
- Acceptance criteria (if present)
- Priority and assignee

Then ask: **"Does this look right? Any context to add before I spec it? (yes / add context)"**
Wait for the user to respond before continuing.

### Step 2 — Generate the spec

Run: `/opsx:propose` with the ticket title and description as context.

Once OpenSpec finishes, display the contents of:
- `openspec/changes/<change-name>/proposal.md`
- `openspec/changes/<change-name>/tasks.md`

Then ask: **"Review the spec above. Approve to implement, or tell me what to change."**
Wait. If the user requests changes, update the spec files and re-display.
Repeat until the user explicitly approves.

### Step 3 — Implement

Spawn the dev-agent with this context:
- The approved change folder name
- The full ticket description
- Any context the user added in Step 1

Wait for dev-agent to complete and return its implementation summary.
Display the summary to the user.

### Step 4 — QA

Display the QA steps to the user so they can manually QA the change along with the agent.
Spawn the qa-agent with this context:
- The change folder name
- The implementation summary from dev-agent

Wait for the QA report. Display it in full.

**If FAIL:**
Show the user the failed criteria and ask:
**"QA failed. Fix automatically with the same spec, or do you want to adjust the spec first?"**
- If auto-fix: spawn dev-agent again with the QA report as additional
  context, then re-run QA
- If adjust spec: go back to Step 2 review loop
- After 2 consecutive auto-fix failures, stop and escalate to the user

**If PASS:**
Then ask: "QA passed. Do you want to archive the change? (yes / no)"
- If yes: proceed to Step 5
- If no: do what the user wants

### Step 5 — Archive, update project state, and close

Run `/opsx:archive` to merge the spec into the permanent library.

Mark the Linear ticket as done using the MCP tools.
Add a comment to the ticket:
"Implemented via OpenSpec change `<change-name>`. QA passed. Spec archived to openspec/specs/."

**Update CLAUDE.md automatically:**
Read the current CLAUDE.md and make exactly these updates:
- Move the closed ticket ID from "Active cycle" to "What's done"
- If the active cycle list is now empty, bump the milestone number and note it
- Do not rewrite or reformat any other section — surgical edits only

Show the user the diff of what changed in CLAUDE.md before saving it.

Display:
**"✓ Ticket $ARGUMENTS closed. Spec archived. CLAUDE.md updated."**

Then ask:
**"Ready for the next ticket? I'll clear context and start fresh. (yes / not yet)"**

- If "yes": run `/clear`
- If "not yet": stay in session, do nothing — the user will clear manually when ready

## Rules

- Never skip the human review checkpoint in Step 2
- Never mark a ticket done if QA returned FAIL
- Never implement without an approved spec
- Surgical CLAUDE.md edits only — do not reformat sections that weren't touched
- If at any point something is ambiguous, stop and ask