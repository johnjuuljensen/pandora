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
        this.characterPortraits = new CharacterPortraits();
        
        // Skills system
        this.skills = {};
        this.availableSkillPoints = 0;
        
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
            await this.setupCharacterSelector();
            
            // Setup portrait system
            this.setupPortraitSystem();
            
            // Load saved data
            await this.loadSavedCharacter();
            this.loadSavedWeapons();
            
            // Setup tab system
            this.setupTabSystem();
            
            // Load selected skill tree
            this.loadSelectedSkillTree();
            
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
            characterId: this.currentCharacterId || 'amara',
            currentKills: this.currentKills || 0,
            skills: this.skills || {},
            availableSkillPoints: this.availableSkillPoints || 0
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
            
            this.uiManager.showMessage(`🎉 Level Up! Nu level ${newLevel}! +20 HP! +1 Skill Point! Kill counter reset! 🎉`);
            
            // Update displays
            this.updateSlotCounter();
            this.updateKillDisplay();
            this.updateAvailableSkillPoints(); // Update skill points after level up
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

    // Skills System
    updateAvailableSkillPoints() {
        const currentLevel = parseInt(document.getElementById('character-level').value) || 1;
        const totalSkillPointsEarned = currentLevel - 1; // Level 1 = 0 points, Level 2 = 1 point, etc.
        
        // Calculate actual spent skill points based on tier costs
        let spentSkillPoints = 0;
        for (const skillId in this.skills) {
            const skillNode = document.querySelector(`[data-skill="${skillId}"]`);
            if (skillNode) {
                const tier = parseInt(skillNode.dataset.tier);
                spentSkillPoints += this.getSkillCost(tier);
            }
        }
        
        this.availableSkillPoints = Math.max(0, totalSkillPointsEarned - spentSkillPoints);
        
        // Update UI
        document.getElementById('available-skill-points').textContent = this.availableSkillPoints;
        document.getElementById('skill-points-counter').textContent = this.availableSkillPoints;
        
        this.updateSkillTreeUI();
    }

    updateSkillTreeUI() {
        const skillNodes = document.querySelectorAll('.skill-node');
        
        skillNodes.forEach(node => {
            const skillId = node.dataset.skill;
            const tier = parseInt(node.dataset.tier);
            const row = node.dataset.row;
            
            // Check if skill is unlocked
            if (this.skills[skillId]) {
                node.classList.remove('locked', 'available');
                node.classList.add('unlocked');
            } else if (this.canUnlockSkill(skillId, tier, row)) {
                node.classList.remove('locked', 'unlocked');
                node.classList.add('available');
            } else {
                node.classList.remove('available', 'unlocked');
                node.classList.add('locked');
            }
        });

        // Update skill connectors
        this.updateSkillConnectors();
    }

    getSkillCost(tier) {
        // Progressive costs: tier 1 = 1 point, tier 2 = 2 points, etc.
        return tier;
    }

    canUnlockSkill(skillId, tier, row) {
        // Must have enough skill points for this tier
        const requiredPoints = this.getSkillCost(tier);
        if (this.availableSkillPoints < requiredPoints) return false;
        
        // Tier 1 skills are always available
        if (tier <= 1) return true;
        
        // Must have previous tier skill in same row
        const previousTier = tier - 1;
        const rowSkills = this.getSkillsInRow(row);
        const previousSkill = rowSkills.find(skill => skill.tier === previousTier);
        
        return previousSkill && this.skills[previousSkill.id];
    }

    getSkillsInRow(row) {
        const skills = {
            combat: [
                {id: 'damage-boost', tier: 1},
                {id: 'critical-master', tier: 2},
                {id: 'berserker', tier: 3},
                {id: 'dual-wielder', tier: 4},
                {id: 'killstreak', tier: 5},
                {id: 'weapon-master', tier: 6}
            ],
            survival: [
                {id: 'tough-guy', tier: 1},
                {id: 'shield-expert', tier: 2},
                {id: 'battle-medic', tier: 3},
                {id: 'heavy-armor', tier: 4},
                {id: 'guardian-angel', tier: 5},
                {id: 'tank', tier: 6}
            ],
            utility: [
                {id: 'pack-rat', tier: 1},
                {id: 'treasure-hunter', tier: 2},
                {id: 'weapon-expert', tier: 3},
                {id: 'weapon-crafter', tier: 4},
                {id: 'loot-master', tier: 5},
                {id: 'lucky', tier: 6}
            ]
        };
        return skills[row] || [];
    }

    unlockSkill(skillId) {
        const skillNode = document.querySelector(`[data-skill="${skillId}"]`);
        if (!skillNode) return false;

        const tier = parseInt(skillNode.dataset.tier);
        const row = skillNode.dataset.row;
        const requiredPoints = this.getSkillCost(tier);

        if (this.availableSkillPoints < requiredPoints) {
            this.uiManager.showMessage(`Ikke nok skill points! Kræver ${requiredPoints} points.`);
            return false;
        }

        if (!this.canUnlockSkill(skillId, tier, row)) {
            this.uiManager.showMessage('Kan ikke låse op for denne skill endnu!');
            return false;
        }

        // Unlock the skill
        this.skills[skillId] = true;
        this.availableSkillPoints -= requiredPoints;
        
        // Apply skill effect
        this.applySkillEffect(skillId);
        
        // Update UI
        this.updateAvailableSkillPoints();
        this.autoSaveCharacter();
        
        const skillName = skillNode.querySelector('.skill-name').textContent;
        this.uiManager.showMessage(`🌟 Skill unlocked: ${skillName}! (Cost: ${requiredPoints} points)`);
        
        return true;
    }

    resetSkills() {
        if (Object.keys(this.skills).length === 0) {
            this.uiManager.showMessage('Ingen skills at resette!');
            return;
        }
        
        if (confirm('Reset alle skills? Dette kan ikke fortrydes.')) {
            this.skills = {};
            this.updateAvailableSkillPoints();
            this.autoSaveCharacter();
            this.uiManager.showMessage('🔄 Alle skills reset!');
        }
    }

    applySkillEffect(skillId) {
        // Skill effects will be implemented based on gameplay needs
        // For now, just log the effect
        const effects = {
            'damage-boost': 'Alle våben gør +5 ekstra skade',
            'critical-master': '10% chance for dobbelt skade på angreb',
            'berserker': 'Gør 25% mere skade når dit HP er under 50%',
            'dual-wielder': 'Equip et andet våben for dobbelt-våben kamp',
            'killstreak': 'Hvert drab giver +2% skade (max 50%). Nulstilles ved død',
            'weapon-master': 'Alle våben gør +10 ekstra skade',
            'tough-guy': 'Øger dit maksimale helbred med 20 point',
            'shield-expert': 'Alle skjolde har 25% mere beskyttelse',
            'battle-medic': 'Automatisk heling af 10 HP hver gang du dræber en fjende',
            'heavy-armor': 'Tung rustning: +50 max HP og +25% skjold kapacitet',
            'guardian-angel': 'Når du dør, genopliv automatisk med 1 HP (én gang per session)',
            'tank': 'Al indkommende skade reduceres med 25%',
            'pack-rat': 'Få en ekstra våben slot i dit inventory',
            'treasure-hunter': '15% bedre chance for at finde sjældne og legendære våben',
            'weapon-expert': 'Se skjulte våben stats og detaljeret information',
            'weapon-crafter': 'Lås op for våben crafting til at kombinere og opgradere våben',
            'loot-master': 'Alle fundne våben er automatisk ét raritet niveau højere',
            'lucky': '30% bedre chance for at finde sjældne og legendære våben'
        };
        
        this.debugManager.log(`Skill effect applied: ${effects[skillId] || skillId}`, 'success');
    }

    updateSkillConnectors() {
        const connectors = document.querySelectorAll('.skill-connector');
        connectors.forEach(connector => {
            // Find adjacent skill nodes
            const prevNode = connector.previousElementSibling;
            const nextNode = connector.nextElementSibling;
            
            if (prevNode && nextNode && 
                prevNode.classList.contains('unlocked') && 
                nextNode.classList.contains('unlocked')) {
                connector.classList.add('active');
            } else {
                connector.classList.remove('active');
            }
        });
    }

    filterSkillTree(selectedTree) {
        // Hide all skill trees
        const skillRows = document.querySelectorAll('.skill-row[data-skill-tree]');
        skillRows.forEach(row => {
            row.style.display = 'none';
        });
        
        // Show selected skill tree
        const selectedRow = document.querySelector(`[data-skill-tree="${selectedTree}"]`);
        if (selectedRow) {
            selectedRow.style.display = 'flex';
        }
        
        // Save selected tree to localStorage
        localStorage.setItem('pandora_selected_skill_tree', selectedTree);
    }

    loadSelectedSkillTree() {
        try {
            const selectedTree = localStorage.getItem('pandora_selected_skill_tree') || 'combat';
            
            // Set dropdown value
            const dropdown = document.getElementById('skill-tree-filter');
            if (dropdown) {
                dropdown.value = selectedTree;
            }
            
            // Filter to show selected tree
            this.filterSkillTree(selectedTree);
        } catch (error) {
            console.error('Error loading selected skill tree:', error);
            // Default to combat tree
            this.filterSkillTree('combat');
        }
    }

    // Dice rolling
    rollDice() {
        const result = Math.floor(Math.random() * 20) + 1;
        this.uiManager.displayDiceResult(result);
    }

    // Storage operations (manual load only - auto-save handles saving)

    async loadSavedCharacter() {
        // Try to load the active character
        const activeCharacterName = this.storageManager.getActiveCharacter();
        if (activeCharacterName) {
            // Set the dropdown to the active character
            const characterSelect = document.getElementById('character-select');
            if (characterSelect) {
                characterSelect.value = activeCharacterName;
            }
            
            // Load the character data
            await this.loadCharacterByName(activeCharacterName);
        } else {
            // Fallback to old system for migration
            const character = this.storageManager.loadCharacter();
            if (character && character.name) {
                // Migrate old character to new system
                const weapons = this.storageManager.loadWeapons();
                this.storageManager.saveCharacterByName(character.name, character, weapons);
                this.populateCharacterDropdown();
                await this.loadCharacterByName(character.name);
            } else {
                // No existing character - set default character
                this.currentCharacterId = this.characterPortraits.getRandomCharacter().id;
                await this.updatePortraitDisplay(this.currentCharacterId);
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
            this.updateAvailableSkillPoints(); // Update skill points on level change
            this.autoSaveCharacter(); // Save level change
        });
        
        // Skills system
        document.getElementById('reset-skills')?.addEventListener('click', () => this.resetSkills());
        
        // Skill tree filter dropdown
        document.getElementById('skill-tree-filter')?.addEventListener('change', (e) => {
            this.filterSkillTree(e.target.value);
        });
        
        // Skill node clicking
        document.addEventListener('click', (e) => {
            if (e.target.closest('.skill-node')) {
                const skillNode = e.target.closest('.skill-node');
                const skillId = skillNode.dataset.skill;
                
                if (skillNode.classList.contains('available')) {
                    this.unlockSkill(skillId);
                }
            }
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
    setupPortraitSystem() {
        // Initialize character if not already set
        if (!this.currentCharacterId) {
            this.currentCharacterId = 'amara';
        }
        
        // Setup portrait display
        this.updatePortraitDisplay();
        
        // Setup customize button event
        const customizeBtn = document.getElementById('customize-avatar');
        if (customizeBtn) {
            customizeBtn.addEventListener('click', () => {
                this.openCharacterSelector();
            });
        }
    }

    async updatePortraitDisplay(characterId = null) {
        const container = document.getElementById('character-avatar-display');
        if (!container) return;
        
        const currentId = characterId || this.currentCharacterId || 'amara';
        const portraitHTML = await this.characterPortraits.createPortraitHTML(currentId);
        container.innerHTML = portraitHTML;
        
        // Save current character ID
        if (!this.currentCharacterId) {
            this.currentCharacterId = currentId;
        }
    }

    openCharacterSelector() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'avatar-modal';
        modal.innerHTML = this.characterPortraits.createCharacterSelector(this.currentCharacterId);
        
        document.body.appendChild(modal);
        
        // Setup selector event listeners
        this.setupSelectorEvents(modal);
    }

    setupSelectorEvents(modal) {
        let tempCharacterId = this.currentCharacterId;
        
        // Character option events
        modal.querySelectorAll('.character-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const characterId = e.currentTarget.dataset.character;
                tempCharacterId = characterId;
                
                // Update selected states
                modal.querySelectorAll('.character-option').forEach(opt => {
                    opt.classList.remove('selected');
                    opt.style.border = '3px solid rgba(0,0,0,0.1)';
                    opt.style.background = 'rgba(255,255,255,0.5)';
                });
                
                // Mark this option as selected
                const character = this.characterPortraits.getCharacterById(characterId);
                e.currentTarget.classList.add('selected');
                e.currentTarget.style.border = `3px solid ${character.color}`;
                e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                
                // Update preview
                const preview = modal.querySelector('#character-preview');
                if (preview) {
                    preview.innerHTML = this.characterPortraits.createPortraitPreview(character);
                }
                
                // Update title text
                const titleDiv = preview.parentElement.querySelector('div[style*="margin-top: 10px"]');
                if (titleDiv) {
                    titleDiv.textContent = `${character.name} - ${character.class}`;
                    titleDiv.style.color = character.color;
                }
            });
        });
        
        // Save button
        const saveBtn = modal.querySelector('#save-character-selection');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                this.currentCharacterId = tempCharacterId;
                await this.updatePortraitDisplay(this.currentCharacterId);
                this.autoSaveCharacter(); // Trigger auto-save
                
                const character = this.characterPortraits.getCharacterById(tempCharacterId);
                this.uiManager.showMessage(`${character.name} valgt! 🎭`);
                document.body.removeChild(modal);
            });
        }
        
        // Cancel button
        const cancelBtn = modal.querySelector('#cancel-character-selection');
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

    // Method removed - no longer needed with character portraits

    // Character selector functionality
    async setupCharacterSelector() {
        this.populateCharacterDropdown();
        
        // Character selection event
        const characterSelect = document.getElementById('character-select');
        if (characterSelect) {
            characterSelect.addEventListener('change', async (e) => {
                if (e.target.value) {
                    await this.loadCharacterByName(e.target.value);
                }
            });
        }
        
        // New character button event
        const newCharacterBtn = document.getElementById('new-character');
        if (newCharacterBtn) {
            newCharacterBtn.addEventListener('click', async () => {
                await this.createNewCharacter();
            });
        }
        
        // Delete character button event
        const deleteCharacterBtn = document.getElementById('delete-character');
        if (deleteCharacterBtn) {
            deleteCharacterBtn.addEventListener('click', async () => {
                await this.deleteCurrentCharacter();
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

    async createNewCharacter() {
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
                
                await this.loadCharacterByName(sanitizedName);
                this.uiManager.showMessage(`Ny karakter "${sanitizedName}" oprettet! 🎭`);
            } else {
                this.uiManager.showMessage('Fejl ved oprettelse af karakter');
            }
        }
    }

    async deleteCurrentCharacter() {
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
                await this.loadCharacterByName(nextCharacter);
            } else {
                // Clear UI if no characters left (shouldn't happen due to prevention above)
                await this.clearCharacterUI();
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

    async clearCharacterUI() {
        // Reset to default values
        document.getElementById('character-level').value = 1;
        document.getElementById('current-hp').value = 100;
        document.getElementById('max-hp').value = 100;
        document.getElementById('current-shield').value = 0;
        document.getElementById('max-shield').value = 0;
        
        // Clear weapons and set default character
        this.weapons = [];
        this.currentCharacterId = 'amara';
        
        // Update UI
        this.updateHealthBar();
        this.updateShieldBar();
        this.updateKillDisplay();
        this.updateAvailableSkillPoints(); // Update skill points
        this.updateWeaponDisplay();
        this.updateSlotCounter();
        this.updateShieldUIState();
        await this.updatePortraitDisplay();
    }

    async loadCharacterByName(characterName) {
        const characterData = this.storageManager.loadCharacterByName(characterName);
        if (characterData) {
            // Update UI with character data
            document.getElementById('character-level').value = characterData.level;
            document.getElementById('current-hp').value = characterData.currentHP;
            document.getElementById('max-hp').value = characterData.maxHP;
            document.getElementById('current-shield').value = characterData.currentShield;
            document.getElementById('max-shield').value = characterData.maxShield;
            this.currentKills = characterData.currentKills || 0;
            this.skills = characterData.skills || {};
            this.availableSkillPoints = characterData.availableSkillPoints || 0;
            
            // Load character portrait
            this.currentCharacterId = characterData.characterId || 'amara';
            await this.updatePortraitDisplay(this.currentCharacterId);
            
            // Load weapons
            this.weapons = characterData.weapons || [];
            
            // Update UI
            this.updateHealthBar();
            this.updateShieldBar();
            this.updateKillDisplay();
            this.updateAvailableSkillPoints(); // Update skill points
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