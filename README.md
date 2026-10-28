# Wort — German study companion

Wort is a private, single-user German study app for a home server. It organizes learning around vocabulary, irregular verbs, grammar and daily practice rather than weekly lesson notebooks.

## Run

Install Node.js 22.13 or newer, then run:

```sh
npm start
```

Open http://localhost:3000. The app has no npm dependencies or build step. `data/study.json` is created automatically. Docker Compose is also available for a home server; its named volume persists study data across rebuilds.

## Study tools

- **Vocabulary:** add German and English/Arabic meanings, grammatical gender, plural forms, examples, notes, tags and images. Search across words, meanings and tags. Bulk paste German | English | Arabic rows.
- **English lookup:** search Wiktionary for German translations and available gender/plural details. Choose the intended entry before saving. The lookup reads German noun declension patterns, including common plural endings and umlaut markers; suggestions can still be incomplete and should be checked. It sends only the queried English text to Wiktionary. Results are cached indefinitely in `data/wiktionary-cache.json`, including across restarts. Concurrent searches share a request. Clear the cache from Settings.
- **Practice:** study due or all cards in either direction, use typed-answer hard mode, filter by tag-based study sets, listen to German audio, and rate recall. Reviews use simple intervals of 10 minutes, 1, 3, 7, 14, 30 and 60 days. The overview includes a GitHub-style activity calendar and current streak. Practice time counts only while the app is visible in flashcard practice mode.
- **Irregular verbs:** save the six present-tense forms (ich, du, er/sie/es, wir, ihr, sie/Sie). Verb practice asks for all six written forms together and marks each one.
- **Grammar:** a compact A1 reference for normal sentences, yes/no questions and W-questions.
- **Anki:** preview and export shuffled `.apkg` decks or text imports. Filter exports by tag and include examples or notes.
- **Episuite:** optionally set `EPISUITE_URL` to the address reachable from Wort, plus `EPISUITE_TASK_TITLE` (default `Study German`) or `EPISUITE_TASK_ID`. A card review or practice-time update completes the matching task once it is still open. Completed practice sessions queue a date-and-duration activity event for Episuite.
- **Backups:** export and restore the complete JSON collection, including activity history and queued integration events. Images are stored in the backup; keep backups in a trusted location.

## Connect Episuite

Copy `.env.example` to `.env`, set `EPISUITE_URL` to an address the Wort server can reach, and restart with `docker compose up -d --build`. For Docker on the same home server, `http://host.docker.internal:3210` is the example value. If the task title is different or duplicated, set `EPISUITE_TASK_TITLE` or pin it with `EPISUITE_TASK_ID`.

Wort can complete the task through Episuite's existing task API. Completed German practice time is stored in Wort and queued for Episuite, but the Episuite activity receiver and display are a separate change. The handoff instructions are in [EPISUITE-INTEGRATION-AGENT.md](EPISUITE-INTEGRATION-AGENT.md). Once that receiver is added to Episuite, queued activity events will sync automatically.

The duplicate source copy under `externalcode/` or `externalapps/episuite/` is gitignored so it will not be committed into the Wort repository.

German pronunciation uses the bundled Piper de_DE-thorsten-high voice service. Docker Compose builds the voice service. For local development without Docker, see `tts/requirements.txt` and `tts/server.py`.

The app has no accounts or authentication. Keep it on a trusted LAN or VPN, or put authentication and HTTPS in front of it before exposing it publicly. Dictionary lookup and the optional Episuite connection are the only features that contact external services.
