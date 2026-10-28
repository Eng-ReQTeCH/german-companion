# Wort — German study companion

Wort is a private, single-user German study app for a home server. It organizes learning around vocabulary, irregular verbs, grammar and daily practice rather than weekly lesson notebooks.

## Run

Install Node.js 22.13 or newer, then run:

```sh
npm start
```

Open http://localhost:3000. The app has no npm dependencies or build step. `data/study.json` is created automatically. Docker Compose is also available for a home server; its named volume persists study data across rebuilds.

## Study tools

- **Vocabulary:** add German and English/Arabic meanings, grammatical gender, plural forms, example sentences, notes, tags and an image. Search across words, meanings and tags. Bulk paste German | English | Arabic rows.
- **English lookup:** enter an English word to search Wiktionary for German translations and available gender/plural details. Choose the intended German entry before saving. Word lookups require an internet connection and send only the queried English text to Wiktionary; suggestions can be incomplete and should be checked. The server caches successful and empty results indefinitely in `data/wiktionary-cache.json`, including across restarts. Concurrent searches for the same word share one request. Clear this cache from Settings; until then, repeat lookups do not contact Wiktionary.
- **Practice:** study due or all cards in either direction, use typed-answer hard mode, filter by tag-based study sets, listen to German audio, and rate recall. Reviews use simple intervals of 10 minutes, 1, 3, 7, 14, 30 and 60 days. The overview tracks your current study streak.
- **Irregular verbs:** save the six present-tense forms (ich, du, er/sie/es, wir, ihr, sie/Sie). Verb practice asks for all six written forms together and marks each one.
- **Grammar:** a compact A1 reference for normal sentences, yes/no questions and W-questions.
- **Anki:** preview and export shuffled `.apkg` decks or text imports. Filter exports by tag and include examples or notes.
- **Backups:** export and restore the complete JSON collection. Images are stored in the backup; keep backups in a trusted location.

German pronunciation uses the bundled Piper de_DE-thorsten-high voice service. Docker Compose builds the voice service. For local development without Docker, see `tts/requirements.txt` and `tts/server.py`.

The app has no accounts or authentication. Keep it on a trusted LAN or VPN, or put authentication and HTTPS in front of it before exposing it publicly. Word lookup is the only learning feature that contacts an external service.
