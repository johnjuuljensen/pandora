// Pandora RPG Character Manager
class CharacterManager {
    constructor() {
        this.character = this.loadCharacter();
        this.weapons = [];
        this.autoLoadSavedData();
        this.initializeEventListeners();
        this.updateDisplay();
    }

    // Character data management
    loadCharacter() {
        const saved = localStorage.getItem('pandora-character');
        const defaultChar = {
            name: '',
            level: 1,
            currentHp: 100,
            maxHp: 100,
            currentShield: 0,
            maxShield: 50
        };
        
        if (saved) {
            const character = JSON.parse(saved);
            // Ensure max HP matches level when loading
            character.maxHp = this.calculateMaxHPForLevel(character.level);
            // Ensure current HP doesn't exceed new max HP
            character.currentHp = Math.min(character.currentHp, character.maxHp);
            
            // Add shield stats if missing (backwards compatibility)
            if (character.currentShield === undefined) character.currentShield = 0;
            if (character.maxShield === undefined) character.maxShield = 50;
            
            return character;
        }
        
        return defaultChar;
    }

    autoLoadSavedData() {
        const savedCharacter = localStorage.getItem('pandora-character');
        const savedWeapons = localStorage.getItem('pandora-weapons');
        
        if (savedWeapons) {
            this.weapons = JSON.parse(savedWeapons);
            
            // Add equipped property to old weapons if missing
            this.weapons.forEach(weapon => {
                if (weapon.equipped === undefined) weapon.equipped = false;
            });
        }
        
        // Show message if any data was loaded
        if (savedCharacter || savedWeapons) {
            this.showMessage('Seneste karakter indlæst automatisk! 🔄');
        }
    }

    calculateMaxHPForLevel(level) {
        // Base HP: 100, +20 HP per level
        return 100 + (level - 1) * 20;
    }

    calculateMaxSlotsForLevel(level) {
        // Base slots: 1, +1 slot for every 2 levels (level 3, 5, 7, etc.)
        return 1 + Math.floor((level - 1) / 2);
    }


    saveCharacter() {
        const character = {
            name: document.getElementById('character-name').value,
            level: parseInt(document.getElementById('character-level').value),
            currentHp: parseInt(document.getElementById('current-hp').value),
            maxHp: parseInt(document.getElementById('max-hp').value),
            currentShield: parseInt(document.getElementById('current-shield').value) || 0,
            maxShield: parseInt(document.getElementById('max-shield').value) || 50
        };
        
        localStorage.setItem('pandora-character', JSON.stringify(character));
        localStorage.setItem('pandora-weapons', JSON.stringify(this.weapons));
        
        this.showMessage('Karakter gemt! 💾');
        this.character = character;
    }

    loadSavedCharacter() {
        const saved = localStorage.getItem('pandora-character');
        const savedWeapons = localStorage.getItem('pandora-weapons');
        
        if (saved) {
            this.character = JSON.parse(saved);
            this.weapons = savedWeapons ? JSON.parse(savedWeapons) : [];
            
            // Add equipped property to old weapons if missing
            this.weapons.forEach(weapon => {
                if (weapon.equipped === undefined) weapon.equipped = false;
            });
            
            this.updateDisplay();
            this.updateWeaponDisplay();
            this.showMessage('Karakter indlæst! 📁');
        } else {
            this.showMessage('Ingen gemt karakter fundet!');
        }
    }

    updateDisplay() {
        document.getElementById('character-name').value = this.character.name;
        document.getElementById('character-level').value = this.character.level;
        
        // Ensure max HP matches current level
        const correctMaxHP = this.calculateMaxHPForLevel(this.character.level);
        this.character.maxHp = correctMaxHP;
        this.character.currentHp = Math.min(this.character.currentHp, correctMaxHP);
        
        document.getElementById('current-hp').value = this.character.currentHp;
        document.getElementById('max-hp').value = this.character.maxHp;
        document.getElementById('current-shield').value = this.character.currentShield || 0;
        document.getElementById('max-shield').value = this.character.maxShield || 50;
        
        this.updateHealthBar();
        this.updateShieldBar();
        this.updateWeaponDisplay();
    }

    updateMaxHPForLevel() {
        const level = parseInt(document.getElementById('character-level').value) || 1;
        const oldMaxHP = parseInt(document.getElementById('max-hp').value) || 100;
        const newMaxHP = this.calculateMaxHPForLevel(level);
        const currentHP = parseInt(document.getElementById('current-hp').value) || oldMaxHP;
        
        // Calculate HP increase
        const hpIncrease = newMaxHP - oldMaxHP;
        
        // Update max HP field
        document.getElementById('max-hp').value = newMaxHP;
        
        // Increase current HP by the same amount, but cap at new max
        const newCurrentHP = Math.min(currentHP + hpIncrease, newMaxHP);
        document.getElementById('current-hp').value = Math.max(0, newCurrentHP);
        
        this.updateHealthBar();
        
        // Check inventory slots
        const newMaxSlots = this.calculateMaxSlotsForLevel(level);
        const oldMaxSlots = this.calculateMaxSlotsForLevel(level - (hpIncrease > 0 ? 1 : -1));
        const slotsIncrease = newMaxSlots - oldMaxSlots;
        
        let message = '';
        if (hpIncrease > 0) {
            message = `Level ${level}: +${hpIncrease} HP! Nu ${newCurrentHP}/${newMaxHP} HP 💪`;
        } else if (hpIncrease < 0) {
            message = `Level ${level}: ${hpIncrease} HP. Nu ${newCurrentHP}/${newMaxHP} HP`;
        }
        
        if (slotsIncrease > 0) {
            message += ` +${slotsIncrease} inventory slot${slotsIncrease > 1 ? 's' : ''}! 📦`;
        }
        
        if (message) {
            this.showMessage(message);
        }
    }

    updateSlotCounter() {
        const slotCounter = document.getElementById('slot-counter');
        if (slotCounter) {
            const currentLevel = parseInt(document.getElementById('character-level').value) || 1;
            const maxSlots = this.calculateMaxSlotsForLevel(currentLevel);
            const usedSlots = this.weapons.length;
            
            slotCounter.textContent = `📦 Slots: ${usedSlots}/${maxSlots}`;
            
            // Change color based on fullness
            if (usedSlots >= maxSlots) {
                slotCounter.style.color = '#dc3545'; // Red when full
            } else if (usedSlots >= maxSlots * 0.8) {
                slotCounter.style.color = '#ffc107'; // Yellow when nearly full
            } else {
                slotCounter.style.color = '#28a745'; // Green when plenty of space
            }
        }
    }

    updateHealthBar() {
        const currentHp = parseInt(document.getElementById('current-hp').value);
        const maxHp = parseInt(document.getElementById('max-hp').value);
        const percentage = (currentHp / maxHp) * 100;
        
        const healthBar = document.getElementById('health-bar-visual');
        healthBar.style.width = percentage + '%';
        
        // Change color based on health percentage
        if (percentage > 70) {
            healthBar.style.background = '#28a745';
        } else if (percentage > 30) {
            healthBar.style.background = '#ffc107';
        } else {
            healthBar.style.background = '#dc3545';
        }
    }

    updateShieldBar() {
        const currentShield = parseInt(document.getElementById('current-shield').value) || 0;
        const maxShield = parseInt(document.getElementById('max-shield').value) || 50;
        const percentage = maxShield > 0 ? (currentShield / maxShield) * 100 : 0;
        
        const shieldBar = document.getElementById('shield-bar-visual');
        if (shieldBar) {
            shieldBar.style.width = percentage + '%';
            
            // Shield bar is always blue/cyan
            shieldBar.style.background = '#17a2b8';
        }
    }

    restoreShield() {
        const maxShield = parseInt(document.getElementById('max-shield').value) || 50;
        document.getElementById('current-shield').value = maxShield;
        this.updateShieldBar();
        this.showMessage(`Skjold genoprettet til ${maxShield}! 🛡️`);
    }

    // Weapon generation
    generateWeapon() {
        const characterLevel = parseInt(document.getElementById('character-level').value) || 1;
        
        // Weapon classes with their types and characteristics
        const weaponClasses = {
            'Nærkamp': {
                types: ['Sværd', 'Kniv', 'Økse', 'Hammer', 'Stav'],
                color: '#e74c3c',
                emoji: '⚔️',
                statModifiers: { damage: 1.5, accuracy: 1.0, range: 0.1 }, // Høj skade, ingen rækkevidde
                baseRange: 2 // Fast lav range
            },
            'Pistol': {
                types: ['Pistol', 'Revolver', 'Plasma Pistol'],
                color: '#3498db', 
                emoji: '🔫',
                statModifiers: { damage: 0.9, accuracy: 1.1, range: 1.0 }, // God præcision, moderat range
                baseRange: 25
            },
            'Haglgevær': {
                types: ['Haglgevær', 'Combat Shotgun', 'Double Barrel'],
                color: '#e67e22',
                emoji: '💥',
                statModifiers: { damage: 1.8, accuracy: 0.6, range: 0.4 }, // Meget høj skade, lav præcision og range
                baseRange: 15,
                damageDropoff: true // Skade falder med afstand
            },
            'Riffel': {
                types: ['Riffel', 'Assault Rifle', 'Battle Rifle'],
                color: '#27ae60',
                emoji: '🎯',
                statModifiers: { damage: 1.0, accuracy: 1.0, range: 1.0 }, // Balanceret baseline
                baseRange: 40
            },
            'Sniper': {
                types: ['Snigskytteriffel', 'Anti-Material Rifle', 'Precision Rifle'],
                color: '#9b59b6',
                emoji: '🎯',
                statModifiers: { damage: 1.7, accuracy: 1.4, range: 2.2 }, // Højeste stats across the board
                baseRange: 80
            },
            'Automatisk': {
                types: ['Maskingevær', 'Minigun', 'Chain Gun'],
                color: '#f39c12',
                emoji: '🔥',
                statModifiers: { damage: 1.2, accuracy: 0.7, range: 1.1 }, // Høj skade, lav præcision
                baseRange: 50
            },
            'Energi': {
                types: ['Laser Rifle', 'Plasma Cannon', 'Ion Blaster'],
                color: '#1abc9c',
                emoji: '⚡',
                statModifiers: { damage: 1.1, accuracy: 1.3, range: 1.2 }, // Høj præcision, moderat rækkevidde
                baseRange: 60
            },
            'Eksplosiv': {
                types: ['Raket Launcher', 'Granat Launcher', 'Missile Pod'],
                color: '#e74c3c',
                emoji: '💣',
                statModifiers: { damage: 2.2, accuracy: 0.5, range: 1.0 }, // Ekstrem skade, meget lav præcision
                baseRange: 100
            }
        };
        
        const rarities = [
            { name: 'Almindelig', color: '#6c757d', statBonus: 1 },
            { name: 'Ualmindelig', color: '#28a745', statBonus: 1.2 },
            { name: 'Sjælden', color: '#007bff', statBonus: 1.5 },
            { name: 'Episk', color: '#6f42c1', statBonus: 2 },
            { name: 'Legendarisk', color: '#fd7e14', statBonus: 3 }
        ];

        // Select random weapon class and type
        const classNames = Object.keys(weaponClasses);
        const randomClassName = classNames[Math.floor(Math.random() * classNames.length)];
        const selectedClass = weaponClasses[randomClassName];
        const randomWeapon = selectedClass.types[Math.floor(Math.random() * selectedClass.types.length)];
        
        // Generate weapon level 1-3 levels around character level
        const minLevel = Math.max(1, characterLevel - 1);
        const maxLevel = characterLevel + 3;
        const weaponLevel = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
        
        const randomRarity = this.getRandomRarityByLevel(rarities, weaponLevel);
        
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
            equipped: false
        };

        this.currentGeneratedWeapon = weapon;
        this.displayNewWeapon(weapon);
    }

    getRandomRarityByLevel(rarities, level) {
        // Higher level = better chance for rare items
        const levelBonus = Math.min(level * 5, 25); // Max 25% bonus at level 5+
        
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
        
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        const random = Math.random() * total;
        
        let currentWeight = 0;
        for (let i = 0; i < weights.length; i++) {
            currentWeight += weights[i];
            if (random <= currentWeight) {
                return rarities[i];
            }
        }
        
        return rarities[0]; // Fallback
    }

    generateWeaponImage(weaponType) {
        // Generate realistic cartoon image for weapon type
        return this.createWeaponCartoonImage(weaponType);
    }

    createWeaponCartoonImage(weaponType) {
        // Create cartoon-style weapon representations using CSS and Unicode
        switch(weaponType) {
            case 'Pistol':
                return this.createPistolCartoon();
            case 'Riffel':
                return this.createRifleCartoon();
            case 'Haglgevær':
                return this.createShotgunCartoon();
            case 'Maskingevær':
                return this.createMachineGunCartoon();
            case 'Snigskytteriffel':
                return this.createSniperRifleCartoon();
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
                right: 8%;
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
                width: 35px;
                height: 10px;
                background: #2c3e50;
                border-radius: 2px;
                border: 1px solid #1a252f;
            "></div>
            <span style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 10px;
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
            ">🔫</span>
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
            <!-- Bipod legs -->
            <div style="
                position: absolute;
                bottom: 15%;
                left: 50%;
                width: 1px;
                height: 8px;
                background: #7f8c8d;
                transform: rotate(15deg);
            "></div>
            <div style="
                position: absolute;
                bottom: 15%;
                left: 55%;
                width: 1px;
                height: 8px;
                background: #7f8c8d;
                transform: rotate(-15deg);
            "></div>
            <!-- Magazine -->
            <div style="
                position: absolute;
                bottom: 12%;
                left: 40%;
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
            ">🔫</span>
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
                width: 18px;
                height: 16px;
                background: #8b4513;
                border-radius: 2px;
                border: 1px solid #654321;
            "></div>
            <!-- Body/Receiver -->
            <div style="
                position: absolute;
                top: 50%;
                left: 23%;
                transform: translateY(-50%);
                width: 28px;
                height: 10px;
                background: #2c3e50;
                border-radius: 2px;
                border: 1px solid #1a252f;
            "></div>
            <!-- Long Barrel -->
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
                left: 35%;
                width: 20px;
                height: 4px;
                background: #7f8c8d;
                border-radius: 2px;
                border: 1px solid #95a5a6;
            "></div>
            <!-- Scope mounts -->
            <div style="
                position: absolute;
                top: 42%;
                left: 37%;
                width: 2px;
                height: 3px;
                background: #7f8c8d;
            "></div>
            <div style="
                position: absolute;
                top: 42%;
                left: 50%;
                width: 2px;
                height: 3px;
                background: #7f8c8d;
            "></div>
            <!-- Magazine -->
            <div style="
                position: absolute;
                bottom: 15%;
                left: 40%;
                width: 5px;
                height: 10px;
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
            ">🎯</span>
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
            <div style="
                position: absolute;
                top: 50%;
                left: 25%;
                transform: translateY(-50%);
                width: 15px;
                height: 18px;
                background: #34495e;
                border-radius: 3px;
                border: 2px solid #2c3e50;
            "></div>
            <div style="
                position: absolute;
                top: 50%;
                right: 15%;
                transform: translateY(-50%);
                width: 25px;
                height: 8px;
                background: linear-gradient(90deg, #95a5a6, #7f8c8d);
                border-radius: 4px;
            "></div>
            <div style="
                position: absolute;
                top: 50%;
                left: 35%;
                transform: translate(-50%, -50%);
                width: 4px;
                height: 4px;
                background: #3498db;
                border-radius: 50%;
                box-shadow: 0 0 4px #3498db;
            "></div>
            <span style="
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 10px;
                color: white;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
            ">🔧</span>
        </div>`;
    }

    displayNewWeapon(weapon) {
        const display = document.getElementById('new-weapon-display');
        display.innerHTML = `
            <h3>Nyt Våben Genereret!</h3>
            <div class="weapon-card compact">
                <div class="weapon-image">${weapon.image}</div>
                <div class="weapon-name" style="color: ${weapon.rarity.color}">${weapon.name}</div>
                <div class="weapon-class" style="color: ${weapon.classColor}; font-weight: bold; margin: 5px 0;">
                    ${weapon.classEmoji} ${weapon.weaponClass}
                </div>
                <div class="weapon-stats compact">
                    <span title="Level: ${weapon.level}">⭐${weapon.level}</span>
                    <span title="Skade: ${weapon.damage}">💥${weapon.damage}</span>
                    <span title="Præcision: ${weapon.accuracy}%">🎯${weapon.accuracy}%</span>
                    <span title="Rækkevidde: ${weapon.range}m">📏${weapon.range}m</span>
                </div>
                <div class="weapon-actions">
                    <button onclick="characterManager.addWeaponToInventory(${weapon.id})" class="action-btn compact">
                        Tilføj
                    </button>
                    <button onclick="characterManager.discardWeapon()" class="action-btn compact" style="background: #dc3545;">
                        Afvis
                    </button>
                </div>
            </div>
        `;
        display.style.display = 'block';
    }

    addWeaponToInventory(weaponId) {
        // Check inventory slot limit
        const currentLevel = parseInt(document.getElementById('character-level').value) || 1;
        const maxSlots = this.calculateMaxSlotsForLevel(currentLevel);
        
        if (this.weapons.length >= maxSlots) {
            this.showMessage(`Inventory fuldt! Level ${currentLevel} tillader ${maxSlots} våben. Level op for flere slots! 📦`);
            return;
        }

        // Find weapon in temporary storage or create from current display
        const weaponDisplay = document.getElementById('new-weapon-display');
        if (weaponDisplay.style.display !== 'none') {
            // Get weapon data from the current preview
            const weaponData = this.currentGeneratedWeapon;
            if (weaponData && weaponData.id === weaponId) {
                this.weapons.push(weaponData);
                this.showMessage(`${weaponData.name} tilføjet til inventory! ⚔️ (${this.weapons.length}/${maxSlots} slots)`);
                this.updateWeaponDisplay();
                weaponDisplay.style.display = 'none';
            }
        }
    }

    discardWeapon() {
        document.getElementById('new-weapon-display').style.display = 'none';
        this.currentGeneratedWeapon = null;
        this.showMessage('Våben afvist');
    }

    updateWeaponDisplay() {
        const weaponList = document.getElementById('weapon-list');
        const filterSelect = document.getElementById('weapon-class-filter');
        const selectedClass = filterSelect ? filterSelect.value : 'all';
        
        // Update slot counter
        this.updateSlotCounter();
        
        if (this.weapons.length === 0) {
            weaponList.innerHTML = '<p class="empty-state">Ingen våben endnu. Generer noget loot!</p>';
            return;
        }

        // Filter weapons by class
        let filteredWeapons = this.weapons;
        if (selectedClass !== 'all') {
            filteredWeapons = this.weapons.filter(weapon => weapon.weaponClass === selectedClass);
        }

        // Check if filtered result is empty
        if (filteredWeapons.length === 0) {
            weaponList.innerHTML = `<p class="empty-state">Ingen ${selectedClass} våben fundet.</p>`;
            return;
        }

        // Sort weapons: equipped first, then by ID (newest first)
        const sortedWeapons = [...filteredWeapons].sort((a, b) => {
            if (a.equipped && !b.equipped) return -1;
            if (!a.equipped && b.equipped) return 1;
            return b.id - a.id;
        });

        weaponList.innerHTML = sortedWeapons.map(weapon => {
            const currentLevel = parseInt(document.getElementById('character-level').value) || 1;
            const canUse = weapon.level <= currentLevel;
            const isEquipped = weapon.equipped;
            
            return `
            <div class="weapon-card compact ${canUse ? '' : 'weapon-too-high-level'} ${isEquipped ? 'weapon-equipped' : ''}">
                <div class="weapon-image compact">${weapon.image}</div>
                <div class="weapon-name compact" style="color: ${weapon.rarity.color}">
                    ${weapon.name} ${isEquipped ? '⚔️' : ''}
                </div>
                ${weapon.weaponClass ? `<div class="weapon-class compact" style="color: ${weapon.classColor}; font-weight: bold;">
                    ${weapon.classEmoji} ${weapon.weaponClass}
                </div>` : ''}
                <div class="weapon-stats compact">
                    <span title="Level: ${weapon.level} ${canUse ? '' : '(For høj level!)'}">⭐${weapon.level}${canUse ? '' : '❌'}</span>
                    <span title="Skade: ${weapon.damage}">💥${weapon.damage}</span>
                    <span title="Præcision: ${weapon.accuracy}%">🎯${weapon.accuracy}%</span>
                    <span title="Rækkevidde: ${weapon.range}m">📏${weapon.range}m</span>
                </div>
                <div class="weapon-actions compact">
                    ${canUse ? (isEquipped ? 
                        `<button onclick="characterManager.unequipWeapon(${weapon.id})" class="action-btn compact" style="background: #6c757d;" title="Unequip våben">
                            📤
                        </button>` :
                        `<button onclick="characterManager.equipWeapon(${weapon.id})" class="action-btn compact" style="background: #28a745;" title="Equip våben">
                            📥
                        </button>`
                    ) : ''}
                    <button onclick="characterManager.removeWeapon(${weapon.id})" class="action-btn compact" style="background: ${isEquipped ? '#6c757d' : '#dc3545'};" ${isEquipped ? 'disabled' : ''} title="Fjern våben">
                        🗑️
                    </button>
                </div>
            </div>
        `;
        }).join('');
    }

    removeWeapon(weaponId) {
        this.weapons = this.weapons.filter(w => w.id !== weaponId);
        this.updateWeaponDisplay();
        this.showMessage('Våben fjernet fra inventory');
    }

    equipWeapon(weaponId) {
        // Unequip all weapons first
        this.weapons.forEach(w => w.equipped = false);
        
        // Equip the selected weapon
        const weapon = this.weapons.find(w => w.id === weaponId);
        if (weapon) {
            weapon.equipped = true;
            this.updateWeaponDisplay();
            this.showMessage(`${weapon.name} equipped! ⚔️`);
        }
    }

    unequipWeapon(weaponId) {
        const weapon = this.weapons.find(w => w.id === weaponId);
        if (weapon) {
            weapon.equipped = false;
            this.updateWeaponDisplay();
            this.showMessage(`${weapon.name} unequipped`);
        }
    }

    // Dice rolling
    rollDice() {
        const result = Math.floor(Math.random() * 6) + 1;
        const diceDisplay = document.getElementById('dice-result');
        
        diceDisplay.innerHTML = `
            <h3>🎲 Terningkast Resultat</h3>
            <div style="font-size: 2em; color: #1e3c72; margin: 10px 0;">${result}</div>
            <p>Du kastede en D6 og fik: <strong>${result}</strong></p>
        `;
        diceDisplay.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            diceDisplay.style.display = 'none';
        }, 5000);
    }

    // Utility functions
    showMessage(message) {
        // Create temporary message display
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-popup';
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: bold;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    initializeEventListeners() {
        // Tab navigation
        this.initializeTabs();
        
        // Character management
        document.getElementById('save-character').addEventListener('click', () => this.saveCharacter());
        document.getElementById('load-character').addEventListener('click', () => this.loadSavedCharacter());
        document.getElementById('restore-shield').addEventListener('click', () => this.restoreShield());
        
        // Health bar updates
        document.getElementById('current-hp').addEventListener('input', () => this.updateHealthBar());
        document.getElementById('max-hp').addEventListener('input', () => this.updateHealthBar());
        
        // Shield bar updates
        document.getElementById('current-shield').addEventListener('input', () => this.updateShieldBar());
        document.getElementById('max-shield').addEventListener('input', () => this.updateShieldBar());
        
        // Level updates
        document.getElementById('character-level').addEventListener('input', () => {
            this.updateMaxHPForLevel();
            this.updateWeaponDisplay();
        });
        
        // Weapon generation
        document.getElementById('generate-weapon').addEventListener('click', () => this.generateWeapon());
        
        // Dice rolling
        document.getElementById('roll-dice').addEventListener('click', () => this.rollDice());
        
        // Weapon class filter
        const filterSelect = document.getElementById('weapon-class-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.updateWeaponDisplay());
        }
    }

    loadActiveTab(tabButtons, tabContents) {
        const savedTab = localStorage.getItem('pandora-active-tab');
        
        if (savedTab) {
            // Remove active class from all buttons and contents first
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Find and activate the saved tab
            const savedButton = document.querySelector(`[data-tab="${savedTab}"]`);
            const savedContent = document.getElementById(`tab-${savedTab}`);
            
            if (savedButton && savedContent) {
                savedButton.classList.add('active');
                savedContent.classList.add('active');
            } else {
                // Fallback to first tab if saved tab doesn't exist
                if (tabButtons.length > 0 && tabContents.length > 0) {
                    tabButtons[0].classList.add('active');
                    tabContents[0].classList.add('active');
                }
            }
        }
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                document.getElementById(`tab-${targetTab}`).classList.add('active');
                
                // Save current active tab to localStorage
                localStorage.setItem('pandora-active-tab', targetTab);
            });
        });
        
        // Load saved active tab on page load
        this.loadActiveTab(tabButtons, tabContents);
    }
}

// Initialize the application when page loads
let characterManager;
document.addEventListener('DOMContentLoaded', () => {
    characterManager = new CharacterManager();
});