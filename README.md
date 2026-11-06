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

## German paste import and minigames

Vocabulary is the start page. Paste German words using one per line, commas, or semicolons. The queue looks up each word in German Wiktionary and automatically saves unambiguous matches, skipping existing entries. Review multiple dictionary entries, failed lookups, and missing meanings in the importer. Retry or save those manually without restarting the queue. Dictionary coverage varies; feminine forms are recorded only when the source lists one. Not all nouns have a feminine counterpart or a plural.

The importer stores article/gender, explicit plurals, feminine counterparts, English meanings and verb classification. Irregular verbs with complete present-tense forms also appear in Irregular verbs. Unknown classification is shown explicitly. Source links are preserved in notes. German Wiktionary results are persisted in `data/german-dictionary-cache.json` until Settings → Clear cached lookups; requests for the same entry share one lookup. Clearing the dictionary cache clears both dictionary sources.

Overview and Anki studio have been removed from navigation. The activity calendar and streak now live in Practice. JSON backups and existing vocabulary remain available.

Minigames starts with Number pairs: match digits with German words across 0–20, 0–100, or 0–1000. Pairs shuffle each round, wrong answers allow retries, and foreground play time contributes to study activity and the existing Episuite activity queue. The reference image can guide a future visual revision.

### Resilient lookup of course vocabulary

German paste import accepts lowercase nouns, articles, V/V. course prefixes, optional feminine shorthand such as Enkel(in) and Kolleg(in), and aliases such as Kugelschreiber (Kuli). Counterparts are linked using dictionary data rather than suffix guessing. Explicit noun articles guide matching; conflicts with the source are reviewed. Exact case is preserved for lexical distinctions such as sie/Sie.

Close dictionary spelling suggestions are ranked and require confirmation. For example Brilee can suggest Brille, and Schlussek can suggest Schlüssel. The original text remains visible. Edit the German field and choose Retry lookup to search the corrected spelling. Review drafts, focus and pending queue items survive background progress/navigation; drafts and queue state are saved across browser reloads.

The server batches source pages, paces additional requests and respects numeric Retry-After delays up to 30 seconds before bounded retries. A second Wiktionary language edition fills missing English meanings. Successful raw page/search responses are retained indefinitely in the existing German dictionary cache, allowing parser improvements to reuse responses without new external requests. Legacy parsed cache entries are retained but no longer block the improved parser with stale misses; a source response may be fetched once on first use after upgrading. No automatic expiration or clearing is introduced. Transport/rate-limit errors are never stored as missing words.

Meaning extraction is scoped to German and the relevant part of speech. Proper-name homographs are deprioritized when an ordinary word is available. Distinct case, gender, grammatical number, plural and meaning are considered when saving. Reimporting an existing matching card fills missing metadata while preserving its review history and user content. Plural usage is stored explicitly (die, without inventing feminine gender). Unknown details remain unknown rather than fabricated.

The regression suite includes the complete 30-row course-list example, source-backed typo review, feminine expansion, source-language boundaries, regular/mixed verb classification, cache upgrades, request backoff, and homograph persistence. See tests/fixtures/README.md for recorded source-fixture provenance.
