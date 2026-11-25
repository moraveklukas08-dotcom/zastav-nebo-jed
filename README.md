# Zastav, nebo jeď!

3D trenažér rozhodování řidiče z pohledu za volantem. Hráč projíždí situace
(křižovatky, značky, dodatkové tabulky, chodci, přejezdy, dálnice, počasí…)
a během pár vteřin volí **STOP**, **ZPOMAL** nebo **JEĎ**. Cílovka: žáci autoškol
a řidiči, kteří si chtějí procvičit pravidla silničního provozu.

## Spuštění

```bash
npm install
npm run dev        # vývojový server s automatickým obnovením
npm run build      # produkční sestavení do dist/ (statický web)
npm test           # sestavení + automatický test všech situací (potřebuje Playwright)
```

`npm run build:single` vytvoří `dist-single/index.html` – celou hru v jednom souboru
(pro rychlý náhled, např. jako claude.ai artefakt).

## Struktura

| Cesta | Obsah |
|---|---|
| `index.html`, `src/style.css` | kostra stránky, menu, HUD |
| `src/game/NN-*.js` | herní kód rozdělený do částí (renderer, textury, vozidla, svět, situace, zvuk, UI…) |
| `tests/sim.mjs` | automatický test situací |
| `prototype/index.html` | původní jednosouborový prototyp (v0.3), jen pro srovnání |
| `ROADMAP.md` | plán vývoje a odložené nápady |

Části v `src/game/` zatím sdílejí jeden modulový scope a Vite je spojí v pořadí čísel
(viz `vite.config.js`). Postupně se převádějí na samostatné ES moduly.

## Právní upozornění

Hra situace zjednodušuje. Závazná pravidla jsou v zákoně č. 361/2000 Sb.
a vyhlášce č. 294/2015 Sb. Vysvětlení ve hře nenahrazují výuku v autoškole.
