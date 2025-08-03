// Pandora RPG Character Manager
class CharacterManager {
    constructor() {
        this.character = this.loadCharacter();
        this.weapons = [];
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
            maxHp: 100
        };
        
        if (saved) {
            const character = JSON.parse(saved);
            // Ensure max HP matches level when loading
            character.maxHp = this.calculateMaxHPForLevel(character.level);
            // Ensure current HP doesn't exceed new max HP
            character.currentHp = Math.min(character.currentHp, character.maxHp);
            return character;
        }
        
        return defaultChar;
    }

    calculateMaxHPForLevel(level) {
        // Base HP: 100, +20 HP per level
        return 100 + (level - 1) * 20;
    }

    saveCharacter() {
        const character = {
            name: document.getElementById('character-name').value,
            level: parseInt(document.getElementById('character-level').value),
            currentHp: parseInt(document.getElementById('current-hp').value),
            maxHp: parseInt(document.getElementById('max-hp').value)
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
        this.updateHealthBar();
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
        
        if (hpIncrease > 0) {
            this.showMessage(`Level ${level}: +${hpIncrease} HP! Nu ${newCurrentHP}/${newMaxHP} HP 💪`);
        } else if (hpIncrease < 0) {
            this.showMessage(`Level ${level}: ${hpIncrease} HP. Nu ${newCurrentHP}/${newMaxHP} HP`);
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

    // Weapon generation
    generateWeapon() {
        const characterLevel = parseInt(document.getElementById('character-level').value) || 1;
        
        const weaponTypes = ['Laser Pistol', 'Plasma Rifle', 'Ion Cannon', 'Quantum Blaster', 'Photon Sword'];
        const rarities = [
            { name: 'Almindelig', color: '#6c757d', statBonus: 1 },
            { name: 'Ualmindelig', color: '#28a745', statBonus: 1.2 },
            { name: 'Sjælden', color: '#007bff', statBonus: 1.5 },
            { name: 'Episk', color: '#6f42c1', statBonus: 2 },
            { name: 'Legendarisk', color: '#fd7e14', statBonus: 3 }
        ];

        const randomWeapon = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
        
        // Generate weapon level 1-3 levels around character level
        const minLevel = Math.max(1, characterLevel - 1);
        const maxLevel = characterLevel + 3;
        const weaponLevel = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
        
        const randomRarity = this.getRandomRarityByLevel(rarities, weaponLevel);
        
        // Level-scaled base stats based on weapon level
        const levelMultiplier = 1 + (weaponLevel - 1) * 0.15; // 15% increase per level
        const baseStats = {
            damage: Math.floor((Math.random() * 30 + 15) * levelMultiplier),
            accuracy: Math.floor(Math.random() * 20 + 75),
            range: Math.floor((Math.random() * 30 + 25) * levelMultiplier)
        };

        const weapon = {
            id: Date.now(),
            name: `${randomRarity.name} ${randomWeapon}`,
            type: randomWeapon,
            rarity: randomRarity,
            level: weaponLevel,
            damage: Math.floor(baseStats.damage * randomRarity.statBonus),
            accuracy: Math.min(100, Math.floor(baseStats.accuracy * randomRarity.statBonus)),
            range: Math.floor(baseStats.range * randomRarity.statBonus),
            image: this.generateWeaponImage(randomWeapon)
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
        // Simple emoji-based weapon images for now
        const weaponEmojis = {
            'Laser Pistol': '🔫',
            'Plasma Rifle': '🔫',
            'Ion Cannon': '💥',
            'Quantum Blaster': '⚡',
            'Photon Sword': '⚔️'
        };
        return weaponEmojis[weaponType] || '⚔️';
    }

    displayNewWeapon(weapon) {
        const display = document.getElementById('new-weapon-display');
        display.innerHTML = `
            <h3>Nyt Våben Genereret!</h3>
            <div class="weapon-card">
                <div class="weapon-image">${weapon.image}</div>
                <div class="weapon-name" style="color: ${weapon.rarity.color}">${weapon.name}</div>
                <div class="weapon-stats">
                    <div>⭐ Level: ${weapon.level}</div>
                    <div>💥 Skade: ${weapon.damage}</div>
                    <div>🎯 Præcision: ${weapon.accuracy}%</div>
                    <div>📏 Rækkevidde: ${weapon.range}m</div>
                </div>
                <button onclick="characterManager.addWeaponToInventory(${weapon.id})" class="action-btn">
                    Tilføj til Inventory
                </button>
                <button onclick="characterManager.discardWeapon()" class="action-btn" style="background: #dc3545;">
                    Afvis Våben
                </button>
            </div>
        `;
        display.style.display = 'block';
    }

    addWeaponToInventory(weaponId) {
        // Find weapon in temporary storage or create from current display
        const weaponDisplay = document.getElementById('new-weapon-display');
        if (weaponDisplay.style.display !== 'none') {
            // Get weapon data from the current preview
            const weaponData = this.currentGeneratedWeapon;
            if (weaponData && weaponData.id === weaponId) {
                this.weapons.push(weaponData);
                this.showMessage(`${weaponData.name} tilføjet til inventory! ⚔️`);
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
        
        if (this.weapons.length === 0) {
            weaponList.innerHTML = '<p class="empty-state">Ingen våben endnu. Generer noget loot!</p>';
            return;
        }

        weaponList.innerHTML = this.weapons.map(weapon => {
            const currentLevel = parseInt(document.getElementById('character-level').value) || 1;
            const canUse = weapon.level <= currentLevel;
            
            return `
            <div class="weapon-card ${canUse ? '' : 'weapon-too-high-level'}">
                <div class="weapon-image">${weapon.image}</div>
                <div class="weapon-name" style="color: ${weapon.rarity.color}">${weapon.name}</div>
                <div class="weapon-stats">
                    <div>⭐ Level: ${weapon.level} ${canUse ? '' : '(For høj level!)'}</div>
                    <div>💥 Skade: ${weapon.damage}</div>
                    <div>🎯 Præcision: ${weapon.accuracy}%</div>
                    <div>📏 Rækkevidde: ${weapon.range}m</div>
                </div>
                <button onclick="characterManager.removeWeapon(${weapon.id})" class="action-btn" style="background: #dc3545;">
                    Fjern
                </button>
            </div>
        `;
        }).join('');
    }

    removeWeapon(weaponId) {
        this.weapons = this.weapons.filter(w => w.id !== weaponId);
        this.updateWeaponDisplay();
        this.showMessage('Våben fjernet fra inventory');
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
        
        // Health bar updates
        document.getElementById('current-hp').addEventListener('input', () => this.updateHealthBar());
        document.getElementById('max-hp').addEventListener('input', () => this.updateHealthBar());
        
        // Level updates
        document.getElementById('character-level').addEventListener('input', () => {
            this.updateMaxHPForLevel();
            this.updateWeaponDisplay();
        });
        
        // Weapon generation
        document.getElementById('generate-weapon').addEventListener('click', () => this.generateWeapon());
        
        // Dice rolling
        document.getElementById('roll-dice').addEventListener('click', () => this.rollDice());
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
            });
        });
    }
}

// Initialize the application when page loads
let characterManager;
document.addEventListener('DOMContentLoaded', () => {
    characterManager = new CharacterManager();
});