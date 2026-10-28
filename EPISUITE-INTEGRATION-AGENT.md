# Episuite integration handoff for the next agent

## Scope and guardrails

Implement the Episuite half of the German Companion integration in the Episuite repository only. The German Companion lives in a separate repository. Do not copy its source tree into Episuite or edit German Companion files from this task. The local reference copy, if present, is under `externalapps/episuite/episuite`; it is ignored by the German Companion Git repository and is read-only context for this handoff.

The user wants:

1. Studying German to complete the existing Episuite task titled **Study German**.
2. German practice time, card reviews and completed six-form verb drills to appear in Episuite's Progress experience as a GitHub contribution-style calendar and streak.
3. A calm, non-punitive tracker. A missed day must never reset lifetime totals or create warnings.

## German Companion work already in place

The companion now:

- Reads `EPISUITE_URL`, `EPISUITE_TASK_TITLE` (default `Study German`), and optional `EPISUITE_TASK_ID` from its server environment.
- On a German card review or practice-time update, reads `${EPISUITE_URL}/api/state`, finds the unique non-deleted task by configured ID or exact case-insensitive title, checks its completion for Episuite's own timezone, and calls `POST /api/tasks/:id/complete` only when it is not already complete. This avoids toggling a task back to incomplete. Repeating tasks respect today's target.
- Measures foreground time in flashcard practice and irregular-verb drill modes. Hidden-tab time is paused. Daily totals are stored locally in the companion's `practiceActivity` and `verbDrillActivity`; card reviews are counted from its review history.
- On practice-session end, queues an idempotent activity event and attempts to deliver it to the endpoint specified below. Unacknowledged events stay in the companion outbox and retry. The companion sends no vocabulary, translations, answers, or other study content.
- Emits the event body below. `seconds` is the final cumulative active-practice duration for this unique session, not a delta.

The companion's runtime settings can be supplied in its `.env` file. For Docker on a home server, `.env.example` shows `EPISUITE_URL=http://host.docker.internal:3210`; adjust it if Episuite is reachable at a different address. If multiple tasks share that title, set `EPISUITE_TASK_ID` to pin the task.

## Required Episuite receiver

Add this route to the Episuite server:

```http
POST /api/integrations/german-companion/activity
Content-Type: application/json
```

Payload:

```json
{
  "eventId": "wort:<session UUID>",
  "sessionId": "<session UUID>",
  "date": "YYYY-MM-DD",
  "seconds": 615,
  "kind": "flashcards",
  "verbDrills": 0,
  "createdAt": 1793212345678
}
```

For a completed six-form verb drill, `kind` is `verb-drill` and `verbDrills` is `1`; for a card-practice session, `kind` is `flashcards` and `verbDrills` is `0`.

Requirements:

- Validate `eventId`/`sessionId`, a real calendar date, and integer `seconds` in a sensible bound (0–86400).
- Make processing idempotent by `eventId`. The companion retries until a successful response, so retries must never double-count time.
- Upsert by `(source='wort', sessionId)`, keeping the greatest received `seconds` for that session. An event may be retried after the session was already recorded.
- Persist per-session events and derive daily totals; do not store German words or card answers.
- Return a 2xx response only after the event is durable. Return a clear non-2xx error for invalid payloads.
- Include the new data in Episuite JSON export/restore. Keep old backups valid by treating missing integration data as empty.
- Do not alter current `/api/tasks/:id/complete` toggle semantics. The companion already checks state first and uses the existing route.

The receiver should not require browser CORS because the companion server sends server-to-server requests without an `Origin` header. Keep Episuite's existing cross-site request protections intact. Do not expose a new browser-facing credential or add secrets to exported state.

## Progress UI and metrics

Extend Episuite's Progress view with a contribution calendar that can combine Episuite's existing completed-day/focus history with the incoming `wort` activity. Each day should count as active if it has German reviews, verb drills, or positive German practice seconds; show practice minutes and verb drills in the day detail/tooltip. Make the current streak count consecutive active local dates and show lifetime active days/minutes separately. Use Episuite's configured timezone for day boundaries.

Keep the visual style consistent with Episuite's current Progress page, responsive on phones, keyboard/screen-reader accessible, and honest about the source of German practice data. Do not impose a target or penalize missed days. Existing Episuite focus sessions and metrics must remain unchanged; external German practice must not mint focus coins/rewards or alter task focus totals.

## Suggested implementation sequence

1. Inspect Episuite's state initialization, `safeState`, queue/mutation helper, backup/restore logic, timezone helpers, Progress renderer, and tests.
2. Add a normalized integration activity collection and the receiver route using the existing serialized mutation/persistence path.
3. Add unit/server tests for validation, retry idempotency, higher cumulative session totals, dates across timezone boundaries, and export/restore compatibility.
4. Add the Progress calendar/streak without changing existing focus totals, rewards, or task-completion behavior.
5. Run Episuite's supported checks and tests in the Episuite repository. Review the final diff to confirm no German Companion files or unrelated Episuite features changed.

## Manual integration check

With both servers running and the companion's `EPISUITE_URL` configured:

1. Review a German flashcard. The uniquely matched **Study German** task should complete once in Episuite.
2. Reopen/sync the task state and review another card. The task must remain complete; it must not toggle off.
3. Spend time in practice mode and leave it. Episuite should receive one German activity session and show its minutes on the matching local date.
4. Replay the same event to verify no duplicate contribution is added.
5. Stop Episuite during one completed practice session, restart it, then confirm the companion's outbox retries and the activity appears once the endpoint returns.
6. Verify no German word, translation, or answer appears in Episuite's activity records.
