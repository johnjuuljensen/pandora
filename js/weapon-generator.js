/**
 * Weapon Generation Module
 * Handles weapon creation, stats calculation, and weapon class management
 */

class WeaponGenerator {
    constructor() {
        this.weaponClasses = null;
        this.rarities = null;
        this.isLoaded = false;
        this.svgGenerator = new SVGWeaponGenerator();
        this.weapon = null; // Current weapon being generated
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
            
            // Also initialize SVG generator data
            this.svgGenerator.weaponClasses = this.weaponClasses;
            this.svgGenerator.rarities = this.rarities;
            this.svgGenerator.isLoaded = true;
            
            console.log('Weapon data loaded successfully');
        } catch (error) {
            console.error('Failed to load weapon data:', error);
            throw error;
        }
    }

    generateWeapon(characterLevel = 1) {
        if (!this.isLoaded) {
            throw new Error('Weapon data not loaded. Call loadData() first.');
        }

        // Select random weapon class and type
        const classNames = Object.keys(this.weaponClasses);
        const randomClassName = classNames[Math.floor(Math.random() * classNames.length)];
        const selectedClass = this.weaponClasses[randomClassName];
        const randomWeapon = selectedClass.types[Math.floor(Math.random() * selectedClass.types.length)];
        
        // Generate weapon level 1-3 levels around character level
        const minLevel = Math.max(1, characterLevel - 1);
        const maxLevel = characterLevel + 3;
        const weaponLevel = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
        
        const randomRarity = this.getRandomRarityByLevel(weaponLevel);
        
        // Level-scaled base stats based on weapon level and class
        const levelMultiplier = 1 + (weaponLevel - 1) * 0.15; // 15% increase per level
        
        // Calculate range based on class baseRange + some randomness
        const rangeVariation = selectedClass.baseRange * 0.2; // ±20% variation
        const finalRange = Math.floor(selectedClass.baseRange + (Math.random() - 0.5) * rangeVariation);
        
        const baseStats = {
            damage: Math.floor((Math.random() * 30 + 15) * levelMultiplier * selectedClass.statModifiers.damage),
            accuracy: Math.floor((Math.random() * 20 + 75) * selectedClass.statModifiers.accuracy),
            range: Math.max(1, finalRange) // Ensure minimum range of 1
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
            equipped: false,
            // For shields, add shield points based on damage stat
            shieldPoints: selectedClass.isShield ? Math.floor(baseStats.damage * randomRarity.statBonus * 10) : 0
        };
        
        // Store current weapon for SVG generation
        this.weapon = weapon;
        weapon.svgImage = this.svgGenerator.generateSVGWeaponImage(randomWeapon, randomClassName, randomRarity, weaponLevel);
        weapon.image = weapon.svgImage; // Backwards compatibility

        return weapon;
    }

    getRandomRarityByLevel(level) {
        // Higher level = better chance for rare items
        let weights = [50, 30, 15, 4, 1]; // Base weights
        
        // Shift weights based on level
        if (level >= 3) {
            weights = [40, 35, 20, 4, 1];
        }
        if (level >= 5) {
            weights = [30, 30, 25, 12, 3];
        }
        if (level >= 8) {
            weights = [20, 25, 30, 20, 5];
        }
        if (level >= 12) {
            weights = [15, 20, 30, 25, 10];
        }

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return this.rarities[i];
            }
        }
        
        return this.rarities[0]; // Fallback
    }











    // Class mapping functions for QR system
    getClassCode(weaponClass) {
        const codes = {
            'Nærkamp': 'M', 'Pistol': 'P', 'Haglgevær': 'S', 'Riffel': 'R',
            'Sniper': 'N', 'Automatisk': 'A', 'Energi': 'E', 'Eksplosiv': 'X', 'Shield': 'D'
        };
        return codes[weaponClass] || 'M';
    }

    getClassFromCode(code) {
        const classes = {
            'M': 'Nærkamp', 'P': 'Pistol', 'S': 'Haglgevær', 'R': 'Riffel',
            'N': 'Sniper', 'A': 'Automatisk', 'E': 'Energi', 'X': 'Eksplosiv', 'D': 'Shield'
        };
        return classes[code] || 'Nærkamp';
    }

    getRarityCode(rarityName) {
        const codes = {
            'Almindelig': 1, 'Ualmindelig': 2, 'Sjælden': 3, 'Episk': 4, 'Legendarisk': 5
        };
        return codes[rarityName] || 1;
    }

    getWeaponTypeCode(weaponType) {
        const codes = {
            // Nærkamp weapons (10-14)
            'Sværd': 10, 'Kniv': 11, 'Økse': 12, 'Hammer': 13, 'Stav': 14,
            // Pistol weapons (20-22)
            'Pistol': 20, 'Revolver': 21, 'Plasma Pistol': 22,
            // Haglgevær weapons (30-32)
            'Haglgevær': 30, 'Combat Shotgun': 31, 'Double Barrel': 32,
            // Riffel weapons (40-42)
            'Riffel': 40, 'Assault Rifle': 41, 'Battle Rifle': 42,
            // Sniper weapons (50-52)
            'Snigskytteriffel': 50, 'Anti-Material Rifle': 51, 'Precision Rifle': 52,
            // Automatisk weapons (60-62)
            'Maskingevær': 60, 'Minigun': 61, 'Chain Gun': 62,
            // Energi weapons (70-72)
            'Laser Rifle': 70, 'Plasma Cannon': 71, 'Ion Blaster': 72,
            // Eksplosiv weapons (80-82)
            'Raket Launcher': 80, 'Granat Launcher': 81, 'Missile Pod': 82,
            // Shield weapons (90-94)
            'Energi Shield': 90, 'Plasma Barrier': 91, 'Force Field': 92, 'Deflector Shield': 93, 'Riot Shield': 94
        };
        return codes[weaponType] || 10;
    }

    getWeaponTypeFromCode(code) {
        const types = {
            // Nærkamp weapons (10-14)
            10: 'Sværd', 11: 'Kniv', 12: 'Økse', 13: 'Hammer', 14: 'Stav',
            // Pistol weapons (20-22)
            20: 'Pistol', 21: 'Revolver', 22: 'Plasma Pistol',
            // Haglgevær weapons (30-32)
            30: 'Haglgevær', 31: 'Combat Shotgun', 32: 'Double Barrel',
            // Riffel weapons (40-42)
            40: 'Riffel', 41: 'Assault Rifle', 42: 'Battle Rifle',
            // Sniper weapons (50-52)
            50: 'Snigskytteriffel', 51: 'Anti-Material Rifle', 52: 'Precision Rifle',
            // Automatisk weapons (60-62)
            60: 'Maskingevær', 61: 'Minigun', 62: 'Chain Gun',
            // Energi weapons (70-72)
            70: 'Laser Rifle', 71: 'Plasma Cannon', 72: 'Ion Blaster',
            // Eksplosiv weapons (80-82)
            80: 'Raket Launcher', 81: 'Granat Launcher', 82: 'Missile Pod',
            // Shield weapons (90-94)
            90: 'Energi Shield', 91: 'Plasma Barrier', 92: 'Force Field', 93: 'Deflector Shield', 94: 'Riot Shield'
        };
        return types[code] || 'Sværd';
    }

    getWeaponClassFromTypeCode(typeCode) {
        if (typeCode >= 10 && typeCode <= 14) return 'Nærkamp';
        if (typeCode >= 20 && typeCode <= 22) return 'Pistol';
        if (typeCode >= 30 && typeCode <= 32) return 'Haglgevær';
        if (typeCode >= 40 && typeCode <= 42) return 'Riffel';
        if (typeCode >= 50 && typeCode <= 52) return 'Sniper';
        if (typeCode >= 60 && typeCode <= 62) return 'Automatisk';
        if (typeCode >= 70 && typeCode <= 72) return 'Energi';
        if (typeCode >= 80 && typeCode <= 82) return 'Eksplosiv';
        if (typeCode >= 90 && typeCode <= 94) return 'Shield';
        return 'Nærkamp';
    }

    getRarityFromCode(code) {
        const rarities = {
            1: 'Almindelig', 2: 'Ualmindelig', 3: 'Sjælden', 4: 'Episk', 5: 'Legendarisk'
        };
        return rarities[code] || 'Almindelig';
    }

    getRarityByName(name) {
        return this.rarities.find(r => r.name === name) || this.rarities[0];
    }

    getWeaponImageByClass(weaponClass) {
        return this.weaponClasses[weaponClass]?.emoji || '⚔️';
    }

    getClassEmojiByClass(weaponClass) {
        return this.weaponClasses[weaponClass]?.emoji || '⚔️';
    }

    getClassColorByClass(weaponClass) {
        return this.weaponClasses[weaponClass]?.color || '#e74c3c';
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeaponGenerator;
} else {
    window.WeaponGenerator = WeaponGenerator;
}