/**
 * Character Manager Module
 * Core character logic, health management, and coordination between modules
 */

class CharacterManager {
    constructor() {
        // Core character state
        this.weapons = [];
        this.currentGeneratedWeapon = null;
        
        // Initialize modules
        this.debugManager = new DebugManager();
        this.weaponGenerator = new WeaponGenerator();
        this.storageManager = new StorageManager();
        this.uiManager = new UIManager(this.debugManager);
        this.qrSystem = new QRSystem(this.weaponGenerator, this.uiManager);
        
        // Initialize
        this.init();
    }

    async init() {
        try {
            // Load weapon data
            await this.weaponGenerator.loadData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup UI components
            this.uiManager.setupHelpTooltips();
            
            // Load saved data
            this.loadSavedCharacter();
            this.loadSavedWeapons();
            
            // Setup tab system
            this.setupTabSystem();
            
            // Enable auto-save
            this.storageManager.enableAutoSave(this);
            
            console.log('Character Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Character Manager:', error);
            this.uiManager.showMessage('Fejl ved initialisering. Prøv at genindlæse siden.');
        }
    }

    // Character data methods
    getCharacterData() {
        return {
            name: document.getElementById('character-name')?.value || '',
            level: parseInt(document.getElementById('character-level')?.value) || 1,
            currentHP: parseInt(document.getElementById('current-hp')?.value) || 100,
            maxHP: parseInt(document.getElementById('max-hp')?.value) || 100,
            currentShield: parseInt(document.getElementById('current-shield')?.value) || 0,
            maxShield: parseInt(document.getElementById('max-shield')?.value) || 50
        };
    }

    getWeapons() {
        return this.weapons;
    }

    // Health and shield management
    updateMaxHPForLevel() {
        const level = parseInt(document.getElementById('character-level').value) || 1;
        const maxHP = 100 + (level - 1) * 20;
        document.getElementById('max-hp').value = maxHP;
        
        // Update visual bar
        this.updateHealthBar();
        this.updateWeaponDisplay();
    }

    updateHealthBar() {
        const currentHP = parseInt(document.getElementById('current-hp').value) || 0;
        const maxHP = parseInt(document.getElementById('max-hp').value) || 100;
        this.uiManager.updateHealthBar(currentHP, maxHP);
    }

    updateShieldBar() {
        const currentShield = parseInt(document.getElementById('current-shield').value) || 0;
        const maxShield = parseInt(document.getElementById('max-shield').value) || 50;
        this.uiManager.updateShieldBar(currentShield, maxShield);
    }

    updateShieldUIState() {
        // Get equipped shield
        const equippedShield = this.weapons.find(w => w.equipped && w.weaponClass === 'Shield');
        
        const currentShieldInput = document.getElementById('current-shield');
        const maxShieldInput = document.getElementById('max-shield');
        
        if (equippedShield) {
            // Enable shield UI and set max shield points
            currentShieldInput.disabled = false;
            maxShieldInput.disabled = false;
            maxShieldInput.value = equippedShield.shieldPoints;
            
            // Ensure current shield doesn't exceed max
            const currentShield = parseInt(currentShieldInput.value) || 0;
            if (currentShield > equippedShield.shieldPoints) {
                currentShieldInput.value = equippedShield.shieldPoints;
            }
        } else {
            // Disable shield UI
            currentShieldInput.disabled = true;
            maxShieldInput.disabled = true;
            currentShieldInput.value = 0;
            maxShieldInput.value = 0;
        }
        
        this.updateShieldBar();
    }

    restoreShield() {
        const maxShield = parseInt(document.getElementById('max-shield').value) || 0;
        document.getElementById('current-shield').value = maxShield;
        this.updateShieldBar();
        this.uiManager.showMessage('Shield genoprettet! 🛡️');
    }

    takeDamage() {
        const damageInput = document.getElementById('damage-input');
        const damage = parseInt(damageInput.value) || 0;
        
        if (damage <= 0) {
            this.uiManager.showMessage('Skade skal være større end 0!');
            return;
        }

        let currentShield = parseInt(document.getElementById('current-shield').value) || 0;
        let currentHP = parseInt(document.getElementById('current-hp').value) || 0;
        let remainingDamage = damage;

        // Apply damage to shield first
        if (currentShield > 0 && remainingDamage > 0) {
            const shieldDamage = Math.min(currentShield, remainingDamage);
            currentShield -= shieldDamage;
            remainingDamage -= shieldDamage;
            document.getElementById('current-shield').value = currentShield;
            this.updateShieldBar();
        }

        // Apply remaining damage to HP
        if (remainingDamage > 0) {
            currentHP = Math.max(0, currentHP - remainingDamage);
            document.getElementById('current-hp').value = currentHP;
            this.updateHealthBar();
        }

        // Show damage message
        const shieldDamage = damage - remainingDamage;
        let message = `Tog ${damage} skade!`;
        if (shieldDamage > 0) {
            message = `Skjold absorberede ${shieldDamage}, tog ${remainingDamage} HP skade!`;
        }
        this.uiManager.showMessage(message);

        // Check for death
        if (currentHP === 0) {
            this.uiManager.playDeathAnimation();
            this.uiManager.showMessage('Du er død! 💀');
        }

        // Clear damage input
        damageInput.value = '';
    }

    // Weapon management
    generateWeapon() {
        try {
            const characterLevel = parseInt(document.getElementById('character-level').value) || 1;
            const weapon = this.weaponGenerator.generateWeapon(characterLevel);
            
            this.currentGeneratedWeapon = weapon;
            this.uiManager.displayNewWeapon(weapon);
        } catch (error) {
            console.error('Weapon generation error:', error);
            this.uiManager.showMessage('Fejl ved våben generering. Prøv igen.');
        }
    }

    addWeaponToInventory(weaponId) {
        // Check inventory slot limit
        const currentLevel = parseInt(document.getElementById('character-level').value) || 1;
        const maxSlots = this.calculateMaxSlotsForLevel(currentLevel);
        
        if (this.weapons.length >= maxSlots) {
            this.uiManager.showMessage(`Inventory fuldt! Level ${currentLevel} tillader ${maxSlots} våben. Level op for flere slots! 📦`);
            return;
        }

        // Find weapon in temporary storage
        const weaponData = this.currentGeneratedWeapon;
        if (weaponData && weaponData.id === weaponId) {
            this.weapons.push(weaponData);
            this.uiManager.showMessage(`${weaponData.name} tilføjet til inventory! ⚔️ (${this.weapons.length}/${maxSlots} slots)`);
            this.updateWeaponDisplay();
            this.updateSlotCounter();
            this.discardWeapon();
        }
    }

    discardWeapon() {
        document.getElementById('new-weapon-display').style.display = 'none';
        this.currentGeneratedWeapon = null;
        this.uiManager.showMessage('Våben afvist');
    }

    removeWeapon(weaponId) {
        this.weapons = this.weapons.filter(w => w.id !== weaponId);
        this.updateWeaponDisplay();
        this.updateSlotCounter();
        this.updateShieldUIState();
        this.uiManager.showMessage('Våben fjernet fra inventory');
    }

    equipWeapon(weaponId) {
        const weapon = this.weapons.find(w => w.id === weaponId);
        if (!weapon) return;
        
        // If it's a shield, unequip other shields only
        if (weapon.weaponClass === 'Shield') {
            this.weapons.forEach(w => {
                if (w.weaponClass === 'Shield' && w.id !== weaponId) {
                    w.equipped = false;
                }
            });
        } else {
            // For non-shields, unequip other non-shields
            this.weapons.forEach(w => {
                if (w.weaponClass !== 'Shield' && w.id !== weaponId) {
                    w.equipped = false;
                }
            });
        }
        
        weapon.equipped = true;
        this.updateWeaponDisplay();
        this.updateShieldUIState();
        this.uiManager.showMessage(`${weapon.name} equipped! ⚔️`);
    }

    unequipWeapon(weaponId) {
        const weapon = this.weapons.find(w => w.id === weaponId);
        if (weapon) {
            weapon.equipped = false;
            this.updateWeaponDisplay();
            this.updateShieldUIState();
            this.uiManager.showMessage(`${weapon.name} unequipped`);
        }
    }

    updateWeaponDisplay() {
        const filterSelect = document.getElementById('weapon-class-filter');
        const selectedClass = filterSelect ? filterSelect.value : 'all';
        this.uiManager.updateWeaponDisplay(this.weapons, selectedClass);
    }

    calculateMaxSlotsForLevel(level) {
        return 1 + Math.floor((level - 1) / 2);
    }

    updateSlotCounter() {
        const currentLevel = parseInt(document.getElementById('character-level').value) || 1;
        const maxSlots = this.calculateMaxSlotsForLevel(currentLevel);
        this.uiManager.updateSlotCounter(this.weapons.length, maxSlots);
    }

    // QR System delegation
    shareWeapon(weaponId) {
        const weapon = this.currentGeneratedWeapon;
        if (weapon && weapon.id === weaponId) {
            if (this.qrSystem.shareWeapon(weapon)) {
                this.currentGeneratedWeapon = null; // Weapon is now "gone"
            }
        }
    }

    finishSharing() {
        this.qrSystem.finishSharing();
    }

    // Dice rolling
    rollDice() {
        const result = Math.floor(Math.random() * 20) + 1;
        this.uiManager.displayDiceResult(result);
    }

    // Storage operations
    saveCharacter() {
        const character = this.getCharacterData();
        if (this.storageManager.saveCharacter(character) && this.storageManager.saveWeapons(this.weapons)) {
            this.uiManager.showMessage('Karakter gemt! 💾');
        } else {
            this.uiManager.showMessage('Fejl ved gemning');
        }
    }

    loadSavedCharacter() {
        const character = this.storageManager.loadCharacter();
        if (character) {
            // Restore character data
            if (character.name) document.getElementById('character-name').value = character.name;
            if (character.level) document.getElementById('character-level').value = character.level;
            if (character.currentHP !== undefined) document.getElementById('current-hp').value = character.currentHP;
            if (character.maxHP !== undefined) document.getElementById('max-hp').value = character.maxHP;
            if (character.currentShield !== undefined) document.getElementById('current-shield').value = character.currentShield;
            if (character.maxShield !== undefined) document.getElementById('max-shield').value = character.maxShield;
            
            this.updateHealthBar();
            this.updateShieldBar();
            this.updateMaxHPForLevel();
            
            this.uiManager.showMessage('Karakter indlæst! 📁');
        }
    }

    loadSavedWeapons() {
        this.weapons = this.storageManager.loadWeapons();
        this.updateWeaponDisplay();
        this.updateSlotCounter();
        this.updateShieldUIState();
    }

    // Utility methods
    showMessage(message) {
        this.uiManager.showMessage(message);
    }

    // Event listeners setup
    setupEventListeners() {
        // Character management
        document.getElementById('save-character')?.addEventListener('click', () => this.saveCharacter());
        document.getElementById('load-character')?.addEventListener('click', () => this.loadSavedCharacter());
        document.getElementById('restore-shield')?.addEventListener('click', () => this.restoreShield());
        document.getElementById('take-damage')?.addEventListener('click', () => this.takeDamage());
        
        // Health bar updates
        document.getElementById('current-hp')?.addEventListener('input', () => this.updateHealthBar());
        document.getElementById('max-hp')?.addEventListener('input', () => this.updateHealthBar());
        document.getElementById('current-shield')?.addEventListener('input', () => this.updateShieldBar());
        document.getElementById('max-shield')?.addEventListener('input', () => this.updateShieldBar());
        
        // Level changes
        document.getElementById('character-level')?.addEventListener('change', () => {
            this.updateMaxHPForLevel();
            this.updateWeaponDisplay();
        });
        
        // Weapon generation
        document.getElementById('generate-weapon')?.addEventListener('click', () => this.generateWeapon());
        
        // Dice rolling
        document.getElementById('roll-dice')?.addEventListener('click', () => this.rollDice());
        
        // QR Scanner
        document.getElementById('receive-weapon')?.addEventListener('click', () => this.qrSystem.startQRScanner());
        document.getElementById('stop-scanner')?.addEventListener('click', () => this.qrSystem.stopQRScanner());
        
        // Weapon class filter
        const filterSelect = document.getElementById('weapon-class-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.updateWeaponDisplay());
        }
    }

    setupTabSystem() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                // Update active states
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Activate selected tab
                e.target.classList.add('active');
                document.getElementById(`tab-${targetTab}`)?.classList.add('active');
                
                // Save active tab
                this.storageManager.saveActiveTab(targetTab);
            });
        });
        
        this.loadActiveTab(tabButtons, tabContents);
    }

    loadActiveTab(tabButtons, tabContents) {
        const activeTab = this.storageManager.loadActiveTab();
        
        // Remove all active states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Set active tab
        const activeButton = document.querySelector(`[data-tab="${activeTab}"]`);
        const activeContent = document.getElementById(`tab-${activeTab}`);
        
        if (activeButton && activeContent) {
            activeButton.classList.add('active');
            activeContent.classList.add('active');
        } else {
            // Fallback to first tab
            tabButtons[0]?.classList.add('active');
            tabContents[0]?.classList.add('active');
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterManager;
} else {
    window.CharacterManager = CharacterManager;
}