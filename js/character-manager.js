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
            
            // Setup character selector
            this.setupCharacterSelector();
            
            // Load saved data
            this.loadSavedCharacter();
            this.loadSavedWeapons();
            
            // Setup tab system
            this.setupTabSystem();
            
                    // Enable storage auto-save (30 second intervals)
            this.storageManager.enableAutoSave(this);
            
            // Enable immediate auto-save on changes
            this.enableAutoSave();
            
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
        this.autoSaveCharacter(); // Trigger auto-save
        this.uiManager.showMessage('Shield genoprettet! 🛡️');
    }

    restoreHP() {
        const maxHP = parseInt(document.getElementById('max-hp').value) || 100;
        document.getElementById('current-hp').value = maxHP;
        this.updateHealthBar();
        this.autoSaveCharacter(); // Trigger auto-save
        this.uiManager.showMessage('HP genoprettet! ❤️');
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

        // Trigger auto-save since we changed HP/Shield programmatically
        this.autoSaveCharacter();

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
            this.autoSaveWeapons(); // Auto-save weapons
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
        this.autoSaveWeapons(); // Auto-save weapons
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
        this.autoSaveWeapons(); // Auto-save weapons
        this.uiManager.showMessage(`${weapon.name} equipped! ⚔️`);
    }

    unequipWeapon(weaponId) {
        const weapon = this.weapons.find(w => w.id === weaponId);
        if (weapon) {
            weapon.equipped = false;
            this.updateWeaponDisplay();
            this.updateShieldUIState();
            this.autoSaveWeapons(); // Auto-save weapons
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

    // Storage operations (manual load only - auto-save handles saving)

    loadSavedCharacter() {
        // Try to load the active character
        const activeCharacterName = this.storageManager.getActiveCharacter();
        if (activeCharacterName) {
            // Set the dropdown to the active character
            const characterSelect = document.getElementById('character-select');
            if (characterSelect) {
                characterSelect.value = activeCharacterName;
            }
            
            // Load the character data
            this.loadCharacterByName(activeCharacterName);
        } else {
            // Fallback to old system for migration
            const character = this.storageManager.loadCharacter();
            if (character && character.name) {
                // Migrate old character to new system
                const weapons = this.storageManager.loadWeapons();
                this.storageManager.saveCharacterByName(character.name, character, weapons);
                this.populateCharacterDropdown();
                this.loadCharacterByName(character.name);
            }
        }
    }

    loadSavedWeapons() {
        // Weapons are now loaded as part of character data
        // This method is kept for compatibility but may not be needed
        this.updateWeaponDisplay();
        this.updateSlotCounter();
        this.updateShieldUIState();
    }

    // Utility methods
    showMessage(message) {
        this.uiManager.showMessage(message);
    }

    // Auto-save functionality
    enableAutoSave() {
        // Auto-save character data on HP/Shield changes
        const hpInput = document.getElementById('current-hp');
        const shieldInput = document.getElementById('current-shield');
        const levelInput = document.getElementById('character-level');
        const nameInput = document.getElementById('character-name');

        if (hpInput) {
            hpInput.addEventListener('input', () => this.autoSaveCharacter());
        }
        if (shieldInput) {
            shieldInput.addEventListener('input', () => this.autoSaveCharacter());
        }
        if (levelInput) {
            levelInput.addEventListener('change', () => this.autoSaveCharacter());
        }
        if (nameInput) {
            nameInput.addEventListener('input', () => this.autoSaveCharacter());
        }

        this.debugManager.log('Auto-save enabled for character data', 'info');
    }

    autoSaveCharacter() {
        // Debounce auto-save to avoid too frequent saves
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.autoSaveTimeout = setTimeout(() => {
            const character = this.getCharacterData();
            if (this.storageManager.saveCharacter(character)) {
                this.debugManager.log('Character auto-saved', 'success');
            }
        }, 1000); // Save 1 second after last change
    }

    autoSaveWeapons() {
        // Immediate save for weapon changes (equip/unequip/inventory changes)
        if (this.storageManager.saveWeapons(this.weapons)) {
            this.debugManager.log('Weapons auto-saved', 'success');
        }
    }

    // Event listeners setup
    setupEventListeners() {
        // Character management - load character is now handled by dropdown
        document.getElementById('restore-shield')?.addEventListener('click', () => this.restoreShield());
        document.getElementById('restore-hp')?.addEventListener('click', () => this.restoreHP());
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

    // Character selector functionality
    setupCharacterSelector() {
        this.populateCharacterDropdown();
        
        // Character selection event
        const characterSelect = document.getElementById('character-select');
        if (characterSelect) {
            characterSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadCharacterByName(e.target.value);
                }
            });
        }
        
        // New character button event
        const newCharacterBtn = document.getElementById('new-character');
        if (newCharacterBtn) {
            newCharacterBtn.addEventListener('click', () => {
                this.createNewCharacter();
            });
        }
    }

    populateCharacterDropdown() {
        const characterSelect = document.getElementById('character-select');
        if (!characterSelect) return;
        
        // Clear existing options except the first one
        characterSelect.innerHTML = '<option value="">Vælg karakter...</option>';
        
        // Get all saved characters
        const characterList = this.storageManager.getCharacterList();
        const activeCharacter = this.storageManager.getActiveCharacter();
        
        // Add each character as an option
        characterList.forEach(characterName => {
            const option = document.createElement('option');
            option.value = characterName;
            option.textContent = characterName;
            if (characterName === activeCharacter) {
                option.selected = true;
            }
            characterSelect.appendChild(option);
        });
    }

    createNewCharacter() {
        const characterName = prompt('Indtast karakterens navn:');
        if (characterName && characterName.trim()) {
            const sanitizedName = characterName.trim();
            
            // Check if character already exists
            const existingCharacters = this.storageManager.getCharacterList();
            if (existingCharacters.includes(sanitizedName)) {
                this.uiManager.showMessage('En karakter med det navn eksisterer allerede!');
                return;
            }
            
            // Create new character with default values
            const defaultCharacter = {
                name: sanitizedName,
                level: 1,
                currentHP: 100,
                maxHP: 100,  
                currentShield: 0,
                maxShield: 0
            };
            
            // Save new character
            if (this.storageManager.saveCharacterByName(sanitizedName, defaultCharacter, [])) {
                this.populateCharacterDropdown();
                this.loadCharacterByName(sanitizedName);
                this.uiManager.showMessage(`Ny karakter "${sanitizedName}" oprettet! 🎭`);
            } else {
                this.uiManager.showMessage('Fejl ved oprettelse af karakter');
            }
        }
    }

    loadCharacterByName(characterName) {
        const characterData = this.storageManager.loadCharacterByName(characterName);
        if (characterData) {
            // Update UI with character data
            document.getElementById('character-level').value = characterData.level;
            document.getElementById('current-hp').value = characterData.currentHP;
            document.getElementById('max-hp').value = characterData.maxHP;
            document.getElementById('current-shield').value = characterData.currentShield;
            document.getElementById('max-shield').value = characterData.maxShield;
            
            // Load weapons
            this.weapons = characterData.weapons || [];
            
            // Update UI
            this.updateHealthBar();
            this.updateShieldBar();
            this.updateMaxHPForLevel();
            this.updateWeaponDisplay();
            this.updateSlotCounter();
            this.updateShieldUIState();
            
            // Set as active character
            this.storageManager.setActiveCharacter(characterName);
            
            this.uiManager.showMessage(`Karakter "${characterName}" indlæst! 🎭`);
        } else {
            this.uiManager.showMessage('Kunne ikke indlæse karakter');
        }
    }

    getCurrentCharacterName() {
        const characterSelect = document.getElementById('character-select');
        return characterSelect?.value || '';
    }

    // Override auto-save methods to use character names
    autoSaveCharacter() {
        const characterName = this.getCurrentCharacterName();
        if (!characterName) return;
        
        // Debounce auto-save to avoid too frequent saves
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.autoSaveTimeout = setTimeout(() => {
            const character = this.getCharacterData();
            if (this.storageManager.saveCharacterByName(characterName, character, this.weapons)) {
                this.debugManager.log(`Character "${characterName}" auto-saved`, 'success');
            }
        }, 1000); // Save 1 second after last change
    }

    autoSaveWeapons() {
        const characterName = this.getCurrentCharacterName();
        if (!characterName) return;
        
        // Immediate save for weapon changes
        const character = this.getCharacterData();
        if (this.storageManager.saveCharacterByName(characterName, character, this.weapons)) {
            this.debugManager.log(`Weapons for "${characterName}" auto-saved`, 'success');
        }
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