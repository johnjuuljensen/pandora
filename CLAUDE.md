# Pandora RPG Karakter Management System

## Projekt Oversigt
Et webbaseret RPG brætspils karakter management system udviklet af børn (10 og 13 år) med hjælp fra Claude AI. Systemet skal være enkelt at forstå og udvide.

**Hovedformål:**
- Karakterskema management (ikke spilkontrol)
- Inventory system
- Loot generation med sci-fi tegneserie våben
- Terningkast funktionalitet
- Billede generation af våben + stats

## Teknisk Setup
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Data Storage:** localStorage for karakter tilstand + JSON templates
- **Templates:** JSON filer til våben komponenter og loot tabeller
- **Billeder:** SVG/Canvas til våben generation (sci-fi tegneserie stil)
- **Hosting:** GitHub Pages
- **Deployment:** GitHub Actions (automatisk)
- **Development:** Simpel - ingen build steps nødvendige

## Projektstruktur
```
/
├── index.html          # Hovedside
├── style.css           # Styling
├── script.js          # JavaScript logik
├── data/
│   ├── weapon-templates.json # Våben komponenter og templates
│   └── loot-tables.json      # Loot generation tabeller
├── assets/
│   └── images/        # Billeder og ikoner
├── generators/
│   ├── weapon-generator.js # Våben billede generation
│   └── loot-generator.js   # Loot system
└── CLAUDE.md          # Denne fil
```

## Funktionalitet (Prioriteret)

### Core Features
- [x] Karakterskema (navn, level, health, stats)
- [x] Inventory system (våben, items)
- [x] Terningkast generator
- [x] Gem/load karakter data (localStorage)

### Loot System
- [x] Våben generator (sci-fi tegneserie stil)
- [x] Våben stats generation (damage, accuracy, etc.)
- [ ] Våben billede creation (SVG/Canvas) - Bruger emoji indtil videre
- [x] Loot tabeller og raritet system

### Næste Features
- [x] Multiple karakterer (✅ v1.4.0)
- [ ] Export/import funktioner
- [ ] Våben customization
- [ ] Bedre våben grafik (SVG)
- [ ] Flere våben typer
- [ ] Experience point system

## Udvikling Principper
1. **Simpel kode** - børnene skal kunne forstå det
2. **Trin-for-trin** - en feature ad gangen
3. **Visuel feedback** - ændringer skal ses med det samme
4. **Fejlhåndtering** - venlige fejlbeskeder

## Sprog Konventioner
- **Kode/markup:** Engelsk (variable names, function names, comments)
- **UI tekst:** Dansk (knapper, labels, beskeder til brugeren)
- **Fejlbeskeder:** Dansk
- **Instruktioner:** Dansk

## UI Beskrivelse Guidelines
- Tegn skitser på papir først
- Beskriv funktioner i enkle ord
- Brug screenshots fra kendte spil som inspiration
- Start med det vigtigste først

## Claude Instruktioner
- **Vedligehold denne fil** når projektets scope ændres
- Prioriter simpel, læsbar kode over avancerede mønstre
- Forklar kode ændringer til børnene
- Foreslå små, testbare forbedringer
- Fokuser på at børnene lærer gennem processen

## Næste Skridt
1. Opret grundlæggende HTML struktur
2. Tilføj simpel CSS styling
3. Implementer basic JavaScript funktionalitet
4. Test i browseren
5. Deploy til GitHub Pages

## Udviklings Noter

### Version 1.5.2 - Forbedret Game Mechanics (2025-08-03)
**Game Logic Improvements:**
- ✅ Shield auto-restore til fuld når equipped, nul når unequipped
- ✅ Auto-unequip våben over karakter level ved level reduktion
- ✅ Auto-reducer HP til max HP ved level reduktion
- ✅ Automatisk character save ved shield/HP ændringer
- ✅ Forbedrede bruger beskeder for alle ændringer

### Version 1.5.1 - Avatar Fix (2025-08-03)
**Bugfixes:**
- ✅ Fjernet dobbelt ansigts problem i avatar system
- ✅ Hair delen fjernet (indeholdt ansigts emojis)
- ✅ Backwards compatibility cleanup for eksisterende avatarer
- ✅ Avatarer viser nu kun ét hovedansigt plus tilbehør

### Version 1.5.0 - Ultra-Kompakt QR Format (2025-08-03)
**Major QR System Overhaul:**
- ✅ Implementeret QR format v3 med 70% størrelse reduktion
- ✅ Array-baseret encoding i stedet for JSON objekt
- ✅ Numeriske koder for våben typer og raritet
- ✅ Våben navn rekonstruktion fra raritet + type
- ✅ Version kontrol system (kun v3 understøttes)
- ✅ QR test knap med detaljeret console output
- ✅ Automatisk scanner stop ved fane/funktion skift
- ✅ Bagudkompatibilitet med legacy format (deprecated)

**Technical improvements:**
- Weapon type codes: 10-94 range grouped by class
- Size reduction: `[3,70,5,45,92,68,3,0]` vs old JSON format
- Error correction level optimization
- Better mobile scanning performance

### Version 1.4.1 - QR Våben Fix (2025-08-03)
**Bugfixes:**
- ✅ Rettede QR våben modtagelse - modtagne våben kan nu tilføjes til inventory
- ✅ Løste problem hvor delte våben ikke kunne bruges efter scanning

### Version 1.4.0 - Multiple Karakterer (2025-08-03)
**Implementerede features:**
- ✅ Multiple karakter system med dropdown selector
- ✅ Per-karakter storage med individuelle stats og våben
- ✅ "+" knap for oprettelse af nye karakterer
- ✅ Karakter skift funktionalitet med komplet data load
- ✅ Auto-save per karakter med navnbaseret gemning
- ✅ Automatisk migration fra single-character system

**System oversigt:**
- Dropdown erstatter navn input med alle gemte karakterer
- Hver karakter har sin egen localStorage entry
- Auto-save virker individuelt per karakter
- Prompt-baseret karakter oprettelse med validering
- Character selector husker sidste aktive karakter

### Version 1.3.0 - QR Våbendeling (2025-08-03)
**Implementerede features:**
- ✅ QR kode våben deling system med kamera scanning
- ✅ Kompakt data format for effektive QR koder  
- ✅ Modtagne våben kan ikke deles igen (sikkerhed)
- ✅ Versioneringssystem med build dato tracking
- ✅ Footer med version info og GitHub link

**QR System:**
- Del genererede våben via QR koder (våben forsvinder)
- Modtag våben ved at scanne QR koder med mobil kamera
- Single-letter våben klasse koder for kompakt data
- Fungerer på både mobil og desktop med HTTPS

### Version 1.2.0 - Skade System (2025-08-03)
**Implementerede features:**
- ✅ Komplet skade system med shield absorption
- ✅ Dødsanimation med kranie emoji scaling/fade
- ✅ Hjælp tooltips (virker på hover og mobil klik)
- ✅ Kompakt UI design med emoji headers

### Version 1.1.0 - Våben Klasser (2025-08-03)
**Implementerede features:**
- ✅ 9 våben klasser med realistiske stats
- ✅ Shield våben klasse med dynamic UI states
- ✅ Inventory filtering og level-baserede slots
- ✅ Tab memory med localStorage integration

### Version 1.0.0 - Første Udkast (2025-08-03)
**Implementerede features:**
- ✅ Basic karakter skema (navn, level, health bar)
- ✅ Inventory system med våben kort
- ✅ Våben generator med raritet system (5 niveauer)
- ✅ Terningkast funktionalitet (D20)
- ✅ localStorage til data gemning
- ✅ Responsive design med sci-fi æstetik

**Våben system:**
- 5 våben typer: Laser Pistol, Plasma Rifle, Ion Cannon, Quantum Blaster, Photon Sword
- Raritet: Almindelig → Legendarisk
- Stats: Skade, Præcision, Rækkevidde
- Preview før tilføjelse til inventory

**Bugfixes:**
- Rettet element ID konflikt (new-weapon vs new-weapon-display)
- Fjernet automatisk inventory tilføjelse - nu via preview system

**Teknisk status:**
- Alle core filer oprettet og fungerer
- localStorage integration komplet
- Modulær kode struktur for nem udvidelse

## Næste funktion
1. Åbne features fra CLAUDE.md:
   - Export/import funktioner
   - Våben customization
   - Bedre våben grafik (SVG)
   - Flere våben typer
   - Experience point system

2. Åbne features fra ideer.md:
   - Billed af karakter (character portraits)
   - Det aktive våben skal ses på start skærmen
   - Bedre våbenbilleder

## Memories
- On "Det er fint" commit current work and present "Næste funktion" list
- On startup present "Næste funktion" list and a short description in danish, på dansk, on which "Commands" we've established.
- Commit beskeder skal være på dansk
- Update version in both html and version.json before each commit

## Project Slash Commands
- `/done` - Commit current work and run `/todo` command

---
*Denne fil vedligeholdes automatisk af Claude AI*