# Week 1 judge review

## Board-reference update

Week 1 has now been reconciled with all 12 supplied board photographs. The original teacher-verb uncertainty below is superseded: sprechen, lesen, sein, haben and sehen are confirmed. The app also adds the board's greetings/farewells, formal/informal question sets, age, name parts, Yemen/Sudan origin patterns, hell/dunkel and worked number examples. Placeholder notes and note-entry prompts are removed. Fourteen automated tests cover the updated content and safe migration; browser checks cover the lesson and existing workflow.

Scope: the first-week German syllabus, fast vocabulary capture and the irregular-verb notebook. Scores are an explicit self-review from software, testing and German-teaching perspectives, not an independent evaluation or proof of learning outcomes.

| Criterion | First review | Final / 100 |
|---|---:|---:|
| Usefulness in teaching German | 94 | 96 |
| Ease of use | 93 | 97 |
| How well it works together | 94 | 96 |

## Findings and iteration

The first review found an overly long all-open lesson, passive verb tables without recall practice, overly broad sticky-footer styling and unclear handling of untranslated vocabulary.

The final implementation opens just the alphabet initially and provides topic-jump controls, collapsible explanations and a separate knowledge-check section. Saved verbs have a six-form recall drill. Sticky actions apply only to editing dialogs. Unknown words are saved without inventing meanings; the collection explains which meanings are needed for practice/export. Known Week 1 nouns can be captured without their article and are stored with the article.

## Teaching review

- Covers A–Z, Ä/Ö/Ü/ß, letter names versus word sounds, IPA with approximate English hints, and German audio.
- Covers ei/ie, au, eu/äu, sch, ch variants, initial sp/st, tsch, z/tz, w, common v pronunciation and ß/ss.
- Covers 1–20, 100, 1000, inverted units/tens, ein versus eins, special teens/tens, and 758. A tested builder supports 0–9999.
- Includes eleven colors and the sentence pattern Meine Lieblingsfarbe ist … without introducing unnecessary adjective endings.
- Covers name, origin, residence and favorite color, including matching questions, statement/question word order, and a caution about countries with articles.
- Covers regular endings, six pronoun slots, sie versus Sie, ending adjustments and irregular sein/haben; sprechen is explicitly an extra example.
- Twelve knowledge checks offer corrective explanations. Saved verb forms have active recall practice.
- The irregular examples are not claimed to be the teacher's actual verb list. This notebook records present-tense forms; a strong verb can have regular present forms and still be irregular in other tenses.

References checked: [DW alphabet/pronunciation](https://www.dw.com/downloads/26294183/lektion1-lerner-aussprache.pdf), [Goethe sound comparisons](https://www.goethe.de/resources/files/pdf221/bungen-gleiche-laute_ab-a12.pdf), [Goethe pronunciation exercises](https://www.goethe.de/resources/files/pdf288/deutsche-aussprache-uben-mit-musik_arbeitsblaetter-zu-den-tutorials.pdf). Conjugation reference: [Lingolia German teaching material](https://deutsch.lingolia.com/files/download/daf/lingolia_daf_v5.pdf).

## Test evidence

- Twelve automated tests pass: CRUD/persistence/reviews, text/APKG exports, bulk capture, server audio, number spellings, idempotent migration, dictionary/pronoun distinctions, six-form validation, quick capture, verb persistence, progress and old-backup restore.
- Chrome checks pass in an isolated notebook: one-field Enter capture; automatic and manually added meanings; persistent language/direction preferences; six-form and custom verbs; conjugation drill; number/introduction builders; progress; wrong/correct quiz feedback; lesson-to-vocabulary saving; APKG download; review; phone/tablet layouts.
- Screenshots reviewed for lesson, vocabulary, verb notebook and quick capture. No page overflow at 390px and 768px.
- Real Piper WAV audio generated for the alphabet, äu/eu examples, 758 and a full introduction; browser vocabulary playback passed.
- Existing custom notes, vocabulary and reviews are preserved; a pre-migration snapshot is created. Verbs and progress survive new backups, and old backups remain compatible.

## Limits

Docker execution and live Anki desktop import remain unverified on this machine. Piper audio generation and browser playback are verified; no claim of human pronunciation evaluation is made. The automatic vocabulary lookup is the bundled course glossary, not an unrestricted translation service. The final scores describe this Week 1 experience, not a complete German curriculum.
