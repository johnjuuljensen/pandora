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
- [ ] Karakterskema (navn, level, health, stats)
- [ ] Inventory system (våben, items)
- [ ] Terningkast generator
- [ ] Gem/load karakter data (localStorage)

### Loot System
- [ ] Våben generator (sci-fi tegneserie stil)
- [ ] Våben stats generation (damage, accuracy, etc.)
- [ ] Våben billede creation (SVG/Canvas)
- [ ] Loot tabeller og raritet system

### Avanceret
- [ ] Multiple karakterer
- [ ] Export/import funktioner
- [ ] Våben customization

## Udvikling Principper
1. **Simpel kode** - børnene skal kunne forstå det
2. **Trin-for-trin** - en feature ad gangen
3. **Visuel feedback** - ændringer skal ses med det samme
4. **Fejlhåndtering** - venlige fejlbeskeder

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
*Claude skal tilføje noter her når der laves ændringer*

---
*Denne fil vedligeholdes automatisk af Claude AI*