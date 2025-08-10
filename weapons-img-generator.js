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
            svgImage: this.generateSVGWeaponImage(randomWeapon, randomClassName, randomRarity),
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

    generateSVGWeaponImage(weaponType, weaponClass, rarity) {
        const baseColor = this.weaponClasses[weaponClass].color;
        const rarityColor = rarity.color || baseColor;
        
        switch(weaponClass) {
            case 'Nærkamp': return this.createMeleeWeaponSVG(weaponType, baseColor, rarityColor);
            case 'Pistol': return this.createPistolSVG(weaponType, baseColor, rarityColor);
            case 'Haglgevær': return this.createShotgunSVG(weaponType, baseColor, rarityColor);
            case 'Riffel': return this.createRifleSVG(weaponType, baseColor, rarityColor);
            case 'Sniper': return this.createSniperRifleSVG(weaponType, baseColor, rarityColor);
            case 'Automatisk': return this.createMachineGunSVG(weaponType, baseColor, rarityColor);
            case 'Energi': return this.createEnergyWeaponSVG(weaponType, baseColor, rarityColor);
            case 'Eksplosiv': return this.createExplosiveWeaponSVG(weaponType, baseColor, rarityColor);
            case 'Shield': return this.createShieldSVG(weaponType, baseColor, rarityColor);
            default: return this.createDefaultWeaponSVG(baseColor, rarityColor);
        }
    }

    // SVG Component Creation Methods

    createMeleeWeaponSVG(weaponType, baseColor, rarityColor) {
        const glowEffect = this.createGlowFilter(rarityColor);
        
        if (weaponType.includes('Sværd')) {
            return `
                <svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                    ${glowEffect}
                    <!-- Blade -->
                    <path d="M45 10 L55 10 L52 80 L48 80 Z" fill="${rarityColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                    <!-- Cross Guard -->
                    <rect x="35" y="75" width="30" height="6" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                    <!-- Handle -->
                    <rect x="47" y="80" width="6" height="25" fill="#654321" stroke="#4A2C17" stroke-width="2"/>
                    <!-- Pommel -->
                    <circle cx="50" cy="108" r="7" fill="#B8860B" stroke="#DAA520" stroke-width="2"/>
                    <!-- Detail Lines -->
                    <line x1="50" y1="15" x2="50" y2="70" stroke="#fff" stroke-width="1" opacity="0.6"/>
                </svg>`;
        } else if (weaponType.includes('Økse')) {
            return `
                <svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                    ${glowEffect}
                    <!-- Handle -->
                    <rect x="47" y="30" width="6" height="80" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                    <!-- Axe Head -->
                    <path d="M30 20 L70 20 L65 45 L35 45 Z" fill="${rarityColor}" stroke="#333" stroke-width="3" filter="url(#glow)"/>
                    <!-- Blade Edge -->
                    <path d="M25 25 L75 25 L70 40 L30 40 Z" fill="#C0C0C0" stroke="#999" stroke-width="2"/>
                </svg>`;
        } else {
            // Default melee weapon (knife/dagger)
            return `
                <svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                    ${glowEffect}
                    <!-- Blade -->
                    <path d="M47 10 L53 10 L51 60 L49 60 Z" fill="${rarityColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                    <!-- Handle -->
                    <rect x="46" y="60" width="8" height="30" fill="#654321" stroke="#4A2C17" stroke-width="2"/>
                    <!-- Guard -->
                    <rect x="40" y="58" width="20" height="4" fill="#8B4513" stroke="#654321" stroke-width="1"/>
                </svg>`;
        }
    }

    createPistolSVG(weaponType, baseColor, rarityColor) {
        const glowEffect = this.createGlowFilter(rarityColor);
        
        return `
            <svg width="120" height="80" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                <!-- Barrel -->
                <rect x="70" y="32" width="40" height="8" rx="4" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                <!-- Slide -->
                <rect x="45" y="28" width="50" height="16" rx="2" fill="${baseColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                <!-- Grip -->
                <path d="M45 44 L55 44 L55 65 L45 70 Z" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                <!-- Trigger Guard -->
                <circle cx="50" cy="55" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                <!-- Trigger -->
                <rect x="48" y="53" width="4" height="6" rx="1" fill="#E74C3C"/>
                <!-- Sight -->
                <rect x="105" y="30" width="3" height="6" fill="#FFD700"/>
                <!-- Detail Lines -->
                <line x1="50" y1="30" x2="90" y2="30" stroke="#fff" stroke-width="0.5" opacity="0.7"/>
                <line x1="50" y1="42" x2="90" y2="42" stroke="#fff" stroke-width="0.5" opacity="0.7"/>
            </svg>`;
    }

    createShotgunSVG(weaponType, baseColor, rarityColor) {
        const glowEffect = this.createGlowFilter(rarityColor);
        
        return `
            <svg width="140" height="80" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                <!-- Stock -->
                <rect x="10" y="32" width="25" height="20" rx="3" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                <!-- Body -->
                <rect x="35" y="35" width="40" height="14" rx="2" fill="${baseColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                <!-- Double Barrel -->
                <rect x="75" y="32" width="50" height="7" rx="3" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                <rect x="75" y="41" width="50" height="7" rx="3" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                <!-- Pump Action -->
                <rect x="55" y="50" width="15" height="8" rx="2" fill="#654321" stroke="#4A2C17" stroke-width="2"/>
                <!-- Trigger Guard -->
                <circle cx="45" cy="55" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                <!-- Front Sight -->
                <rect x="120" y="35" width="3" height="8" fill="#FFD700"/>
            </svg>`;
    }

    createRifleSVG(weaponType, baseColor, rarityColor) {
        const glowEffect = this.createGlowFilter(rarityColor);
        
        return `
            <svg width="160" height="80" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                <!-- Stock -->
                <rect x="10" y="30" width="30" height="20" rx="4" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                <!-- Body/Receiver -->
                <rect x="40" y="35" width="45" height="12" rx="2" fill="${baseColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                <!-- Barrel -->
                <rect x="85" y="37" width="60" height="8" rx="4" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                <!-- Magazine -->
                <rect x="60" y="47" width="8" height="20" rx="1" fill="#34495E" stroke="#2C3E50" stroke-width="2"/>
                <!-- Trigger Guard -->
                <circle cx="55" cy="53" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                <!-- Front Sight -->
                <rect x="140" y="35" width="3" height="8" fill="#FFD700"/>
                <!-- Rear Sight -->
                <rect x="82" y="35" width="3" height="6" fill="#FFD700"/>
                <!-- Rail System -->
                <rect x="85" y="35" width="50" height="2" fill="#666"/>
            </svg>`;
    }

    createSniperRifleSVG(weaponType, baseColor, rarityColor) {
        const glowEffect = this.createGlowFilter(rarityColor);
        
        return `
            <svg width="180" height="80" viewBox="0 0 180 80" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                <!-- Stock -->
                <rect x="10" y="28" width="35" height="24" rx="4" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                <!-- Body -->
                <rect x="45" y="36" width="50" height="10" rx="2" fill="${baseColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                <!-- Long Barrel -->
                <rect x="95" y="38" width="70" height="6" rx="3" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                <!-- Scope -->
                <ellipse cx="110" cy="30" rx="25" ry="4" fill="#1A252F" stroke="#0D1117" stroke-width="2"/>
                <ellipse cx="110" cy="30" rx="20" ry="3" fill="#4A90E2" opacity="0.3"/>
                <!-- Scope Mounts -->
                <rect x="85" y="32" width="6" height="6" fill="#666"/>
                <rect x="135" y="32" width="6" height="6" fill="#666"/>
                <!-- Bipod -->
                <line x1="120" y1="44" x2="115" y2="55" stroke="#666" stroke-width="2"/>
                <line x1="125" y1="44" x2="130" y2="55" stroke="#666" stroke-width="2"/>
                <!-- Trigger Guard -->
                <circle cx="65" cy="52" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                <!-- Flash Hider -->
                <rect x="160" y="36" width="8" height="10" rx="1" fill="#333"/>
            </svg>`;
    }

    createMachineGunSVG(weaponType, baseColor, rarityColor) {
        const glowEffect = this.createGlowFilter(rarityColor);
        
        return `
            <svg width="160" height="100" viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                <!-- Body -->
                <rect x="20" y="45" width="60" height="18" rx="3" fill="${baseColor}" stroke="#333" stroke-width="3" filter="url(#glow)"/>
                <!-- Heavy Barrel -->
                <rect x="80" y="47" width="65" height="14" rx="7" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                <!-- Large Magazine/Ammo Belt -->
                <rect x="35" y="63" width="25" height="25" rx="3" fill="#34495E" stroke="#2C3E50" stroke-width="2"/>
                <!-- Carrying Handle -->
                <rect x="45" y="35" width="20" height="6" rx="3" fill="#666" stroke="#444" stroke-width="1"/>
                <!-- Cooling Vents -->
                <rect x="90" y="44" width="2" height="20" fill="#666"/>
                <rect x="95" y="44" width="2" height="20" fill="#666"/>
                <rect x="100" y="44" width="2" height="20" fill="#666"/>
                <!-- Muzzle Flash -->
                <path d="M145 52 L155 47 L155 57 Z" fill="#FF6B35" opacity="0.7"/>
                <!-- Trigger -->
                <circle cx="40" cy="70" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                <!-- Grip -->
                <rect x="10" y="65" width="12" height="25" rx="2" fill="#8B4513" stroke="#654321" stroke-width="2"/>
            </svg>`;
    }

    createEnergyWeaponSVG(weaponType, baseColor, rarityColor) {
        const glowEffect = this.createGlowFilter(rarityColor);
        const energyGlow = this.createEnergyGlowFilter();
        
        return `
            <svg width="140" height="80" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                ${energyGlow}
                <!-- Energy Core -->
                <rect x="20" y="32" width="30" height="16" rx="8" fill="url(#energyGradient)" stroke="#663399" stroke-width="2" filter="url(#energyGlow)"/>
                <!-- Barrel/Emitter -->
                <rect x="50" y="35" width="70" height="10" rx="5" fill="#3498DB" stroke="#2980B9" stroke-width="2" filter="url(#glow)"/>
                <!-- Energy Coils -->
                <circle cx="60" cy="32" r="2" fill="#E74C3C" filter="url(#energyGlow)"/>
                <circle cx="70" cy="48" r="2" fill="#E74C3C" filter="url(#energyGlow)"/>
                <circle cx="80" cy="32" r="2" fill="#E74C3C" filter="url(#energyGlow)"/>
                <circle cx="90" cy="48" r="2" fill="#E74C3C" filter="url(#energyGlow)"/>
                <!-- Cooling Fins -->
                <rect x="55" y="28" width="40" height="2" fill="#34495E"/>
                <rect x="55" y="50" width="40" height="2" fill="#34495E"/>
                <!-- Energy Blast Effect -->
                <path d="M120 40 L130 38 L135 40 L130 42 Z" fill="#00FFFF" opacity="0.8" filter="url(#energyGlow)"/>
                <!-- Trigger Guard -->
                <circle cx="30" cy="55" r="6" fill="none" stroke="#2C3E50" stroke-width="2"/>
                <!-- Grip -->
                <rect x="15" y="48" width="12" height="20" rx="2" fill="#654321" stroke="#4A2C17" stroke-width="2"/>
                
                <defs>
                    <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#9B59B6"/>
                        <stop offset="50%" style="stop-color:#E74C3C"/>
                        <stop offset="100%" style="stop-color:#3498DB"/>
                    </linearGradient>
                </defs>
            </svg>`;
    }

    createExplosiveWeaponSVG(weaponType, baseColor, rarityColor) {
        const glowEffect = this.createGlowFilter(rarityColor);
        
        return `
            <svg width="140" height="100" viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                <!-- Launcher Body -->
                <rect x="30" y="35" width="50" height="20" rx="4" fill="${baseColor}" stroke="#333" stroke-width="3" filter="url(#glow)"/>
                <!-- Large Tube -->
                <rect x="80" y="32" width="45" height="26" rx="13" fill="#2C3E50" stroke="#1A252F" stroke-width="2"/>
                <!-- Warning Stripes -->
                <rect x="85" y="30" width="3" height="30" fill="#F39C12"/>
                <rect x="90" y="30" width="3" height="30" fill="#E74C3C"/>
                <rect x="95" y="30" width="3" height="30" fill="#F39C12"/>
                <rect x="100" y="30" width="3" height="30" fill="#E74C3C"/>
                <!-- Grip -->
                <rect x="20" y="55" width="12" height="25" rx="3" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                <!-- Trigger Guard -->
                <circle cx="35" cy="65" r="8" fill="none" stroke="#2C3E50" stroke-width="2"/>
                <!-- Sight -->
                <rect x="45" y="30" width="4" height="8" fill="#FFD700"/>
                <!-- Exhaust Ports -->
                <circle cx="25" cy="40" r="3" fill="#666"/>
                <circle cx="25" cy="50" r="3" fill="#666"/>
                <!-- Missile/Rocket -->
                <path d="M125 40 L135 38 L135 42 Z" fill="#E74C3C" stroke="#C0392B" stroke-width="1"/>
            </svg>`;
    }

    createShieldSVG(weaponType, baseColor, rarityColor) {
        const glowEffect = this.createGlowFilter(rarityColor);
        
        return `
            <svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                ${glowEffect}
                <!-- Shield Main Body -->
                <path d="M50 10 L85 25 L85 80 L50 110 L15 80 L15 25 Z" 
                      fill="url(#shieldGradient)" stroke="#1F4E79" stroke-width="3" filter="url(#glow)"/>
                <!-- Center Emblem -->
                <circle cx="50" cy="55" r="15" fill="${rarityColor}" stroke="#333" stroke-width="2" filter="url(#glow)"/>
                <!-- Inner Pattern -->
                <circle cx="50" cy="55" r="8" fill="none" stroke="#fff" stroke-width="2" opacity="0.7"/>
                <!-- Handle (side view) -->
                <rect x="20" y="50" width="6" height="30" rx="3" fill="#8B4513" stroke="#654321" stroke-width="2"/>
                <!-- Reinforcement Ribs -->
                <path d="M25 30 Q50 25 75 30" fill="none" stroke="#1A365D" stroke-width="2"/>
                <path d="M25 70 Q50 65 75 70" fill="none" stroke="#1A365D" stroke-width="2"/>
                <!-- Energy Field Effect -->
                <path d="M50 15 L80 25 L80 75 L50 105 L20 75 L20 25 Z" 
                      fill="none" stroke="${rarityColor}" stroke-width="1" opacity="0.5" filter="url(#glow)"/>
                
                <defs>
                    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#3498DB"/>
                        <stop offset="50%" style="stop-color:#2980B9"/>
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