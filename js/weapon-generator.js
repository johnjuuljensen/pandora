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
            name: `${randomWeapon}`,
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
        // Generate realistic cartoon image for weapon type
        return this.createWeaponCartoonImage(weaponType);
    }

    createWeaponCartoonImage(weaponType) {
        // Create cartoon-style weapon representations using CSS and Unicode
        switch(weaponType) {
            case 'Pistol':
            case 'Revolver':
            case 'Plasma Pistol':
                return this.createPistolCartoon();
            case 'Riffel':
            case 'Assault Rifle':
            case 'Battle Rifle':
                return this.createRifleCartoon();
            case 'Haglgevær':
            case 'Combat Shotgun':
            case 'Double Barrel':
                return this.createShotgunCartoon();
            case 'Maskingevær':
            case 'Minigun':
            case 'Chain Gun':
                return this.createMachineGunCartoon();
            case 'Snigskytteriffel':
            case 'Anti-Material Rifle':
            case 'Precision Rifle':
                return this.createSniperRifleCartoon();
            case 'Laser Rifle':
            case 'Plasma Cannon':
            case 'Ion Blaster':
                return this.createEnergyWeaponCartoon();
            case 'Raket Launcher':
            case 'Granat Launcher':
            case 'Missile Pod':
                return this.createExplosiveWeaponCartoon();
            case 'Energi Shield':
            case 'Plasma Barrier':
            case 'Force Field':
            case 'Deflector Shield':
            case 'Riot Shield':
                return this.createShieldCartoon();
            default:
                return this.createDefaultWeaponCartoon();
        }
    }

    createPistolCartoon() {
        return `
        <div style="
            width: 80px; 
            height: 60px; 
            position: relative;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <!-- Grip/Handle -->
            <div style="
                position: absolute;
                top: 60%;
                left: 15%;
                width: 12px;
                height: 20px;
                background: #8b4513;
                border-radius: 2px;
                border: 1px solid #654321;
            "></div>
            <!-- Trigger Guard -->
            <div style="
                position: absolute;
                top: 65%;
                left: 32%;
                width: 8px;
                height: 8px;
                border: 2px solid #2c3e50;
                border-radius: 50%;
                background: transparent;
            "></div>
            <!-- Barrel -->
            <div style="
                position: absolute;
                top: 45%;
                right: 10%;
                width: 30px;
                height: 6px;
                background: linear-gradient(90deg, #2c3e50, #34495e);
                border-radius: 3px;
            "></div>
            <!-- Slide -->
            <div style="
                position: absolute;
                top: 40%;
                left: 30%;
                width: 40px;
                height: 12px;
                background: #34495e;
                border-radius: 2px;
                border: 1px solid #2c3e50;
            "></div>
            <span style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 8px;
                color: #95a5a6;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            ">🔫</span>
        </div>`;
    }

    createRifleCartoon() {
        return `
        <div style="
            width: 80px;
            height: 60px;
            position: relative;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <!-- Stock -->
            <div style="
                position: absolute;
                top: 50%;
                left: 5%;
                transform: translateY(-50%);
                width: 18px;
                height: 15px;
                background: #8b4513;
                border-radius: 2px;
                border: 1px solid #654321;
            "></div>
            <!-- Body -->
            <div style="
                position: absolute;
                top: 50%;
                left: 25%;
                transform: translateY(-50%);
                width: 25px;
                height: 12px;
                background: #2c3e50;
                border-radius: 2px;
                border: 1px solid #1a252f;
            "></div>
            <!-- Barrel -->
            <div style="
                position: absolute;
                top: 50%;
                right: 5%;
                transform: translateY(-50%);
                width: 35px;
                height: 8px;
                background: linear-gradient(90deg, #2c3e50, #34495e);
                border-radius: 4px;
            "></div>
            <!-- Trigger Guard -->
            <div style="
                position: absolute;
                top: 65%;
                left: 35%;
                width: 8px;
                height: 8px;
                border: 2px solid #2c3e50;
                border-radius: 50%;
                background: transparent;
            "></div>
            <!-- Magazine -->
            <div style="
                position: absolute;
                bottom: 15%;
                left: 40%;
                width: 6px;
                height: 12px;
                background: #34495e;
                border-radius: 1px;
                border: 1px solid #2c3e50;
            "></div>
            <span style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 8px;
                color: #95a5a6;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            ">🔫</span>
        </div>`;
    }

    createShotgunCartoon() {
        return `
        <div style="
            width: 80px;
            height: 60px;
            position: relative;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <!-- Stock -->
            <div style="
                position: absolute;
                top: 50%;
                left: 5%;
                transform: translateY(-50%);
                width: 20px;
                height: 18px;
                background: #8b4513;
                border-radius: 3px;
                border: 1px solid #654321;
            "></div>
            <!-- Body -->
            <div style="
                position: absolute;
                top: 50%;
                left: 28%;
                transform: translateY(-50%);
                width: 20px;
                height: 12px;
                background: #2c3e50;
                border-radius: 2px;
                border: 1px solid #1a252f;
            "></div>
            <!-- Double Barrel -->
            <div style="
                position: absolute;
                top: 45%;
                right: 5%;
                width: 28px;
                height: 6px;
                background: linear-gradient(90deg, #2c3e50, #34495e);
                border-radius: 3px;
            "></div>
            <div style="
                position: absolute;
                top: 55%;
                right: 5%;
                width: 28px;
                height: 6px;
                background: linear-gradient(90deg, #2c3e50, #34495e);
                border-radius: 3px;
            "></div>
            <!-- Trigger Guard -->
            <div style="
                position: absolute;
                top: 65%;
                left: 38%;
                width: 8px;
                height: 8px;
                border: 2px solid #2c3e50;
                border-radius: 50%;
                background: transparent;
            "></div>
            <span style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 8px;
                color: #95a5a6;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            ">💥</span>
        </div>`;
    }

    createMachineGunCartoon() {
        return `
        <div style="
            width: 80px;
            height: 60px;
            position: relative;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <!-- Stock -->
            <div style="
                position: absolute;
                top: 50%;
                left: 5%;
                transform: translateY(-50%);
                width: 15px;
                height: 15px;
                background: #8b4513;
                border-radius: 2px;
                border: 1px solid #654321;
            "></div>
            <!-- Body/Receiver -->
            <div style="
                position: absolute;
                top: 50%;
                left: 22%;
                transform: translateY(-50%);
                width: 30px;
                height: 14px;
                background: #2c3e50;
                border-radius: 2px;
                border: 1px solid #1a252f;
            "></div>
            <!-- Long Barrel -->
            <div style="
                position: absolute;
                top: 50%;
                right: 3%;
                transform: translateY(-50%);
                width: 40px;
                height: 6px;
                background: linear-gradient(90deg, #2c3e50, #34495e);
                border-radius: 3px;
            "></div>
            <!-- Large Magazine -->
            <div style="
                position: absolute;
                bottom: 10%;
                left: 35%;
                width: 8px;
                height: 15px;
                background: #34495e;
                border-radius: 1px;
                border: 1px solid #2c3e50;
            "></div>
            <span style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 8px;
                color: #95a5a6;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            ">🔥</span>
        </div>`;
    }

    createSniperRifleCartoon() {
        return `
        <div style="
            width: 80px;
            height: 60px;
            position: relative;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <!-- Stock -->
            <div style="
                position: absolute;
                top: 50%;
                left: 3%;
                transform: translateY(-50%);
                width: 22px;
                height: 15px;
                background: #8b4513;
                border-radius: 2px;
                border: 1px solid #654321;
            "></div>
            <!-- Body -->
            <div style="
                position: absolute;
                top: 50%;
                left: 28%;
                transform: translateY(-50%);
                width: 25px;
                height: 10px;
                background: #2c3e50;
                border-radius: 2px;
                border: 1px solid #1a252f;
            "></div>
            <!-- Long Precision Barrel -->
            <div style="
                position: absolute;
                top: 50%;
                right: 2%;
                transform: translateY(-50%);
                width: 45px;
                height: 5px;
                background: linear-gradient(90deg, #2c3e50, #34495e);
                border-radius: 2px;
            "></div>
            <!-- Scope -->
            <div style="
                position: absolute;
                top: 35%;
                left: 45%;
                width: 20px;
                height: 4px;
                background: #1a252f;
                border-radius: 2px;
                border: 1px solid #0d1117;
            "></div>
            <span style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 8px;
                color: #95a5a6;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            ">🎯</span>
        </div>`;
    }

    createEnergyWeaponCartoon() {
        return `
        <div style="
            width: 80px;
            height: 60px;
            position: relative;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <!-- Energy Core -->
            <div style="
                position: absolute;
                top: 50%;
                left: 15%;
                transform: translateY(-50%);
                width: 20px;
                height: 15px;
                background: linear-gradient(135deg, #9b59b6, #8e44ad);
                border-radius: 3px;
                border: 1px solid #663399;
                box-shadow: 0 0 6px rgba(155, 89, 182, 0.5);
            "></div>
            <!-- Barrel/Emitter -->
            <div style="
                position: absolute;
                top: 50%;
                right: 8%;
                transform: translateY(-50%);
                width: 35px;
                height: 8px;
                background: linear-gradient(90deg, #3498db, #2980b9);
                border-radius: 4px;
                box-shadow: 0 0 4px rgba(52, 152, 219, 0.4);
            "></div>
            <!-- Energy Coils -->
            <div style="
                position: absolute;
                top: 45%;
                left: 38%;
                width: 3px;
                height: 3px;
                background: #e74c3c;
                border-radius: 50%;
                box-shadow: 0 0 3px rgba(231, 76, 60, 0.6);
            "></div>
            <div style="
                position: absolute;
                top: 55%;
                left: 43%;
                width: 3px;
                height: 3px;
                background: #e74c3c;
                border-radius: 50%;
                box-shadow: 0 0 3px rgba(231, 76, 60, 0.6);
            "></div>
            <span style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 8px;
                color: #95a5a6;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            ">⚡</span>
        </div>`;
    }

    createExplosiveWeaponCartoon() {
        return `
        <div style="
            width: 80px;
            height: 60px;
            position: relative;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <!-- Launcher Body -->
            <div style="
                position: absolute;
                top: 50%;
                left: 20%;
                transform: translateY(-50%);
                width: 35px;
                height: 16px;
                background: #2c3e50;
                border-radius: 3px;
                border: 1px solid #1a252f;
            "></div>
            <!-- Large Barrel/Tube -->
            <div style="
                position: absolute;
                top: 50%;
                right: 5%;
                transform: translateY(-50%);
                width: 25px;
                height: 12px;
                background: linear-gradient(90deg, #34495e, #2c3e50);
                border-radius: 6px;
                border: 1px solid #1a252f;
            "></div>
            <!-- Grip -->
            <div style="
                position: absolute;
                top: 65%;
                left: 15%;
                width: 8px;
                height: 12px;
                background: #8b4513;
                border-radius: 2px;
                border: 1px solid #654321;
            "></div>
            <!-- Warning Stripes -->
            <div style="
                position: absolute;
                top: 45%;
                left: 30%;
                width: 2px;
                height: 6px;
                background: #f39c12;
            "></div>
            <div style="
                position: absolute;
                top: 55%;
                left: 35%;
                width: 2px;
                height: 6px;
                background: #f39c12;
            "></div>
            <span style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 8px;
                color: #95a5a6;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            ">💣</span>
        </div>`;
    }

    createShieldCartoon() {
        return `
        <div style="
            width: 80px;
            height: 60px;
            position: relative;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <!-- Shield Main Body -->
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 50px;
                height: 45px;
                background: linear-gradient(135deg, #3498db, #2980b9);
                border-radius: 8px;
                border: 2px solid #1f4e79;
                box-shadow: inset 0 2px 4px rgba(255,255,255,0.2);
            "></div>
            <!-- Center Emblem -->
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                border-radius: 50%;
                border: 1px solid #922b21;
            "></div>
            <!-- Handle -->
            <div style="
                position: absolute;
                top: 50%;
                left: 25%;
                transform: translateY(-50%);
                width: 4px;
                height: 20px;
                background: #8b4513;
                border-radius: 2px;
                border: 1px solid #654321;
            "></div>
            <span style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 8px;
                color: #95a5a6;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            ">🛡️</span>
        </div>`;
    }

    createDefaultWeaponCartoon() {
        return `
        <div style="
            width: 80px;
            height: 60px;
            position: relative;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <!-- Generic Weapon Silhouette -->
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 60px;
                height: 30px;
                background: linear-gradient(135deg, #34495e, #2c3e50);
                border-radius: 4px;
                border: 1px solid #1a252f;
            "></div>
            <span style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 8px;
                color: #95a5a6;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            ">⚔️</span>
        </div>`;
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