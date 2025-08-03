/**
 * Weapon Generation Module
 * Handles weapon creation, stats calculation, and weapon class management
 */

class WeaponGenerator {
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
            image: this.generateWeaponImage(randomWeapon),
            equipped: false,
            // For shields, add shield points based on damage stat
            shieldPoints: selectedClass.isShield ? Math.floor(baseStats.damage * randomRarity.statBonus * 10) : 0
        };

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

    generateWeaponImage(weaponType) {
        // Simple emoji mapping based on weapon type
        const imageMap = {
            'Sværd': '⚔️', 'Kniv': '🗡️', 'Økse': '🪓', 'Hammer': '🔨', 'Stav': '🏒',
            'Pistol': '🔫', 'Revolver': '🔫', 'Plasma Pistol': '🔫',
            'Haglgevær': '💥', 'Combat Shotgun': '💥', 'Double Barrel': '💥',
            'Riffel': '🎯', 'Assault Rifle': '🎯', 'Battle Rifle': '🎯',
            'Snigskytteriffel': '🎯', 'Anti-Material Rifle': '🎯', 'Precision Rifle': '🎯',
            'Maskingevær': '🔥', 'Minigun': '🔥', 'Chain Gun': '🔥',
            'Laser Rifle': '⚡', 'Plasma Cannon': '⚡', 'Ion Blaster': '⚡',
            'Raket Launcher': '💣', 'Granat Launcher': '💣', 'Missile Pod': '💣',
            'Energi Shield': '🛡️', 'Plasma Barrier': '🛡️', 'Force Field': '🛡️', 
            'Deflector Shield': '🛡️', 'Riot Shield': '🛡️'
        };
        
        return imageMap[weaponType] || '⚔️';
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
            'Almindelig': '1', 'Ualmindelig': '2', 'Sjælden': '3', 'Episk': '4', 'Legendarisk': '5'
        };
        return codes[rarityName] || '1';
    }

    getRarityFromCode(code) {
        const rarities = {
            '1': 'Almindelig', '2': 'Ualmindelig', '3': 'Sjælden', '4': 'Episk', '5': 'Legendarisk'
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