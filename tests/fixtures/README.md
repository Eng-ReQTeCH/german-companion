The German import fixture contains trimmed MediaWiki API responses recorded from
German and English Wiktionary on 2026-11-06. It covers the user's 30-row course
vocabulary example, case variants, counterpart links, and close spelling results.
Only parser-relevant headings, grammar parameters, translation facts, short
definitions and search titles are retained. Tests replay these responses without
contacting either provider. Production lookup contains no word-list exceptions.

Sources: https://de.wiktionary.org/ and https://en.wiktionary.org/. Individual
entry titles are recorded in the fixture; corresponding article and revision
history URLs are available as `/wiki/<title>` and
`/w/index.php?title=<title>&action=history` on the respective source site.
Wiktionary text is available under CC BY-SA 4.0 and other applicable terms:
https://creativecommons.org/licenses/by-sa/4.0/ and
https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use.

The live audit found usable entries or correction candidates for all 30 original
rows: 24 rows could save automatically and six required review. The review rows
were exactly `genau`, `V Erganzen`, `Det Schirm`, `Die Brilee`, `Der Schlussek`, and
`Das Feuerzeuf`. Two `(in)` rows each intentionally expand into two lexical entries.
This is a reproducible regression sample, not a promise of universal coverage.
