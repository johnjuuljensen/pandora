/**
 * SVG Weapon Image Generator
 * Advanced SVG-based weapon image generation system
 * Replaces the primitive HTML+CSS system with modular SVG components
 */

class SVGWeaponGenerator {
    constructor() {
        this.weaponClasses = null;
        this.rarities = null;
        this.isLoaded = false;
    }

    async loadData() {
        try {
            const [weaponClassesResponse, raritiesResponse] = await Promise.all([
                fetch('./data/weapon-classes.json'),
                fetch('./data/rarities.json')
            ]);
            
            this.weaponClasses = await weaponClassesResponse.json();
            this.rarities = await raritiesResponse.json();
            this.isLoaded = true;
            
            console.log('SVG Weapon Generator data loaded successfully');
        } catch (error) {
            console.error('Failed to load weapon data:', error);
            throw error;
        }
    }

    generateWeapon(characterLevel = 1, forceClass = null) {
        if (!this.isLoaded) {
            throw new Error('Weapon data not loaded. Call loadData() first.');
        }

        // Select weapon class and type
        const classNames = Object.keys(this.weaponClasses);
        const randomClassName = forceClass || classNames[Math.floor(Math.random() * classNames.length)];
        const selectedClass = this.weaponClasses[randomClassName];
        const randomWeapon = selectedClass.types[Math.floor(Math.random() * selectedClass.types.length)];
        
        // Generate weapon level 1-3 levels around character level
        const minLevel = Math.max(1, characterLevel - 1);
        const maxLevel = characterLevel + 3;
        const weaponLevel = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
        
        const randomRarity = this.getRandomRarityByLevel(weaponLevel);
        
        // Level-scaled base stats
        const levelMultiplier = 1 + (weaponLevel - 1) * 0.15;
        const rangeVariation = selectedClass.baseRange * 0.2;
        const finalRange = Math.floor(selectedClass.baseRange + (Math.random() - 0.5) * rangeVariation);
        
        const baseStats = {
            damage: Math.floor((Math.random() * 30 + 15) * levelMultiplier * selectedClass.statModifiers.damage),
            accuracy: Math.floor((Math.random() * 20 + 75) * selectedClass.statModifiers.accuracy),
            range: Math.max(1, finalRange)
        };

        const weapon = {
            id: Date.now(),
            name: `${randomRarity.name} ${randomWeapon}`,
            type: randomWeapon,
            weaponClass: randomClassName,
            classColor: selectedClass.color,
            classEmoji: selectedClass.emoji,
            rarity: randomRarity,
            level: weaponLevel,
            damage: Math.floor(baseStats.damage * randomRarity.statBonus),
            accuracy: Math.min(100, Math.floor(baseStats.accuracy * randomRarity.statBonus)),
            range: Math.floor(baseStats.range * randomRarity.statBonus),
            svgImage: this.generateSVGWeaponImage(randomWeapon, randomClassName, randomRarity, weaponLevel),
            equipped: false,
            shieldPoints: selectedClass.isShield ? Math.floor(baseStats.damage * randomRarity.statBonus * 10) : 0
        };

        return weapon;
    }

    getRandomRarityByLevel(level) {
        // Higher level = better chance for rare items
        let weights = [50, 30, 15, 4, 1]; // Base weights
        
        if (level >= 3) weights = [40, 35, 20, 4, 1];
        if (level >= 5) weights = [30, 30, 25, 12, 3];
        if (level >= 8) weights = [20, 25, 30, 20, 5];
        if (level >= 12) weights = [15, 20, 30, 25, 10];

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return this.rarities[i];
            }
        }
        
        return this.rarities[0];
    }

    generateSVGWeaponImage(weaponType, weaponClass, rarity, level) {
        const baseColor = this.weaponClasses[weaponClass].color;
        const rarityColor = rarity.color || baseColor;
        const levelTier = this.getLevelTier(level);
        
        switch(weaponClass) {
            case 'Nærkamp': return this.createMeleeWeaponSVG(weaponType, baseColor, rarityColor, level, levelTier);
            case 'Pistol': return this.createPistolSVG(weaponType, baseColor, rarityColor, level, levelTier);
            case 'Haglgevær': return this.createShotgunSVG(weaponType, baseColor, rarityColor, level, levelTier);
            case 'Riffel': return this.createRifleSVG(weaponType, baseColor, rarityColor, level, levelTier);
            case 'Sniper': return this.createSniperRifleSVG(weaponType, baseColor, rarityColor, level, levelTier);
            case 'Automatisk': return this.createMachineGunSVG(weaponType, baseColor, rarityColor, level, levelTier);
            case 'Energi': return this.createEnergyWeaponSVG(weaponType, baseColor, rarityColor, level, levelTier);
            case 'Eksplosiv': return this.createExplosiveWeaponSVG(weaponType, baseColor, rarityColor, level, levelTier);
            case 'Shield': return this.createShieldSVG(weaponType, baseColor, rarityColor, level, levelTier);
            default: return this.createDefaultWeaponSVG(baseColor, rarityColor);
        }
    }

    getLevelTier(level) {
        if (level <= 3) return 'basic';
        if (level <= 7) return 'advanced'; 
        if (level <= 12) return 'expert';
        return 'master';
    }

    // Level-based Enhancement System
    getLevelModifiers(levelTier) {
        const modifiers = {
            'basic': { size: 0, stroke: 0, gems: [] },
            'advanced': { size: 1, stroke: 0, gems: ['#3498DB'] },
            'expert': { size: 2, stroke: 1, gems: ['#3498DB', '#9B59B6'] },
            'master': { size: 3, stroke: 1, gems: ['#FFD700', '#E74C3C', '#3498DB'] }
        };
        return modifiers[levelTier] || modifiers['basic'];
    }

    createEnchantmentEffect(color) {
        return `
            <defs>
                <filter id="enchantment" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="enchantBlur"/>
                    <feMerge>
                        <feMergeNode in="enchantBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
            </defs>`;
    }

    // SVG Component Creation Methods

    createMeleeWeaponSVG(weaponType, baseColor, rarityColor, level, levelTier) {
        const glowEffect = this.createGlowFilter(rarityColor);
        const levelModifiers = this.getLevelModifiers(levelTier);
        const variation = Math.floor(Math.random() * 3); // 0-2 for variety
        
        if (weaponType.includes('Sværd')) {
            const bladeWidth = 8 + levelModifiers.size;
            const detailLines = levelTier === 'master' ? 3 : levelTier === 'expert' ? 2 : 1;
            const enchantment = level >= 10 ? this.createEnchantmentEffect(rarityColor) : '';
            
            // Fixed sword shapes - pointed tips, correct orientation
            let bladeShape = variation === 0 ? 'M47 10 L50 5 L53 10 L52 80 L48 80 Z' :  // Classic pointed sword
                           variation === 1 ? 'M46 10 L50 5 L54 10 L54 40 L52 45 L50 50 L48 45 L46 40 Z M48 50 L52 50 L51 80 L49 80 Z' : // Double-edged with fuller
                                           'M45 10 L50 5 L55 10 L54 25 L52 40 L53 60 L52 80 L48 80 L47 60 L48 40 L46 25 Z'; // Curved scimitar style
                                           
            return `
                <svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                    ${glowEffect}
                    ${enchantment}
                    <!-- Blade -->
                    <path d="${bladeShape}" fill="${rarityColor}" stroke="#333" stroke-width="${2 + levelModifiers.stroke}" filter="url(#glow)"/>
                    ${levelTier === 'master' ? `<path d="M48 15 L52 15 L50 75 L48 75 Z" fill="#FFD700" opacity="0.8"/>` : ''}
                    <!-- Cross Guard -->
                    <rect x="${35 - levelModifiers.size}" y="75" width="${30 + levelModifiers.size * 2}" height="${6 + levelModifiers.size}" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                    <!-- Handle -->
                    <rect x="47" y="80" width="6" height="25" fill="#654321" stroke="#4A2C17" stroke-width="2"/>
                    <!-- Pommel -->
                    <circle cx="50" cy="108" r="${7 + levelModifiers.size}" fill="#B8860B" stroke="#DAA520" stroke-width="2"/>
                    ${Array.from({length: detailLines}, (_, i) => `<line x1="${49 + i}" y1="15" x2="${49 + i}" y2="70" stroke="#fff" stroke-width="1" opacity="0.6"/>`).join('')}
                    ${levelModifiers.gems.map((gem, i) => `<circle cx="${50}" cy="${95 + i * 8}" r="2" fill="${gem}" stroke="#333" stroke-width="1"/>`).join('')}
                </svg>`;
                
        } else if (weaponType.includes('Økse')) {
            const headSize = levelModifiers.size;
            const spikes = levelTier === 'expert' || levelTier === 'master';
            
            return `
                <svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                    ${glowEffect}
                    <!-- Handle -->
                    <rect x="47" y="30" width="6" height="80" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                    <!-- Axe Head -->
                    <path d="M${30 - headSize} 20 L${70 + headSize} 20 L${65 + headSize} 45 L${35 - headSize} 45 Z" fill="${rarityColor}" stroke="#333" stroke-width="3" filter="url(#glow)"/>
                    <!-- Blade Edge -->
                    <path d="M${25 - headSize} 25 L${75 + headSize} 25 L${70 + headSize} 40 L${30 - headSize} 40 Z" fill="#C0C0C0" stroke="#999" stroke-width="2"/>
                    ${spikes ? `<path d="M35 22 L30 15 L40 18 Z" fill="${rarityColor}" stroke="#333" stroke-width="2"/>` : ''}
                    ${spikes ? `<path d="M65 22 L70 15 L60 18 Z" fill="${rarityColor}" stroke="#333" stroke-width="2"/>` : ''}
                    ${levelTier === 'master' ? `<rect x="45" y="22" width="10" height="20" fill="#FFD700" opacity="0.3"/>` : ''}
                </svg>`;
                
        } else if (weaponType.includes('Stav')) {
            // Staff variations
            const staffLength = 100 + levelModifiers.size * 5;
            const orbSize = 8 + levelModifiers.size;
            
            return `
                <svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                    ${glowEffect}
                    <!-- Staff shaft -->
                    <rect x="47" y="20" width="6" height="${staffLength}" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                    
                    ${variation === 0 ? `
                        <!-- Crystal orb top -->
                        <circle cx="50" cy="15" r="${orbSize}" fill="${rarityColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                        <circle cx="50" cy="15" r="${orbSize - 3}" fill="#FFFFFF" opacity="0.3"/>
                    ` : variation === 1 ? `
                        <!-- Pointed crystal -->
                        <path d="M50 5 L${50 + orbSize} 15 L${50 + orbSize/2} 20 L${50 - orbSize/2} 20 L${50 - orbSize} 15 Z" 
                              fill="${rarityColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                    ` : `
                        <!-- Forked staff -->
                        <path d="M47 20 L45 10 L48 8 L50 15 L52 8 L55 10 L53 20" 
                              fill="${rarityColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                    `}
                    
                    <!-- Handle wrapping -->
                    <rect x="46" y="${staffLength - 20}" width="8" height="15" fill="#654321" stroke="#4A2C17" stroke-width="2"/>
                    <line x1="46" y1="${staffLength - 18}" x2="54" y2="${staffLength - 18}" stroke="#8B4513" stroke-width="1"/>
                    <line x1="46" y1="${staffLength - 12}" x2="54" y2="${staffLength - 12}" stroke="#8B4513" stroke-width="1"/>
                    <line x1="46" y1="${staffLength - 6}" x2="54" y2="${staffLength - 6}" stroke="#8B4513" stroke-width="1"/>
                    
                    ${levelTier === 'master' ? `<circle cx="50" cy="${staffLength/2}" r="3" fill="#FFD700" opacity="0.8" filter="url(#glow)"/>` : ''}
                    ${levelModifiers.gems.map((gem, i) => `<circle cx="50" cy="${30 + i * 15}" r="2" fill="${gem}" stroke="#333" stroke-width="1" filter="url(#glow)"/>`).join('')}
                </svg>`;
                
        } else {
            // Kniv/dagger variations
            const bladeLength = 50 + levelModifiers.size * 5;
            const serrated = variation === 2 && level >= 5;
            const isDagger = weaponType.includes('Kniv') || variation === 1;
            
            let bladeShape = isDagger ? 
                `M48 10 L50 5 L52 10 L51 ${bladeLength} L49 ${bladeLength} Z` : // Dagger point
                `M47 10 L50 8 L53 10 L52 ${bladeLength} L48 ${bladeLength} Z`;  // Knife
            
            return `
                <svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                    ${glowEffect}
                    <!-- Blade -->
                    <path d="${bladeShape}" fill="${rarityColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                    ${serrated ? `<path d="M52 15 L54 18 L52 21 L54 24 L52 27 L54 30" fill="none" stroke="#333" stroke-width="1"/>` : ''}
                    <!-- Handle -->
                    <rect x="46" y="${bladeLength}" width="8" height="${90 - bladeLength}" fill="#654321" stroke="#4A2C17" stroke-width="2"/>
                    <!-- Guard -->
                    <rect x="40" y="${bladeLength - 2}" width="20" height="4" fill="#8B4513" stroke="#654321" stroke-width="1"/>
                    ${levelModifiers.gems.map((gem, i) => `<circle cx="${50}" cy="${bladeLength + 10 + i * 8}" r="1.5" fill="${gem}" stroke="#333" stroke-width="0.5"/>`).join('')}
                </svg>`;
        }
    }

    createPistolSVG(weaponType, baseColor, rarityColor, level, levelTier) {
        const glowEffect = this.createGlowFilter(rarityColor);
        const levelModifiers = this.getLevelModifiers(levelTier);
        const variation = Math.floor(Math.random() * 3);
        
        const barrelLength = 40 + levelModifiers.size * 5;
        const hasCompensator = levelTier === 'expert' || levelTier === 'master';
        const hasLaser = levelTier === 'master';
        const isRevolver = weaponType.includes('Revolver') || variation === 2;
        
        if (isRevolver) {
            return `
                <svg width="120" height="80" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
                    ${glowEffect}
                    <!-- Barrel -->
                    <rect x="70" y="32" width="${barrelLength}" height="10" rx="5" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <!-- Cylinder -->
                    <circle cx="60" cy="37" r="${8 + levelModifiers.size}" fill="${baseColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                    <!-- Chamber holes -->
                    ${Array.from({length: 6}, (_, i) => {
                        const angle = (i * 60) * Math.PI / 180;
                        const x = 60 + Math.cos(angle) * 4;
                        const y = 37 + Math.sin(angle) * 4;
                        return `<circle cx="${x}" cy="${y}" r="1.5" fill="#1A252F"/>`;
                    }).join('')}
                    <!-- Grip -->
                    <path d="M45 44 L55 44 L55 65 L45 70 Z" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                    <!-- Trigger Guard -->
                    <circle cx="50" cy="55" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                    <!-- Trigger -->
                    <rect x="48" y="53" width="4" height="6" rx="1" fill="#E74C3C"/>
                    ${hasCompensator ? `<rect x="${70 + barrelLength}" y="30" width="8" height="14" rx="2" fill="#666" stroke="#444" stroke-width="1"/>` : ''}
                    ${levelModifiers.gems.map((gem, i) => `<circle cx="${50}" cy="${50 + i * 6}" r="1" fill="${gem}" stroke="#333" stroke-width="0.5"/>`).join('')}
                </svg>`;
        } else {
            return `
                <svg width="120" height="80" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
                    ${glowEffect}
                    <!-- Barrel -->
                    <rect x="70" y="32" width="${barrelLength}" height="8" rx="4" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <!-- Slide -->
                    <rect x="45" y="28" width="50" height="16" rx="2" fill="${baseColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                    <!-- Magazine -->
                    <rect x="47" y="44" width="${6 + levelModifiers.size}" height="${12 + levelModifiers.size * 2}" rx="1" fill="#34495E" stroke="#2C3E50" stroke-width="1"/>
                    <!-- Grip -->
                    <path d="M45 44 L55 44 L55 65 L45 70 Z" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                    <!-- Trigger Guard -->
                    <circle cx="50" cy="55" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                    <!-- Trigger -->
                    <rect x="48" y="53" width="4" height="6" rx="1" fill="#E74C3C"/>
                    <!-- Sight -->
                    <rect x="${65 + barrelLength}" y="30" width="3" height="${6 + levelModifiers.size}" fill="#FFD700"/>
                    ${hasCompensator ? `<rect x="${70 + barrelLength}" y="30" width="6" height="12" rx="1" fill="#666"/>` : ''}
                    ${hasLaser ? `<rect x="50" y="42" width="8" height="2" fill="#E74C3C" opacity="0.8"/>` : ''}
                    ${levelTier === 'master' ? `<line x1="50" y1="30" x2="${70 + barrelLength}" y2="30" stroke="#FFD700" stroke-width="1" opacity="0.8"/>` : ''}
                    ${levelModifiers.gems.map((gem, i) => `<circle cx="${50}" cy="${50 + i * 6}" r="1" fill="${gem}" stroke="#333" stroke-width="0.5"/>`).join('')}
                </svg>`;
        }
    }

    createShotgunSVG(weaponType, baseColor, rarityColor, level, levelTier) {
        const glowEffect = this.createGlowFilter(rarityColor);
        const levelModifiers = this.getLevelModifiers(levelTier);
        const variation = Math.floor(Math.random() * 3);
        
        const barrelLength = 50 + levelModifiers.size * 5;
        const stockSize = 25 + levelModifiers.size * 2;
        const isDoubleBarrel = weaponType.includes('Double') || variation === 0;
        const isPump = !isDoubleBarrel && (variation === 1);
        const isCombat = weaponType.includes('Combat') || variation === 2;
        
        return `
            <svg width="140" height="80" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                <!-- Stock -->
                <rect x="10" y="${40 - stockSize/2}" width="${stockSize}" height="${stockSize}" rx="3" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                ${levelTier === 'expert' || levelTier === 'master' ? `
                    <rect x="${12}" y="${42 - stockSize/3}" width="${stockSize - 4}" height="2" fill="#654321"/>
                    <rect x="${12}" y="${42 + stockSize/3}" width="${stockSize - 4}" height="2" fill="#654321"/>
                ` : ''}
                
                <!-- Body -->
                <rect x="${10 + stockSize}" y="35" width="40" height="14" rx="2" fill="${baseColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                
                ${isDoubleBarrel ? `
                    <!-- Double Barrel -->
                    <rect x="${10 + stockSize + 40}" y="32" width="${barrelLength}" height="7" rx="3" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <rect x="${10 + stockSize + 40}" y="41" width="${barrelLength}" height="7" rx="3" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <!-- Break action hinge -->
                    <rect x="${10 + stockSize + 35}" y="38" width="8" height="4" fill="#666" stroke="#444" stroke-width="1"/>
                ` : isPump ? `
                    <!-- Single Barrel -->
                    <rect x="${10 + stockSize + 40}" y="35" width="${barrelLength}" height="10" rx="5" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <!-- Pump Action -->
                    <rect x="${10 + stockSize + 20}" y="50" width="15" height="8" rx="2" fill="#654321" stroke="#4A2C17" stroke-width="2"/>
                    <rect x="${10 + stockSize + 22}" y="52" width="11" height="4" rx="2" fill="#8B4513"/>
                    <!-- Action rails -->
                    <rect x="${10 + stockSize + 40}" y="33" width="${barrelLength}" height="1" fill="#666"/>
                    <rect x="${10 + stockSize + 40}" y="46" width="${barrelLength}" height="1" fill="#666"/>
                ` : `
                    <!-- Combat/Tactical Barrel -->
                    <rect x="${10 + stockSize + 40}" y="34" width="${barrelLength}" height="12" rx="6" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <!-- Heat shield -->
                    <rect x="${10 + stockSize + 45}" y="32" width="${barrelLength - 10}" height="2" fill="#666"/>
                    <rect x="${10 + stockSize + 45}" y="46" width="${barrelLength - 10}" height="2" fill="#666"/>
                    <!-- Tactical rail -->
                    <rect x="${10 + stockSize + 40}" y="31" width="${barrelLength}" height="2" fill="#333"/>
                `}
                
                <!-- Trigger Guard -->
                <circle cx="${10 + stockSize + 10}" cy="55" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                
                <!-- Sights -->
                <rect x="${10 + stockSize + 40 + barrelLength - 5}" y="30" width="3" height="${levelTier === 'master' ? 10 : 8}" fill="#FFD700"/>
                ${levelTier === 'expert' || levelTier === 'master' ? `
                    <rect x="${10 + stockSize + 45}" y="29" width="3" height="6" fill="#FFD700"/>
                ` : ''}
                
                <!-- Choke/Muzzle -->
                ${levelTier === 'master' ? `
                    <rect x="${10 + stockSize + 40 + barrelLength}" y="${isDoubleBarrel ? '30' : '32'}" width="8" height="${isDoubleBarrel ? '20' : '16'}" rx="2" fill="#666" stroke="#444" stroke-width="1"/>
                ` : levelTier === 'expert' ? `
                    <rect x="${10 + stockSize + 40 + barrelLength}" y="${isDoubleBarrel ? '32' : '34'}" width="5" height="${isDoubleBarrel ? '16' : '12'}" rx="1" fill="#666"/>
                ` : ''}
                
                <!-- Level indicators -->
                ${levelModifiers.gems.map((gem, i) => `<circle cx="${15 + i * 6}" cy="${40 - stockSize/2 + 5}" r="2" fill="${gem}" stroke="#333" stroke-width="1" filter="url(#glow)"/>`).join('')}
                
                <!-- Tactical attachments -->
                ${levelTier === 'master' && isCombat ? `
                    <rect x="${10 + stockSize + 50}" y="48" width="8" height="4" fill="#E74C3C" opacity="0.8"/>
                    <circle cx="${10 + stockSize + 54}" cy="50" r="1" fill="#FFFFFF"/>
                ` : ''}
            </svg>`;
    }

    createRifleSVG(weaponType, baseColor, rarityColor, level, levelTier) {
        const glowEffect = this.createGlowFilter(rarityColor);
        const levelModifiers = this.getLevelModifiers(levelTier);
        const variation = Math.floor(Math.random() * 3);
        
        const barrelLength = 60 + levelModifiers.size * 8;
        const stockSize = 30 + levelModifiers.size * 3;
        const isAssault = weaponType.includes('Assault') || variation === 0;
        const isBattle = weaponType.includes('Battle') || variation === 1;
        const isBasic = !isAssault && !isBattle;
        
        return `
            <svg width="160" height="80" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                
                <!-- Stock -->
                ${isAssault ? `
                    <!-- Collapsible/Tactical Stock -->
                    <rect x="10" y="32" width="${stockSize - 5}" height="16" rx="2" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                    <rect x="${10 + stockSize - 8}" y="34" width="6" height="12" fill="#666" stroke="#444" stroke-width="1"/>
                ` : isBattle ? `
                    <!-- Heavy Battle Stock -->
                    <rect x="10" y="28" width="${stockSize + 5}" height="24" rx="4" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                    <rect x="12" y="30" width="${stockSize + 1}" height="4" fill="#654321"/>
                    <rect x="12" y="46" width="${stockSize + 1}" height="4" fill="#654321"/>
                ` : `
                    <!-- Standard Stock -->
                    <rect x="10" y="30" width="${stockSize}" height="20" rx="4" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                `}
                
                <!-- Body/Receiver -->
                <rect x="${10 + stockSize}" y="35" width="45" height="12" rx="2" fill="${baseColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                
                <!-- Barrel -->
                ${isAssault ? `
                    <!-- Standard Barrel with Flash Hider -->
                    <rect x="${10 + stockSize + 45}" y="37" width="${barrelLength}" height="8" rx="4" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    ${levelTier === 'expert' || levelTier === 'master' ? `
                        <rect x="${10 + stockSize + 45 + barrelLength}" y="35" width="8" height="12" rx="2" fill="#666" stroke="#444" stroke-width="1"/>
                    ` : ''}
                ` : isBattle ? `
                    <!-- Heavy Barrel -->
                    <rect x="${10 + stockSize + 45}" y="36" width="${barrelLength}" height="10" rx="5" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <!-- Muzzle Brake -->
                    ${levelTier === 'expert' || levelTier === 'master' ? `
                        <rect x="${10 + stockSize + 45 + barrelLength}" y="34" width="10" height="14" rx="3" fill="#666" stroke="#444" stroke-width="1"/>
                        <rect x="${10 + stockSize + 45 + barrelLength + 2}" y="36" width="6" height="3" fill="#333"/>
                        <rect x="${10 + stockSize + 45 + barrelLength + 2}" y="43" width="6" height="3" fill="#333"/>
                    ` : ''}
                ` : `
                    <!-- Basic Barrel -->
                    <rect x="${10 + stockSize + 45}" y="37" width="${barrelLength}" height="8" rx="4" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                `}
                
                <!-- Magazine -->
                ${isAssault ? `
                    <rect x="${10 + stockSize + 25}" y="47" width="10" height="25" rx="2" fill="#34495E" stroke="#2C3E50" stroke-width="2"/>
                    ${levelTier === 'master' ? `<rect x="${10 + stockSize + 27}" y="49" width="6" height="21" rx="1" fill="#666"/>` : ''}
                ` : isBattle ? `
                    <rect x="${10 + stockSize + 20}" y="47" width="12" height="20" rx="2" fill="#34495E" stroke="#2C3E50" stroke-width="2"/>
                ` : `
                    <rect x="${10 + stockSize + 20}" y="47" width="8" height="20" rx="1" fill="#34495E" stroke="#2C3E50" stroke-width="2"/>
                `}
                
                <!-- Trigger Guard -->
                <circle cx="${10 + stockSize + 15}" cy="53" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                
                <!-- Sighting System -->
                ${levelTier === 'basic' ? `
                    <!-- Basic Iron Sights -->
                    <rect x="${10 + stockSize + 45 + barrelLength - 5}" y="35" width="3" height="8" fill="#FFD700"/>
                    <rect x="${10 + stockSize + 42}" y="35" width="3" height="6" fill="#FFD700"/>
                ` : levelTier === 'advanced' ? `
                    <!-- Improved Iron Sights -->
                    <rect x="${10 + stockSize + 45 + barrelLength - 5}" y="34" width="3" height="10" fill="#FFD700"/>
                    <rect x="${10 + stockSize + 42}" y="34" width="3" height="8" fill="#FFD700"/>
                    <rect x="${10 + stockSize + 40}" y="33" width="${barrelLength + 5}" height="2" fill="#666"/>
                ` : levelTier === 'expert' ? `
                    <!-- Optic Ready -->
                    <rect x="${10 + stockSize + 50}" y="32" width="30" height="6" rx="3" fill="#333" stroke="#1A252F" stroke-width="1"/>
                    <rect x="${10 + stockSize + 55}" y="33" width="20" height="4" rx="2" fill="#4A90E2" opacity="0.3"/>
                    <rect x="${10 + stockSize + 40}" y="33" width="${barrelLength + 5}" height="2" fill="#666"/>
                ` : `
                    <!-- Advanced Optic -->
                    <rect x="${10 + stockSize + 50}" y="30" width="35" height="8" rx="4" fill="#1A252F" stroke="#0D1117" stroke-width="2"/>
                    <circle cx="${10 + stockSize + 67}" cy="34" r="3" fill="#4A90E2" opacity="0.5"/>
                    <rect x="${10 + stockSize + 40}" y="32" width="${barrelLength + 5}" height="3" fill="#333"/>
                `}
                
                <!-- Foregrip/Handguard -->
                ${levelTier === 'expert' || levelTier === 'master' ? `
                    <rect x="${10 + stockSize + 60}" y="45" width="20" height="6" rx="3" fill="#654321" stroke="#4A2C17" stroke-width="1"/>
                ` : ''}
                
                <!-- Level indicators -->
                ${levelModifiers.gems.map((gem, i) => `<circle cx="${15 + i * 6}" cy="35" r="2" fill="${gem}" stroke="#333" stroke-width="1" filter="url(#glow)"/>`).join('')}
            </svg>`;
    }

    createSniperRifleSVG(weaponType, baseColor, rarityColor, level, levelTier) {
        const glowEffect = this.createGlowFilter(rarityColor);
        const levelModifiers = this.getLevelModifiers(levelTier);
        const variation = Math.floor(Math.random() * 3);
        
        const barrelLength = 70 + levelModifiers.size * 10;
        const stockSize = 35 + levelModifiers.size * 4;
        const isAntiMaterial = weaponType.includes('Anti-Material') || variation === 0;
        const isPrecision = weaponType.includes('Precision') || variation === 1;
        
        // Determine scope size based on level
        const scopeSize = levelTier === 'master' ? 40 : levelTier === 'expert' ? 30 : 25;
        
        return `
            <svg width="180" height="80" viewBox="0 0 180 80" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                
                <!-- Stock -->
                ${isAntiMaterial ? `
                    <!-- Massive Anti-Material Stock -->
                    <rect x="10" y="25" width="${stockSize + 10}" height="30" rx="6" fill="#8B4513" stroke="#654321" stroke-width="3"/>
                    <rect x="12" y="27" width="${stockSize + 6}" height="4" fill="#654321"/>
                    <rect x="12" y="49" width="${stockSize + 6}" height="4" fill="#654321"/>
                ` : isPrecision ? `
                    <!-- Precision Stock with Cheek Rest -->
                    <rect x="10" y="28" width="${stockSize}" height="24" rx="4" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                    <rect x="15" y="25" width="15" height="6" rx="3" fill="#654321" stroke="#4A2C17" stroke-width="1"/>
                ` : `
                    <!-- Standard Sniper Stock -->
                    <rect x="10" y="28" width="${stockSize}" height="24" rx="4" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                `}
                
                <!-- Body/Receiver -->
                <rect x="${10 + stockSize}" y="36" width="50" height="${isAntiMaterial ? 14 : 10}" rx="2" fill="${baseColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                
                <!-- Barrel -->
                ${isAntiMaterial ? `
                    <!-- Massive Anti-Material Barrel -->
                    <rect x="${10 + stockSize + 50}" y="35" width="${barrelLength}" height="12" rx="6" fill="#2C3E50" stroke="#1A252F" stroke-width="3"/>
                    <!-- Massive Muzzle Brake -->
                    <rect x="${10 + stockSize + 50 + barrelLength}" y="32" width="15" height="18" rx="2" fill="#666" stroke="#444" stroke-width="2"/>
                    <rect x="${10 + stockSize + 50 + barrelLength + 2}" y="34" width="11" height="4" fill="#333"/>
                    <rect x="${10 + stockSize + 50 + barrelLength + 2}" y="42" width="11" height="4" fill="#333"/>
                ` : isPrecision ? `
                    <!-- Precision Barrel with Compensator -->
                    <rect x="${10 + stockSize + 50}" y="37" width="${barrelLength}" height="8" rx="4" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <rect x="${10 + stockSize + 50 + barrelLength}" y="35" width="10" height="12" rx="2" fill="#666" stroke="#444" stroke-width="1"/>
                ` : `
                    <!-- Standard Long Barrel -->
                    <rect x="${10 + stockSize + 50}" y="38" width="${barrelLength}" height="6" rx="3" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                `}
                
                <!-- Scope System -->
                ${isAntiMaterial ? `
                    <!-- Massive Scope -->
                    <ellipse cx="${10 + stockSize + 75}" cy="28" rx="${scopeSize}" ry="6" fill="#1A252F" stroke="#0D1117" stroke-width="3"/>
                    <ellipse cx="${10 + stockSize + 75}" cy="28" rx="${scopeSize - 5}" ry="4" fill="#4A90E2" opacity="0.4"/>
                    <circle cx="${10 + stockSize + 75}" cy="28" r="3" fill="#FF0000" opacity="0.6"/>
                ` : isPrecision ? `
                    <!-- High-End Precision Scope -->
                    <ellipse cx="${10 + stockSize + 75}" cy="30" rx="${scopeSize}" ry="5" fill="#1A252F" stroke="#0D1117" stroke-width="2"/>
                    <ellipse cx="${10 + stockSize + 75}" cy="30" rx="${scopeSize - 3}" ry="3" fill="#4A90E2" opacity="0.5"/>
                    <circle cx="${10 + stockSize + 75}" cy="30" r="2" fill="#00FF00" opacity="0.7"/>
                ` : `
                    <!-- Standard Scope -->
                    <ellipse cx="${10 + stockSize + 75}" cy="30" rx="${scopeSize}" ry="4" fill="#1A252F" stroke="#0D1117" stroke-width="2"/>
                    <ellipse cx="${10 + stockSize + 75}" cy="30" rx="${scopeSize - 5}" ry="3" fill="#4A90E2" opacity="0.3"/>
                `}
                
                <!-- Scope Mounts -->
                <rect x="${10 + stockSize + 45}" y="32" width="8" height="6" fill="#666"/>
                <rect x="${10 + stockSize + 95}" y="32" width="8" height="6" fill="#666"/>
                
                <!-- Bipod -->
                ${isAntiMaterial ? `
                    <!-- Heavy Bipod -->
                    <line x1="${10 + stockSize + 80}" y1="47" x2="${10 + stockSize + 75}" y2="65" stroke="#666" stroke-width="4"/>
                    <line x1="${10 + stockSize + 85}" y1="47" x2="${10 + stockSize + 90}" y2="65" stroke="#666" stroke-width="4"/>
                    <rect x="${10 + stockSize + 73}" y="63" width="6" height="4" fill="#666"/>
                    <rect x="${10 + stockSize + 88}" y="63" width="6" height="4" fill="#666"/>
                ` : levelTier === 'expert' || levelTier === 'master' ? `
                    <!-- Standard Bipod -->
                    <line x1="${10 + stockSize + 80}" y1="44" x2="${10 + stockSize + 75}" y2="55" stroke="#666" stroke-width="2"/>
                    <line x1="${10 + stockSize + 85}" y1="44" x2="${10 + stockSize + 90}" y2="55" stroke="#666" stroke-width="2"/>
                ` : ''}
                
                <!-- Trigger Guard -->
                <circle cx="${10 + stockSize + 25}" cy="52" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                
                <!-- Level indicators -->
                ${levelModifiers.gems.map((gem, i) => `<circle cx="${15 + i * 6}" cy="35" r="2" fill="${gem}" stroke="#333" stroke-width="1" filter="url(#glow)"/>`).join('')}
            </svg>`;
    }

    createMachineGunSVG(weaponType, baseColor, rarityColor, level, levelTier) {
        const glowEffect = this.createGlowFilter(rarityColor);
        const levelModifiers = this.getLevelModifiers(levelTier);
        const variation = Math.floor(Math.random() * 3);
        
        const barrelLength = 65 + levelModifiers.size * 8;
        const isMinigun = weaponType.includes('Minigun') || variation === 0;
        const isChainGun = weaponType.includes('Chain') || variation === 1;
        const isMachineGun = !isMinigun && !isChainGun;
        
        return `
            <svg width="160" height="100" viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                
                ${isMinigun ? `
                    <!-- Minigun Body -->
                    <rect x="20" y="45" width="70" height="20" rx="4" fill="${baseColor}" stroke="#333" stroke-width="3" filter="url(#glow)"/>
                    <!-- Multiple Rotating Barrels -->
                    <rect x="90" y="44" width="${barrelLength}" height="4" rx="2" fill="#2C3E50" stroke="#1A252F" stroke-width="1"/>
                    <rect x="90" y="49" width="${barrelLength}" height="4" rx="2" fill="#2C3E50" stroke="#1A252F" stroke-width="1"/>
                    <rect x="90" y="54" width="${barrelLength}" height="4" rx="2" fill="#2C3E50" stroke="#1A252F" stroke-width="1"/>
                    <rect x="90" y="59" width="${barrelLength}" height="4" rx="2" fill="#2C3E50" stroke="#1A252F" stroke-width="1"/>
                    <rect x="90" y="47" width="${barrelLength}" height="4" rx="2" fill="#2C3E50" stroke="#1A252F" stroke-width="1"/>
                    <rect x="90" y="52" width="${barrelLength}" height="4" rx="2" fill="#2C3E50" stroke="#1A252F" stroke-width="1"/>
                    <!-- Barrel Housing -->
                    <circle cx="90" cy="52" r="12" fill="#34495E" stroke="#2C3E50" stroke-width="2"/>
                    <!-- Motor -->
                    <rect x="25" y="40" width="15" height="10" rx="5" fill="#666" stroke="#444" stroke-width="2"/>
                ` : isChainGun ? `
                    <!-- Chain Gun Body -->
                    <rect x="20" y="42" width="65" height="22" rx="4" fill="${baseColor}" stroke="#333" stroke-width="3" filter="url(#glow)"/>
                    <!-- Chain Feed System -->
                    <rect x="15" y="35" width="30" height="8" rx="4" fill="#666" stroke="#444" stroke-width="2"/>
                    <rect x="17" y="37" width="26" height="4" fill="#FFD700" opacity="0.6"/>
                    <!-- Heavy Barrel -->
                    <rect x="85" y="46" width="${barrelLength}" height="16" rx="8" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <!-- Chain Links -->
                    ${Array.from({length: 8}, (_, i) => `<rect x="${20 + i * 3}" y="32" width="2" height="4" fill="#FFD700"/>`).join('')}
                ` : `
                    <!-- Standard Machine Gun Body -->
                    <rect x="20" y="45" width="60" height="18" rx="3" fill="${baseColor}" stroke="#333" stroke-width="3" filter="url(#glow)"/>
                    <!-- Heavy Barrel -->
                    <rect x="80" y="47" width="${barrelLength}" height="14" rx="7" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <!-- Large Magazine/Ammo Belt -->
                    <rect x="35" y="63" width="25" height="25" rx="3" fill="#34495E" stroke="#2C3E50" stroke-width="2"/>
                `}
                
                <!-- Carrying Handle -->
                <rect x="45" y="35" width="20" height="6" rx="3" fill="#666" stroke="#444" stroke-width="1"/>
                
                <!-- Cooling System -->
                ${isMinigun ? `
                    <!-- Minigun Cooling -->
                    <rect x="95" y="40" width="${barrelLength - 10}" height="2" fill="#666"/>
                    <rect x="95" y="66" width="${barrelLength - 10}" height="2" fill="#666"/>
                ` : isChainGun ? `
                    <!-- Chain Gun Cooling -->
                    <rect x="90" y="42" width="${barrelLength - 5}" height="2" fill="#666"/>
                    <rect x="90" y="66" width="${barrelLength - 5}" height="2" fill="#666"/>
                    <rect x="95" y="40" width="2" height="28" fill="#666"/>
                    <rect x="105" y="40" width="2" height="28" fill="#666"/>
                ` : `
                    <!-- Standard Cooling Vents -->
                    <rect x="90" y="44" width="2" height="20" fill="#666"/>
                    <rect x="95" y="44" width="2" height="20" fill="#666"/>
                    <rect x="100" y="44" width="2" height="20" fill="#666"/>
                `}
                
                <!-- Muzzle Effects -->
                ${levelTier === 'master' ? `
                    <path d="M${80 + barrelLength} 52 L${90 + barrelLength} 47 L${90 + barrelLength} 57 Z" fill="#FF6B35" opacity="0.8"/>
                    <path d="M${90 + barrelLength} 52 L${95 + barrelLength} 49 L${95 + barrelLength} 55 Z" fill="#FFFFFF" opacity="0.6"/>
                ` : levelTier === 'expert' ? `
                    <path d="M${80 + barrelLength} 52 L${87 + barrelLength} 49 L${87 + barrelLength} 55 Z" fill="#FF6B35" opacity="0.7"/>
                ` : ''}
                
                <!-- Trigger Guard -->
                <circle cx="30" cy="70" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                
                <!-- Grip -->
                <rect x="10" y="65" width="12" height="25" rx="2" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                
                <!-- Tripod/Mount -->
                ${levelTier === 'expert' || levelTier === 'master' ? `
                    <line x1="50" y1="63" x2="45" y2="85" stroke="#666" stroke-width="3"/>
                    <line x1="55" y1="63" x2="60" y2="85" stroke="#666" stroke-width="3"/>
                    <line x1="50" y1="63" x2="50" y2="85" stroke="#666" stroke-width="3"/>
                ` : ''}
                
                <!-- Level indicators -->
                ${levelModifiers.gems.map((gem, i) => `<circle cx="${15 + i * 6}" cy="50" r="2" fill="${gem}" stroke="#333" stroke-width="1" filter="url(#glow)"/>`).join('')}
            </svg>`;
    }

    createEnergyWeaponSVG(weaponType, baseColor, rarityColor, level, levelTier) {
        const glowEffect = this.createGlowFilter(rarityColor);
        const energyGlow = this.createEnergyGlowFilter();
        const levelModifiers = this.getLevelModifiers(levelTier);
        const variation = Math.floor(Math.random() * 3);
        
        const coreSize = 30 + levelModifiers.size * 5;
        const numCoils = 4 + (levelTier === 'master' ? 4 : levelTier === 'expert' ? 2 : 0);
        const hasQuantumCore = levelTier === 'master';
        const energyIntensity = levelTier === 'master' ? 1.0 : levelTier === 'expert' ? 0.8 : 0.6;
        
        // Different weapon types
        const isPlasma = weaponType.includes('Plasma');
        const isIon = weaponType.includes('Ion');
        const isLaser = weaponType.includes('Laser');
        
        let weaponColor = isPlasma ? '#E74C3C' : isIon ? '#3498DB' : '#00FF00';
        
        return `
            <svg width="140" height="80" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                ${energyGlow}
                <!-- Energy Core -->
                <rect x="20" y="${40 - coreSize/4}" width="${coreSize}" height="${coreSize/2}" rx="${coreSize/4}" 
                      fill="url(#energyGradient)" stroke="#663399" stroke-width="2" filter="url(#energyGlow)"/>
                ${hasQuantumCore ? `<circle cx="${20 + coreSize/2}" cy="40" r="${coreSize/6}" fill="#FFD700" opacity="${energyIntensity}" filter="url(#energyGlow)"/>` : ''}
                
                <!-- Barrel/Emitter -->
                <rect x="${20 + coreSize}" y="35" width="${70 + levelModifiers.size * 5}" height="10" rx="5" 
                      fill="${weaponColor}" stroke="#2980B9" stroke-width="2" filter="url(#glow)" opacity="${energyIntensity}"/>
                      
                <!-- Energy Coils -->
                ${Array.from({length: numCoils}, (_, i) => {
                    const x = 60 + i * 10;
                    const y = 32 + (i % 2) * 16;
                    const coilSize = 2 + (levelTier === 'master' ? 1 : 0);
                    return `<circle cx="${x}" cy="${y}" r="${coilSize}" fill="${weaponColor}" filter="url(#energyGlow)" opacity="${energyIntensity}"/>`;
                }).join('')}
                
                <!-- Cooling System -->
                ${levelTier === 'expert' || levelTier === 'master' ? `
                    <rect x="55" y="28" width="${40 + levelModifiers.size * 3}" height="2" fill="#34495E"/>
                    <rect x="55" y="50" width="${40 + levelModifiers.size * 3}" height="2" fill="#34495E"/>
                    <rect x="60" y="26" width="2" height="6" fill="#666"/>
                    <rect x="70" y="26" width="2" height="6" fill="#666"/>
                    <rect x="80" y="26" width="2" height="6" fill="#666"/>
                ` : `
                    <rect x="55" y="28" width="40" height="2" fill="#34495E"/>
                    <rect x="55" y="50" width="40" height="2" fill="#34495E"/>
                `}
                
                <!-- Energy Blast Effect -->
                ${levelTier === 'master' ? `
                    <path d="M${90 + levelModifiers.size * 5} 40 L${100 + levelModifiers.size * 7} 38 L${105 + levelModifiers.size * 7} 40 L${100 + levelModifiers.size * 7} 42 Z" 
                          fill="${weaponColor}" opacity="${energyIntensity}" filter="url(#energyGlow)"/>
                    <path d="M${105 + levelModifiers.size * 7} 40 L${110 + levelModifiers.size * 7} 39 L${112 + levelModifiers.size * 7} 40 L${110 + levelModifiers.size * 7} 41 Z" 
                          fill="#FFFFFF" opacity="0.9" filter="url(#energyGlow)"/>
                ` : `
                    <path d="M120 40 L130 38 L135 40 L130 42 Z" fill="${weaponColor}" opacity="${energyIntensity}" filter="url(#energyGlow)"/>
                `}
                
                <!-- Trigger Guard -->
                <circle cx="30" cy="55" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                
                <!-- Advanced Grip -->
                <rect x="15" y="48" width="12" height="20" rx="2" fill="#654321" stroke="#4A2C17" stroke-width="2"/>
                ${levelModifiers.gems.map((gem, i) => `<circle cx="21" cy="${52 + i * 4}" r="1" fill="${gem}" stroke="#333" stroke-width="0.5"/>`).join('')}
                
                <!-- Power Indicators -->
                ${levelTier === 'expert' || levelTier === 'master' ? Array.from({length: 3}, (_, i) => 
                    `<rect x="${25 + i * 4}" y="${45 - coreSize/4 - 3}" width="2" height="3" fill="${i < (levelTier === 'master' ? 3 : 2) ? '#00FF00' : '#333'}" opacity="0.8"/>`
                ).join('') : ''}
                
                <defs>
                    <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:${isPlasma ? '#9B59B6' : isIon ? '#3498DB' : '#00AA00'}"/>
                        <stop offset="50%" style="stop-color:${weaponColor}"/>
                        <stop offset="100%" style="stop-color:#FFFFFF"/>
                    </linearGradient>
                </defs>
            </svg>`;
    }

    createExplosiveWeaponSVG(weaponType, baseColor, rarityColor, level, levelTier) {
        const glowEffect = this.createGlowFilter(rarityColor);
        const levelModifiers = this.getLevelModifiers(levelTier);
        const variation = Math.floor(Math.random() * 3);
        
        const tubeLength = 45 + levelModifiers.size * 8;
        const isRocket = weaponType.includes('Raket') || variation === 0;
        const isGrenade = weaponType.includes('Granat') || variation === 1;
        const isMissile = weaponType.includes('Missile') || variation === 2;
        
        return `
            <svg width="140" height="100" viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                
                ${isRocket ? `
                    <!-- Rocket Launcher Body -->
                    <rect x="30" y="35" width="50" height="20" rx="4" fill="${baseColor}" stroke="#333" stroke-width="3" filter="url(#glow)"/>
                    <!-- Single Large Tube -->
                    <rect x="80" y="30" width="${tubeLength}" height="30" rx="15" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <!-- Rocket Visible -->
                    <path d="M${80 + tubeLength - 5} 42 L${80 + tubeLength + 8} 40 L${80 + tubeLength + 8} 50 Z" fill="#E74C3C" stroke="#C0392B" stroke-width="1"/>
                    <rect x="${80 + tubeLength - 10}" y="43" width="8" height="4" fill="#FFD700"/>
                ` : isGrenade ? `
                    <!-- Grenade Launcher Body -->
                    <rect x="25" y="38" width="55" height="16" rx="3" fill="${baseColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                    <!-- Shorter Tube -->
                    <rect x="80" y="35" width="${tubeLength - 10}" height="22" rx="11" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                    <!-- Grenade Cylinder -->
                    <rect x="75" y="42" width="15" height="8" rx="4" fill="#666" stroke="#444" stroke-width="1"/>
                    <!-- Break Action -->
                    <rect x="72" y="40" width="6" height="12" fill="#8B4513" stroke="#654321" stroke-width="1"/>
                ` : `
                    <!-- Missile Pod System -->
                    <rect x="25" y="32" width="60" height="26" rx="4" fill="${baseColor}" stroke="#333" stroke-width="3" filter="url(#glow)"/>
                    <!-- Multiple Tubes -->
                    <rect x="85" y="30" width="${tubeLength - 5}" height="8" rx="4" fill="#2C3E50" stroke="#1A252F" stroke-width="1"/>
                    <rect x="85" y="40" width="${tubeLength - 5}" height="8" rx="4" fill="#2C3E50" stroke="#1A252F" stroke-width="1"/>
                    <rect x="85" y="50" width="${tubeLength - 5}" height="8" rx="4" fill="#2C3E50" stroke="#1A252F" stroke-width="1"/>
                    <!-- Multiple Missiles -->
                    <path d="M${85 + tubeLength - 8} 32 L${85 + tubeLength + 3} 30 L${85 + tubeLength + 3} 36 Z" fill="#E74C3C" stroke="#C0392B" stroke-width="1"/>
                    <path d="M${85 + tubeLength - 8} 42 L${85 + tubeLength + 3} 40 L${85 + tubeLength + 3} 46 Z" fill="#E74C3C" stroke="#C0392B" stroke-width="1"/>
                    <path d="M${85 + tubeLength - 8} 52 L${85 + tubeLength + 3} 50 L${85 + tubeLength + 3} 56 Z" fill="#E74C3C" stroke="#C0392B" stroke-width="1"/>
                `}
                
                <!-- Warning System -->
                ${isRocket ? `
                    <!-- High Explosive Warnings -->
                    <rect x="85" y="28" width="4" height="34" fill="#F39C12"/>
                    <rect x="92" y="28" width="4" height="34" fill="#E74C3C"/>
                    <rect x="99" y="28" width="4" height="34" fill="#F39C12"/>
                    <rect x="106" y="28" width="4" height="34" fill="#E74C3C"/>
                ` : isGrenade ? `
                    <!-- Grenade Warnings -->
                    <rect x="82" y="33" width="3" height="24" fill="#F39C12"/>
                    <rect x="87" y="33" width="3" height="24" fill="#E74C3C"/>
                ` : `
                    <!-- Multi-Missile Warnings -->
                    <rect x="87" y="28" width="2" height="32" fill="#F39C12"/>
                    <rect x="92" y="28" width="2" height="32" fill="#E74C3C"/>
                    <rect x="97" y="28" width="2" height="32" fill="#F39C12"/>
                `}
                
                <!-- Grip -->
                <rect x="15" y="55" width="12" height="25" rx="3" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                
                <!-- Trigger Guard -->
                <circle cx="30" cy="65" r="8" fill="none" stroke="#2C3E50" stroke-width="2"/>
                
                <!-- Sighting System -->
                ${levelTier === 'basic' ? `
                    <rect x="40" y="30" width="4" height="8" fill="#FFD700"/>
                ` : levelTier === 'advanced' ? `
                    <rect x="40" y="28" width="4" height="10" fill="#FFD700"/>
                    <rect x="60" y="28" width="4" height="10" fill="#FFD700"/>
                ` : `
                    <!-- Advanced Targeting System -->
                    <rect x="45" y="25" width="20" height="8" rx="4" fill="#1A252F" stroke="#0D1117" stroke-width="1"/>
                    <circle cx="55" cy="29" r="2" fill="#00FF00" opacity="0.8"/>
                `}
                
                <!-- Exhaust/Recoil System -->
                ${isRocket ? `
                    <circle cx="20" cy="40" r="4" fill="#666"/>
                    <circle cx="20" cy="50" r="4" fill="#666"/>
                    ${levelTier === 'master' ? `<circle cx="20" cy="45" r="2" fill="#E74C3C" opacity="0.8"/>` : ''}
                ` : isGrenade ? `
                    <rect x="18" y="42" width="8" height="8" rx="4" fill="#666"/>
                ` : `
                    <circle cx="18" cy="38" r="3" fill="#666"/>
                    <circle cx="18" cy="45" r="3" fill="#666"/>
                    <circle cx="18" cy="52" r="3" fill="#666"/>
                `}
                
                <!-- Level Enhancement -->
                ${levelTier === 'master' && isRocket ? `
                    <!-- Guidance System -->
                    <rect x="50" y="20" width="15" height="6" rx="3" fill="#4A90E2" opacity="0.7"/>
                    <circle cx="57" cy="23" r="1" fill="#FFFFFF"/>
                ` : levelTier === 'master' && isMissile ? `
                    <!-- Multi-Target System -->
                    <rect x="45" y="20" width="25" height="6" rx="3" fill="#4A90E2" opacity="0.7"/>
                    <circle cx="52" cy="23" r="1" fill="#00FF00"/>
                    <circle cx="58" cy="23" r="1" fill="#00FF00"/>
                    <circle cx="64" cy="23" r="1" fill="#00FF00"/>
                ` : ''}
                
                <!-- Level indicators -->
                ${levelModifiers.gems.map((gem, i) => `<circle cx="${20 + i * 6}" cy="30" r="2" fill="${gem}" stroke="#333" stroke-width="1" filter="url(#glow)"/>`).join('')}
            </svg>`;
    }

    createShieldSVG(weaponType, baseColor, rarityColor, level, levelTier) {
        const glowEffect = this.createGlowFilter(rarityColor);
        const levelModifiers = this.getLevelModifiers(levelTier);
        const variation = Math.floor(Math.random() * 3);
        
        const shieldSize = 70 + levelModifiers.size * 5;
        const hasEnergyField = levelTier === 'expert' || levelTier === 'master';
        const hasForceField = levelTier === 'master';
        
        // Different shield shapes
        let shieldShape;
        const isEnergy = weaponType.includes('Energi') || weaponType.includes('Plasma');
        const isRiot = weaponType.includes('Riot');
        const isDeflector = weaponType.includes('Deflector');
        
        if (isRiot || variation === 0) {
            shieldShape = `M50 15 L${40 + shieldSize/2} 20 L${40 + shieldSize/2} 85 L50 100 L${60 - shieldSize/2} 85 L${60 - shieldSize/2} 20 Z`;
        } else if (isEnergy || variation === 1) {
            shieldShape = `M50 10 L${35 + shieldSize/2} 25 L${35 + shieldSize/2} 80 L50 110 L${65 - shieldSize/2} 80 L${65 - shieldSize/2} 25 Z`;
        } else {
            // Round shield
            shieldShape = `M50 15 Q${35 + shieldSize/2} 15 ${35 + shieldSize/2} 60 Q${35 + shieldSize/2} 95 50 105 Q${65 - shieldSize/2} 95 ${65 - shieldSize/2} 60 Q${65 - shieldSize/2} 15 50 15`;
        }
        
        return `
            <svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                
                <!-- Shield Main Body -->
                <path d="${shieldShape}" 
                      fill="url(#shieldGradient)" stroke="#1F4E79" stroke-width="${3 + levelModifiers.stroke}" filter="url(#glow)"/>
                      
                <!-- Center Emblem -->
                <circle cx="50" cy="55" r="${15 + levelModifiers.size}" fill="${rarityColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                
                <!-- Inner Pattern based on level -->
                ${levelTier === 'basic' ? 
                    `<circle cx="50" cy="55" r="8" fill="none" stroke="#fff" stroke-width="2" opacity="0.7"/>` :
                  levelTier === 'advanced' ?
                    `<circle cx="50" cy="55" r="8" fill="none" stroke="#fff" stroke-width="2" opacity="0.7"/>
                     <circle cx="50" cy="55" r="4" fill="none" stroke="#FFD700" stroke-width="1" opacity="0.8"/>` :
                  levelTier === 'expert' ?
                    `<path d="M44 49 L56 49 L56 61 L44 61 Z" fill="none" stroke="#fff" stroke-width="2" opacity="0.7"/>
                     <path d="M47 52 L53 52 L53 58 L47 58 Z" fill="#FFD700" opacity="0.6"/>` :
                    `<path d="M45 50 L50 45 L55 50 L55 60 L50 65 L45 60 Z" fill="#FFD700" opacity="0.8" filter="url(#glow)"/>
                     <circle cx="50" cy="55" r="3" fill="#FFFFFF" opacity="0.9"/>`
                }
                
                <!-- Handle (side view) -->
                <rect x="20" y="50" width="6" height="${30 + levelModifiers.size * 2}" rx="3" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                
                <!-- Reinforcement System -->
                ${levelTier === 'basic' ? `
                    <path d="M25 35 Q50 30 75 35" fill="none" stroke="#1A365D" stroke-width="2"/>
                    <path d="M25 75 Q50 70 75 75" fill="none" stroke="#1A365D" stroke-width="2"/>
                ` : levelTier === 'advanced' ? `
                    <path d="M25 30 Q50 25 75 30" fill="none" stroke="#1A365D" stroke-width="2"/>
                    <path d="M25 55 Q50 50 75 55" fill="none" stroke="#1A365D" stroke-width="2"/>
                    <path d="M25 80 Q50 75 75 80" fill="none" stroke="#1A365D" stroke-width="2"/>
                ` : `
                    <path d="M30 25 L70 25" stroke="#1A365D" stroke-width="3"/>
                    <path d="M30 40 L70 40" stroke="#1A365D" stroke-width="3"/>
                    <path d="M30 55 L70 55" stroke="#1A365D" stroke-width="3"/>
                    <path d="M30 70 L70 70" stroke="#1A365D" stroke-width="3"/>
                    <path d="M30 85 L70 85" stroke="#1A365D" stroke-width="3"/>
                `}
                
                <!-- Energy Field Effect -->
                ${hasEnergyField ? `
                    <path d="${shieldShape}" 
                          fill="none" stroke="${rarityColor}" stroke-width="2" opacity="0.6" filter="url(#glow)"/>
                    <path d="${shieldShape}" 
                          fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.4" filter="url(#glow)"/>
                ` : ''}
                
                <!-- Force Field Projectors -->
                ${hasForceField ? Array.from({length: 4}, (_, i) => {
                    const angle = i * 90;
                    const radian = angle * Math.PI / 180;
                    const x = 50 + Math.cos(radian) * 25;
                    const y = 55 + Math.sin(radian) * 20;
                    return `<circle cx="${x}" cy="${y}" r="2" fill="#00FFFF" filter="url(#glow)" opacity="0.8"/>
                            <circle cx="${x}" cy="${y}" r="1" fill="#FFFFFF" opacity="0.9"/>`;
                }).join('') : ''}
                
                <!-- Power Gems -->
                ${levelModifiers.gems.map((gem, i) => {
                    const y = 25 + i * 10;
                    return `<circle cx="30" cy="${y}" r="2" fill="${gem}" stroke="#333" stroke-width="1" filter="url(#glow)"/>`;
                }).join('')}
                
                <!-- Power Level Indicator -->
                ${levelTier === 'master' ? `
                    <rect x="45" y="20" width="10" height="3" fill="#00FF00" opacity="0.8"/>
                    <rect x="45" y="24" width="10" height="3" fill="#FFFF00" opacity="0.8"/>
                    <rect x="45" y="28" width="10" height="3" fill="#FF0000" opacity="0.8"/>
                ` : levelTier === 'expert' ? `
                    <rect x="47" y="22" width="6" height="3" fill="#00FF00" opacity="0.8"/>
                    <rect x="47" y="26" width="6" height="3" fill="#FFFF00" opacity="0.8"/>
                ` : ''}
                
                <defs>
                    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${isEnergy ? '#9B59B6' : '#3498DB'}"/>
                        <stop offset="50%" style="stop-color:${baseColor}"/>
                        <stop offset="100%" style="stop-color:#1F4E79"/>
                    </linearGradient>
                </defs>
            </svg>`;
    }

    createDefaultWeaponSVG(baseColor, rarityColor) {
        const glowEffect = this.createGlowFilter(rarityColor);
        
        return `
            <svg width="120" height="80" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                <!-- Generic Weapon Shape -->
                <rect x="20" y="32" width="80" height="16" rx="8" fill="${baseColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                <rect x="90" y="35" width="25" height="10" rx="5" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                <!-- Handle -->
                <rect x="15" y="48" width="12" height="20" rx="2" fill="#654321" stroke="#4A2C17" stroke-width="2"/>
                <!-- Generic Detail -->
                <circle cx="60" cy="40" r="6" fill="${rarityColor}" stroke="#333" stroke-width="1" filter="url(#glow)"/>
            </svg>`;
    }

    // Utility Methods for SVG Effects

    createGlowFilter(color) {
        return `
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>`;
    }

    createEnergyGlowFilter() {
        return `
            <defs>
                <filter id="energyGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>`;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGWeaponGenerator;
} else {
    window.SVGWeaponGenerator = SVGWeaponGenerator;
}