# Roadmap – Zastav, nebo jeď!

Stav: **v0.4** – projekt převeden z prototypu do repozitáře. 29 situací, 5 režimů,
počasí, zrcátko, záznam chyby, statistiky.

## Kolo 1 – dotažení hry (probíhá)

Rozhodnutí vlastníka: nejdřív **web**, grafika co nejrealističtější, **vše zdarma**
(bezplatné CC0 modely a textury, žádné placené API), zaměření na **pravidla silničního
provozu a rychlé rozhodování na křižovatkách** (ne na reflexy typu srnka).

- [x] Fáze 0: repozitář, Vite, rozdělení kódu, automatické testy
- [ ] Fáze 1: opravy
  - [ ] rozhlížení otáčí **hlavu** v kabině, ne celé auto
  - [ ] tlačítko **Menu / pauza** během hry
  - [ ] audit chyb, plynulost (spojení geometrie, předkompilace shaderů, načítání na pozadí, automatické snížení kvality)
- [ ] Fáze 2: realistický interiér (palubní deska, sloupky, boční zrcátka, ruce na volantu, páčka blinkru)
- [ ] Fáze 3: grafika z CC0 modelů (auta, chodci, stromy, budovy, textury), post-processing
- [ ] Fáze 4: situace 2.0 – každá situace 4–6 vývojů, značky a **dodatkové tabulky**, nové křižovatkové situace, odkazy na paragrafy
- [ ] Hlasová navigace („za 50 metrů odbočte vpravo“) přes Web Speech API (zdarma, čeština)
- [ ] Úvodní výuka (tutoriál)
- [ ] Režim Autoškola: výklad pravidel + kvíz značek (podle 361/2000 Sb. a 294/2015 Sb.)
- [ ] Souvislá trasa A → B se situacemi po cestě
- [ ] Živý provoz: auta s vlastní logikou na celých světelných křižovatkách (bez placené AI)
- [ ] Certifikát o absolvování (tisk/PDF)
- [ ] Sdílení záznamu chyby jako videa
- [ ] Překlady: slovenština, angličtina
- [ ] Mobilní ovládání přes prohlížeč (iPhone)

## Kolo 2 – zpeněžení a online (až bude hra hotová)

- Přihlašování, paywall na webu, **předplatné** (základ zdarma s denním limitem, víc za předplatné)
- Ověřování plateb na serveru, ochrana proti obejití paywallu, bezpečnost
- Žebříčky (vyžadují server; bezplatný tarif např. Supabase)
- GDPR, zásady ochrany osobních údajů, obchodní podmínky
- Prodej jako fyzická osoba s IČO

## Později

- **Verze pro autoškoly (B2B)** – jednorázový nákup licence autoškolou pro její žáky,
  instruktor zadává trénink a vidí výsledky. *Důležité, nezapomenout.*
- iOS / Android (nejdřív přes web, pak Capacitor), Steam
- Duel dvou hráčů
- Kontrola vysvětlení pravidel instruktorem autoškoly před prodejem

## Vědomě vynecháno

Kariéra, další vozidla, mapa ČR s odemykáním, garáž, přístupnost (zatím),
volant/gamepad, adaptivní obtížnost.
