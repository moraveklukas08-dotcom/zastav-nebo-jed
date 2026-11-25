# Pokyny pro práci na projektu

- Komunikace s vlastníkem česky, srozumitelně (není programátor).
- Hra: `src/game/NN-*.js` – části sdílí jeden scope, Vite je spojí v pořadí čísel
  (`vite.config.js`). Nové části pojmenuj číslem podle místa v pořadí. Při přesunu kódu
  pozor na pořadí top-level `const` (TDZ).
- Situace: funkce `scXxx(T)` vracející `newScene({...})` s `phases`. Fáze: `type`
  ('moving'|'standing'), `triggerS`, `stopS`, `answer` ('stop'|'slow'|'go'), `accept`,
  `hazard` (Actor), `crashS`, `kind` ('vulnerable' = chodec/cyklista), `crashCheck`,
  `canResume`, `ok`/`bad` texty. Varianty volit přes `weighted()`/`vchance()` (seedované
  v denní výzvě), kosmetiku přes `rand()`/`chance()`. Nové situace přidat do `SCENARIOS`,
  `ID_BY_NAME` a `CATS`.
- Po každé změně: `npm test` (všech 29+ situací × 6 strategií; hlídá pády, zaseknutí,
  protínání aut, nehody bez překážky). Test musí skončit `ERRORS []` a bez `PROBLEM`.
- Pozor na nekonečné smyčky s plovoucí čárkou (např. `s = X + 24` a test `< 24`) –
  už jednou zamrazily hru.
- `window.__zastav` je testovací háček; před produkcí skrýt za `import.meta.env.DEV`.
- Plán a odložené nápady: `ROADMAP.md`. Po dokončení úkolu ho aktualizuj.
