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
        this.avatarGenerator = new AvatarGenerator();
        
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
            
            // Setup avatar system
            this.setupAvatarSystem();
            
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
            maxShield: parseInt(document.getElementById('max-shield')?.value) || 50,
            avatar: this.currentAvatar,
            currentKills: this.currentKills || 0
        };
    }

    getWeapons() {
        return this.weapons;
    }

    // Health and shield management
    updateMaxHPForLevel() {
        const level = parseInt(document.getElementById('character-level').value) || 1;
        const maxHP = 100 + (level - 1) * 20;
        const currentHP = parseInt(document.getElementById('current-hp').value) || 0;
        
        document.getElementById('max-hp').value = maxHP;
        
        // Lower current HP if it exceeds new max HP
        if (currentHP > maxHP) {
            document.getElementById('current-hp').value = maxHP;
            this.autoSaveCharacter(); // Save HP change
            this.uiManager.showMessage(`HP lowered to ${maxHP} due to level change ❤️`);
        }
        
        // Unequip weapons that are too high level
        this.unequipHighLevelWeapons(level);
        
        // Update visual bar
        this.updateHealthBar();
        this.updateWeaponDisplay();
    }

    unequipHighLevelWeapons(characterLevel) {
        let unequippedWeapons = [];
        
        this.weapons.forEach(weapon => {
            if (weapon.equipped && weapon.level > characterLevel) {
                weapon.equipped = false;
                unequippedWeapons.push(weapon.name);
                
                // If it's a shield, set current shield to 0
                if (weapon.weaponClass === 'Shield') {
                    document.getElementById('current-shield').value = 0;
                    this.updateShieldBar();
                }
            }
        });
        
        if (unequippedWeapons.length > 0) {
            this.uiManager.showMessage(`Unequipped ${unequippedWeapons.length} high-level weapon(s): ${unequippedWeapons.join(', ')} ⚔️`);
            this.updateShieldUIState();
            this.autoSaveWeapons();
        }
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
            // Weapon generated - no XP bonus
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
            
            // Add XP for receiving weapon (more if it was from QR code)
            const xpAmount = weaponData.isShared ? 5 : 10;
            const xpReason = weaponData.isShared ? 'Våben modtaget' : 'Våben tilføjet';
            // Weapon added to inventory - no XP bonus
            
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
        
        // If equipping a shield, restore shield to full
        if (weapon.weaponClass === 'Shield') {
            document.getElementById('current-shield').value = weapon.shieldPoints;
            this.updateShieldBar();
            this.autoSaveCharacter(); // Save shield change
            this.uiManager.showMessage(`${weapon.name} equipped! Shield restored to ${weapon.shieldPoints} 🛡️`);
        } else {
            this.uiManager.showMessage(`${weapon.name} equipped! ⚔️`);
        }
        
        this.updateWeaponDisplay();
        this.updateShieldUIState();
        this.autoSaveWeapons(); // Auto-save weapons
    }

    unequipWeapon(weaponId) {
        const weapon = this.weapons.find(w => w.id === weaponId);
        if (weapon) {
            weapon.equipped = false;
            
            // If unequipping a shield, set current shield to 0
            if (weapon.weaponClass === 'Shield') {
                document.getElementById('current-shield').value = 0;
                this.updateShieldBar();
                this.autoSaveCharacter(); // Save shield change
                this.uiManager.showMessage(`${weapon.name} unequipped! Shield lost 🛡️`);
            } else {
                this.uiManager.showMessage(`${weapon.name} unequipped`);
            }
            
            this.updateWeaponDisplay();
            this.updateShieldUIState();
            this.autoSaveWeapons(); // Auto-save weapons
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

    shareWeaponFromInventory(weaponId) {
        const weapon = this.weapons.find(w => w.id === weaponId);
        if (!weapon) {
            this.uiManager.showMessage('Fejl: Våben ikke fundet i inventory');
            return;
        }

        // Check if weapon can be shared (not already shared)
        if (weapon.isShared) {
            this.uiManager.showMessage('Dette våben kan ikke deles igen');
            return;
        }

        // Share the weapon using QR system, show QR in inventory
        if (this.qrSystem.shareWeapon(weapon, weaponId)) {
            // Remove weapon from inventory after successful sharing
            this.weapons = this.weapons.filter(w => w.id !== weaponId);
            this.autoSaveWeapons();
            // Weapon shared - no XP bonus
        }
    }

    finishSharing() {
        this.qrSystem.finishSharing();
    }

    finishSharingInventory() {
        // Refresh inventory display after sharing
        this.updateWeaponDisplay();
        this.updateSlotCounter();
        this.updateShieldUIState();
        this.uiManager.showMessage('Våben deling afsluttet');
    }

    // Experience Point System
    getRequiredXPForLevel(level) {
        if (level <= 5) return level * 100;
        if (level <= 10) return 500 + (level - 5) * 150;
        if (level <= 15) return 1250 + (level - 10) * 200;
        if (level <= 20) return 2250 + (level - 15) * 250;
        return 3500; // Max level
    }

    addKill() {
        this.currentKills = (this.currentKills || 0) + 1;
        this.updateKillDisplay();
        
        this.uiManager.showMessage(`Fjende dræbt! Total kills: ${this.currentKills} ⚔️`);

        // Check for level up
        this.checkLevelUpFromKills();
        this.autoSaveCharacter();
    }

    removeKill() {
        if (this.currentKills > 0) {
            this.currentKills = this.currentKills - 1;
            this.updateKillDisplay();
            this.uiManager.showMessage(`Kill fjernet. Total kills: ${this.currentKills} ⚔️`);
            this.autoSaveCharacter();
        } else {
            this.uiManager.showMessage('Kan ikke fjerne flere kills - allerede på 0');
        }
    }

    updateKillsFromInput() {
        const killInput = document.getElementById('current-kills-input');
        const newKills = Math.max(0, parseInt(killInput.value) || 0);
        
        if (newKills !== this.currentKills) {
            this.currentKills = newKills;
            this.updateKillDisplay();
            this.checkLevelUpFromKills();
            this.autoSaveCharacter();
        }
    }

    checkLevelUpFromKills() {
        const currentLevel = parseInt(document.getElementById('character-level').value) || 1;
        const requiredKills = this.getRequiredKillsForLevel(currentLevel + 1);
        
        if (this.currentKills >= requiredKills && currentLevel < 20) {
            // Level up!
            const newLevel = currentLevel + 1;
            document.getElementById('character-level').value = newLevel;
            
            // Reset kill counter to 0 for next level
            this.currentKills = 0;
            
            // Update max HP
            this.updateMaxHPForLevel();
            
            // Level up animation and message
            const levelInput = document.getElementById('character-level');
            levelInput.classList.add('level-up-animation');
            setTimeout(() => levelInput.classList.remove('level-up-animation'), 1000);
            
            this.uiManager.showMessage(`🎉 Level Up! Nu level ${newLevel}! +20 HP! Kill counter reset! 🎉`);
            
            // Update displays
            this.updateSlotCounter();
            this.updateKillDisplay();
            this.updateShieldUIState();
        }
    }

    getRequiredKillsForLevel(level) {
        // Level 2 requires 2 kills, level 3 requires 3 kills, etc.
        return level;
    }

    adjustKillsForLevel() {
        const currentLevel = parseInt(document.getElementById('character-level').value) || 1;
        const maxKillsForLevel = currentLevel === 1 ? 0 : (currentLevel - 1);
        
        // If kills exceed what's possible for current level, cap them
        if (this.currentKills > maxKillsForLevel) {
            this.currentKills = maxKillsForLevel;
            this.uiManager.showMessage(`Kill count adjusted to ${maxKillsForLevel} for level ${currentLevel} ⚔️`);
            this.updateKillDisplay();
            this.autoSaveCharacter();
        }
    }

    updateKillDisplay() {
        const currentLevel = parseInt(document.getElementById('character-level').value) || 1;
        const currentKills = this.currentKills || 0;
        
        // Update kill input field
        const killInput = document.getElementById('current-kills-input');
        if (killInput && parseInt(killInput.value) !== currentKills) {
            killInput.value = currentKills;
        }
        
        // Update kill counter display if it still exists
        const killCounter = document.getElementById('kill-count');
        if (killCounter) {
            killCounter.textContent = currentKills;
        }
        
        if (currentLevel >= 20) {
            // Max level reached
            document.getElementById('current-kills').textContent = currentKills;
            document.getElementById('required-kills').textContent = 'MAX';
            document.getElementById('kill-progress').style.width = '100%';
        } else {
            // Show progress to next level
            const nextLevel = currentLevel + 1;
            const requiredKills = this.getRequiredKillsForLevel(nextLevel);
            
            // Update progress text
            document.getElementById('current-kills').textContent = currentKills;
            document.getElementById('required-kills').textContent = requiredKills;
            
            // Update progress bar
            const progressPercent = Math.min(100, (currentKills / requiredKills) * 100);
            document.getElementById('kill-progress').style.width = `${progressPercent}%`;
        }
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
            } else {
                // No existing character - create default avatar
                this.currentAvatar = this.avatarGenerator.generateRandomAvatar();
                this.updateAvatarDisplay(this.currentAvatar);
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
        document.getElementById('kill-plus')?.addEventListener('click', () => this.addKill());
        document.getElementById('kill-minus')?.addEventListener('click', () => this.removeKill());
        
        // Health bar updates
        document.getElementById('current-hp')?.addEventListener('input', () => this.updateHealthBar());
        document.getElementById('max-hp')?.addEventListener('input', () => this.updateHealthBar());
        document.getElementById('current-shield')?.addEventListener('input', () => this.updateShieldBar());
        document.getElementById('max-shield')?.addEventListener('input', () => this.updateShieldBar());
        document.getElementById('current-kills-input')?.addEventListener('input', () => this.updateKillsFromInput());
        
        // Level changes
        document.getElementById('character-level')?.addEventListener('change', () => {
            this.updateMaxHPForLevel();
            this.updateWeaponDisplay();
            this.adjustKillsForLevel();
            this.autoSaveCharacter(); // Save level change
        });
        
        // Weapon generation
        document.getElementById('generate-weapon')?.addEventListener('click', () => {
            // Stop QR scanner if running
            if (this.qrSystem.currentScanner) {
                this.qrSystem.stopQRScanner();
            }
            this.generateWeapon();
        });
        
        // Dice rolling
        document.getElementById('roll-dice')?.addEventListener('click', () => {
            // Stop QR scanner if running
            if (this.qrSystem.currentScanner) {
                this.qrSystem.stopQRScanner();
            }
            this.rollDice();
        });
        
        // QR Scanner
        document.getElementById('receive-weapon')?.addEventListener('click', () => this.qrSystem.startQRScanner());
        document.getElementById('stop-scanner')?.addEventListener('click', () => this.qrSystem.stopQRScanner());
        
        // Weapon class filter
        const filterSelect = document.getElementById('weapon-class-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.updateWeaponDisplay());
        }
        
        // Cleanup QR scanner when page is closed/refreshed
        window.addEventListener('beforeunload', () => {
            if (this.qrSystem.currentScanner) {
                this.qrSystem.stopQRScanner();
            }
        });
    }

    setupTabSystem() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                // Stop QR scanner if switching away from loot tab
                if (this.qrSystem.currentScanner) {
                    this.qrSystem.stopQRScanner();
                }
                
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

    // Avatar system functionality
    setupAvatarSystem() {
        // Initialize avatar if not already set
        if (!this.currentAvatar) {
            this.currentAvatar = this.avatarGenerator.generateRandomAvatar();
        }
        
        // Setup avatar display
        this.updateAvatarDisplay();
        
        // Setup customize button event
        const customizeBtn = document.getElementById('customize-avatar');
        if (customizeBtn) {
            customizeBtn.addEventListener('click', () => {
                this.openAvatarCustomizer();
            });
        }
    }

    updateAvatarDisplay(avatarData = null) {
        const container = document.getElementById('character-avatar-display');
        if (!container) return;
        
        const avatar = avatarData || this.currentAvatar || this.avatarGenerator.generateRandomAvatar();
        container.innerHTML = this.avatarGenerator.createAvatarHTML(avatar);
        
        // Save current avatar
        if (!this.currentAvatar) {
            this.currentAvatar = avatar;
        }
    }

    openAvatarCustomizer() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'avatar-modal';
        modal.innerHTML = this.avatarGenerator.createAvatarCustomizer(this.currentAvatar);
        
        document.body.appendChild(modal);
        
        // Setup customizer event listeners
        this.setupCustomizerEvents(modal);
    }

    setupCustomizerEvents(modal) {
        let tempAvatar = { ...this.currentAvatar };
        
        // Option button events
        modal.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const value = e.target.dataset.value;
                
                // Update temp avatar
                tempAvatar[type] = value;
                
                // Update preview
                const preview = modal.querySelector('#avatar-preview');
                if (preview) {
                    preview.innerHTML = this.avatarGenerator.createAvatarHTML(tempAvatar);
                }
                
                // Update active states
                modal.querySelectorAll(`[data-type="${type}"]`).forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Randomize button
        const randomizeBtn = modal.querySelector('#randomize-avatar');
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => {
                tempAvatar = this.avatarGenerator.generateRandomAvatar();
                
                // Update preview
                const preview = modal.querySelector('#avatar-preview');
                if (preview) {
                    preview.innerHTML = this.avatarGenerator.createAvatarHTML(tempAvatar);
                }
                
                // Update active states
                this.updateCustomizerActiveStates(modal, tempAvatar);
            });
        }
        
        // Save button
        const saveBtn = modal.querySelector('#save-avatar');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.currentAvatar = tempAvatar;
                this.updateAvatarDisplay(this.currentAvatar);
                this.autoSaveCharacter(); // Trigger auto-save
                this.uiManager.showMessage('Avatar gemt! 🎭');
                document.body.removeChild(modal);
            });
        }
        
        // Cancel button
        const cancelBtn = modal.querySelector('#cancel-avatar');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    updateCustomizerActiveStates(modal, avatar) {
        // Update all active states based on current avatar
        Object.keys(avatar).forEach(type => {
            modal.querySelectorAll(`[data-type="${type}"]`).forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.value === avatar[type]) {
                    btn.classList.add('active');
                }
            });
        });
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
        
        // Delete character button event
        const deleteCharacterBtn = document.getElementById('delete-character');
        if (deleteCharacterBtn) {
            deleteCharacterBtn.addEventListener('click', () => {
                this.deleteCurrentCharacter();
            });
        }
        
        // Update delete button state when selection changes
        if (characterSelect) {
            characterSelect.addEventListener('change', () => {
                this.updateDeleteButtonState();
            });
        }
        
        // Initial state
        this.updateDeleteButtonState();
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
        
        // Update delete button state
        this.updateDeleteButtonState();
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
                maxShield: 0,
                avatar: this.avatarGenerator.generateRandomAvatar()
            };
            
            // Save new character
            if (this.storageManager.saveCharacterByName(sanitizedName, defaultCharacter, [])) {
                this.populateCharacterDropdown();
                
                // Set the new avatar as current before loading
                this.currentAvatar = defaultCharacter.avatar;
                
                this.loadCharacterByName(sanitizedName);
                this.uiManager.showMessage(`Ny karakter "${sanitizedName}" oprettet! 🎭`);
            } else {
                this.uiManager.showMessage('Fejl ved oprettelse af karakter');
            }
        }
    }

    deleteCurrentCharacter() {
        const characterSelect = document.getElementById('character-select');
        const currentCharacterName = characterSelect?.value;
        
        if (!currentCharacterName) {
            this.uiManager.showMessage('Ingen karakter valgt til sletning!');
            return;
        }
        
        const characterList = this.storageManager.getCharacterList();
        
        // Prevent deleting the last character
        if (characterList.length <= 1) {
            this.uiManager.showMessage('Du kan ikke slette den sidste karakter!');
            return;
        }
        
        // Confirmation dialog
        const confirmMessage = `Er du sikker på at du vil slette karakteren "${currentCharacterName}"?\n\nDette kan ikke fortrydes!`;
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Delete the character
        if (this.storageManager.deleteCharacter(currentCharacterName)) {
            this.uiManager.showMessage(`Karakter "${currentCharacterName}" slettet! 🗑️`);
            
            // Update dropdown
            this.populateCharacterDropdown();
            
            // Load first available character
            const remainingCharacters = this.storageManager.getCharacterList();
            if (remainingCharacters.length > 0) {
                const nextCharacter = remainingCharacters[0];
                characterSelect.value = nextCharacter;
                this.loadCharacterByName(nextCharacter);
            } else {
                // Clear UI if no characters left (shouldn't happen due to prevention above)
                this.clearCharacterUI();
            }
            
            this.updateDeleteButtonState();
        } else {
            this.uiManager.showMessage('Fejl ved sletning af karakter');
        }
    }

    updateDeleteButtonState() {
        const deleteBtn = document.getElementById('delete-character');
        const characterSelect = document.getElementById('character-select');
        
        if (!deleteBtn) return;
        
        const hasSelectedCharacter = characterSelect?.value;
        const characterList = this.storageManager.getCharacterList();
        const isLastCharacter = characterList.length <= 1;
        
        // Disable if no character selected or if it's the last character
        const shouldDisable = !hasSelectedCharacter || isLastCharacter;
        
        deleteBtn.disabled = shouldDisable;
        deleteBtn.title = shouldDisable 
            ? (isLastCharacter ? 'Kan ikke slette sidste karakter' : 'Vælg karakter først')
            : 'Slet valgte karakter';
    }

    clearCharacterUI() {
        // Reset to default values
        document.getElementById('character-level').value = 1;
        document.getElementById('current-hp').value = 100;
        document.getElementById('max-hp').value = 100;
        document.getElementById('current-shield').value = 0;
        document.getElementById('max-shield').value = 0;
        
        // Clear weapons and avatar
        this.weapons = [];
        this.currentAvatar = this.avatarGenerator.generateRandomAvatar();
        
        // Update UI
        this.updateHealthBar();
        this.updateShieldBar();
        this.updateKillDisplay();
        this.updateWeaponDisplay();
        this.updateSlotCounter();
        this.updateShieldUIState();
        this.updateAvatarDisplay();
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
            this.currentKills = characterData.currentKills || 0;
            
            // Load avatar
            this.currentAvatar = characterData.avatar || this.avatarGenerator.generateRandomAvatar();
            this.updateAvatarDisplay(this.currentAvatar);
            
            // Load weapons
            this.weapons = characterData.weapons || [];
            
            // Update UI
            this.updateHealthBar();
            this.updateShieldBar();
            this.updateKillDisplay();
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