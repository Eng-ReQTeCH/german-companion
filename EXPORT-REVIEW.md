# Judge review: Anki export and keyboard workflow

This is an internal review, with actual automated and browser evidence. It is not an independent usability study.

| Category | Initial / 100 | Final / 100 |
|---|---:|---:|
| Study usefulness | 88 | 97 |
| Ease of use | 83 | 97 |
| Reliability and integration | 85 | 96 |

## Findings that guided the changes

1. Cards retained collection order and both-direction cards were created consecutively. Export now shuffles card rows and new-card queue positions by default, while keeping word/direction/language identifiers stable. Collection order remains an explicit option.
2. The previous preview showed one static card and export settings added unnecessary work. The new preview flips and browses actual included cards. Only direction, meaning language and scope are prominent; less-used settings are under Advanced. Choices persist.
3. Missing translations were silently skipped. The app now gives exact included-word/card counts and a list of skipped words, and blocks empty downloads.
4. Exports could not start from a filtered word list. The word page now exports its current search/type/lesson scope directly. That temporary scope is consumed once rather than silently persisting into later unrelated exports.
5. Downloads offered no progress or useful error recovery. Generation disables inputs/repeated submissions, reports errors inline and supports retry. A browser test caught and fixed a blur-triggered settings reset during generation.
6. Keyboard shortcuts were limited and not context-sensitive. The on-screen strip, local hints, accessibility metadata and help dialog expose available actions. Text entry, IME, held keys, browser shortcuts, focused buttons and dialogs are protected. Empty exports do not advertise flip/browse/download shortcuts.
7. The first shortcut-strip placement covered content. It now lives below navigation and remains sticky at the top, wrapping on narrow screens.

## Evidence

- Twenty automated tests pass, including inspection of real APKG SQLite card positions, complete card membership, stable GUIDs across reshuffles and translation edits, both directions, custom deck names, optional details, RTL Arabic, text headers, filters and shortcut guards.
- Existing end-to-end course/vocabulary/verb/review/export workflow passes in an isolated notebook.
- Dedicated Chromium checks pass for default shuffle, flipping/browsing, missing-meaning counts, simulated download failure and successful retry, actual download via hotkey, saved preferences, filtered/empty export, safe typing, quick capture, review hotkeys, verb capture, help and phone/tablet layouts.
- Actual desktop and phone screenshots reviewed.

## Limits and important behavior

Anki desktop import and Docker execution remain unverified locally. Tests inspect the real archive/database, rather than claiming a live Anki import. Shuffling sets initial new-card positions; Anki's scheduling, display settings and existing progress remain authoritative after import. Re-import preserves identities and does not reset learned cards or force a fresh order on cards already being studied. Bilingual cards include available meanings in the chosen language combination; missing one of two meanings does not discard an otherwise usable bilingual card.
