# Våben Billede Generator - SVG System

## Projekt Oversigt
Forbedret våben billede generation til Pandora RPG systemet. Erstatter det primitive HTML+CSS system med avancerede SVG-baserede tegneserie-stil våben.

## Eksisterende System Analysis
Det nuværende system (`js/weapon-generator.js:114-751`) bruger:
- HTML `<div>` elementer med CSS styling
- Grundlæggende geometriske former (rektangler, cirkler)
- Begrænsede visuelle detaljer
- 9 våben klasser med forskellige typer

## Ny SVG Arkitektur

### Hybrid Tilgang: Komponent + Template System
**Valg:** Kombinere det bedste fra begge verdener

#### 1. SVG Komponent Bibliotek
- **Base komponenter:** Handles, barrels, scopes, magazines
- **Modificerbare dele:** Størrelse, farve, position
- **Genbrugelige elementer** på tværs af våben klasser

#### 2. Template-Drevet Generering
- **Våben templates** definerer hvilke komponenter bruges
- **Automatisk sammensætning** baseret på våben type
- **Rarity-baserede variationer** i farver og detaljer

### Tekniske Fordele ved SVG
- ✅ **Skalérbar:** Vector grafik skalerer perfekt
- ✅ **CSS styling:** Let at ændre farver og effekter
- ✅ **Performant:** Hurtigere end Canvas generation
- ✅ **Modulært:** Let at tilføje nye komponenter
- ✅ **Tegneserie æstetik:** Bedre visuelle detaljer

### Våben Klasse Mapping
Baseret på `data/weapon-classes.json`:

| Klasse | Antal Typer | Nuværende Emoji | SVG Fokus |
|--------|-------------|-----------------|-----------|
| **Nærkamp** | 5 | ⚔️ | Blades, handles, crossguards |
| **Pistol** | 3 | 🔫 | Compact barrels, grips |
| **Haglgevær** | 3 | 💥 | Wide barrels, pump actions |
| **Riffel** | 3 | 🎯 | Medium barrels, stocks |
| **Sniper** | 3 | 🎯 | Long barrels, scopes |
| **Automatisk** | 3 | 🔥 | Heavy barrels, magazines |
| **Energi** | 3 | ⚡ | Glowing effects, tech details |
| **Eksplosiv** | 3 | 💣 | Launcher tubes, warning marks |
| **Shield** | 5 | 🛡️ | Geometric shields, handles |

### Komponenter System
```
SVG Components/
├── base/
│   ├── handles.svg      # Grips og stocks
│   ├── barrels.svg      # Forskellige løb størrelser
│   ├── triggers.svg     # Trigger guards
│   └── magazines.svg    # Ammunition containere
├── attachments/
│   ├── scopes.svg       # Sigtemidler
│   ├── muzzles.svg      # Mundingsflash suppressor
│   └── grips.svg        # Foregrips
└── effects/
    ├── energy.svg       # Glowing effekter til energi våben
    ├── warning.svg      # Advarselsmærkater til eksplosiver
    └── shields.svg      # Shield geometri
```

### Generator Logic Flow
1. **Våben type** bestemmer base template
2. **Komponenter vælges** baseret på template  
3. **Raritet** påvirker farver og special effekter
4. **SVG sammensættes** fra komponenter
5. **Return færdigt SVG** som string

### Integration med Eksisterende System
- **Drop-in replacement** for `generateWeaponImage()` funktionen
- **Samme data struktur** (weapon objects)
- **Backwards compatible** med eksisterende våben
- **Gradvis migration** mulig

## Implementation Plan

### Phase 1: Core SVG System
- SVG generator klasse
- Base komponenter (handles, barrels)
- Template system til pistols og rifles

### Phase 2: Expand Components  
- Alle 9 våben klasser implementeret
- Raritet-baserede visual effekter
- Advanced komponenter (scopes, attachments)

### Phase 3: Polish & Effects
- Glow effekter til energi våben
- Animation support til special effects
- Optimering og cleanup

## Tegneserie Stil Retningslinjer
- **Bold outlines** (2-3px stroke width)
- **Flad farvepalette** med få skygger
- **Overdrevne proportioner** for cool factor
- **Sci-fi æstetik** med tech detaljer
- **Farverige energy effekter** ved energi våben

## Files Structure
```
weapons-img-generator.html    # Test interface til generatoren
weapons-img-generator.js      # Ny SVG generator klasse  
weapons-img.md               # Dette dokument
```

---
*Dokumentation vedligeholdt af Claude AI*