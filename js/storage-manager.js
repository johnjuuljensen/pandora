/**
 * Storage Manager Module
 * Handles localStorage operations for character and game data
 */

class StorageManager {
    constructor() {
        this.keys = {
            character: 'pandora_character',
            weapons: 'pandora_weapons',
            activeTab: 'pandora_active_tab',
            settings: 'pandora_settings',
            characterList: 'pandora_character_list',
            activeCharacter: 'pandora_active_character'
        };
    }

    saveCharacter(characterData) {
        try {
            const dataToSave = {
                name: characterData.name || '',
                level: characterData.level || 1,
                currentHP: characterData.currentHP || 100,
                maxHP: characterData.maxHP || 100,
                currentShield: characterData.currentShield || 0,
                maxShield: characterData.maxShield || 50,
                currentKills: characterData.currentKills || 0,
                savedAt: new Date().toISOString()
            };

            localStorage.setItem(this.keys.character, JSON.stringify(dataToSave));
            return true;
        } catch (error) {
            console.error('Failed to save character:', error);
            return false;
        }
    }

    loadCharacter() {
        try {
            const data = localStorage.getItem(this.keys.character);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error('Failed to load character:', error);
            return null;
        }
    }

    saveWeapons(weapons) {
        try {
            const weaponsData = {
                weapons: weapons || [],
                savedAt: new Date().toISOString()
            };

            localStorage.setItem(this.keys.weapons, JSON.stringify(weaponsData));
            return true;
        } catch (error) {
            console.error('Failed to save weapons:', error);
            return false;
        }
    }

    loadWeapons() {
        try {
            const data = localStorage.getItem(this.keys.weapons);
            if (data) {
                const weaponsData = JSON.parse(data);
                return weaponsData.weapons || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to load weapons:', error);
            return [];
        }
    }

    saveActiveTab(tabId) {
        try {
            localStorage.setItem(this.keys.activeTab, tabId);
            return true;
        } catch (error) {
            console.error('Failed to save active tab:', error);
            return false;
        }
    }

    loadActiveTab() {
        try {
            return localStorage.getItem(this.keys.activeTab) || 'character';
        } catch (error) {
            console.error('Failed to load active tab:', error);
            return 'character';
        }
    }

    saveSettings(settings) {
        try {
            const settingsData = {
                ...settings,
                savedAt: new Date().toISOString()
            };

            localStorage.setItem(this.keys.settings, JSON.stringify(settingsData));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    loadSettings() {
        try {
            const data = localStorage.getItem(this.keys.settings);
            if (data) {
                return JSON.parse(data);
            }
            return {};
        } catch (error) {
            console.error('Failed to load settings:', error);
            return {};
        }
    }

    exportCharacterData() {
        try {
            const character = this.loadCharacter();
            const weapons = this.loadWeapons();
            
            const exportData = {
                character,
                weapons,
                exportedAt: new Date().toISOString(),
                version: window.appVersion?.version || '1.3.0'
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Failed to export character data:', error);
            return null;
        }
    }

    importCharacterData(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            // Validate data structure
            if (!importData.character && !importData.weapons) {
                throw new Error('Invalid import data format');
            }

            // Import character if available
            if (importData.character) {
                this.saveCharacter(importData.character);
            }

            // Import weapons if available
            if (importData.weapons && Array.isArray(importData.weapons)) {
                this.saveWeapons(importData.weapons);
            }

            return {
                success: true,
                character: !!importData.character,
                weapons: importData.weapons?.length || 0,
                version: importData.version
            };

        } catch (error) {
            console.error('Failed to import character data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    clearAllData() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }

    getStorageInfo() {
        try {
            const info = {
                hasCharacter: !!localStorage.getItem(this.keys.character),
                hasWeapons: !!localStorage.getItem(this.keys.weapons),
                hasSettings: !!localStorage.getItem(this.keys.settings),
                storageUsed: 0
            };

            // Calculate approximate storage usage
            Object.values(this.keys).forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    info.storageUsed += item.length;
                }
            });

            return info;
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }

    // Auto-save functionality
    enableAutoSave(characterManager, interval = 30000) { // 30 seconds default
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            if (characterManager) {
                const character = characterManager.getCharacterData();
                const weapons = characterManager.getWeapons();
                
                this.saveCharacter(character);
                this.saveWeapons(weapons);
                
                console.log('Auto-saved character data');
            }
        }, interval);
    }

    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // Multiple character support
    saveCharacterByName(characterName, characterData, weapons) {
        try {
            if (!characterName || characterName.trim() === '') {
                throw new Error('Character name cannot be empty');
            }

            const sanitizedName = characterName.trim();
            
            // Create character data with weapons
            const fullCharacterData = {
                name: sanitizedName,
                level: characterData.level || 1,
                currentHP: characterData.currentHP || 100,
                maxHP: characterData.maxHP || 100,
                currentShield: characterData.currentShield || 0,
                maxShield: characterData.maxShield || 50,
                avatar: characterData.avatar || null,
                currentKills: characterData.currentKills || 0,
                weapons: weapons || [],
                savedAt: new Date().toISOString()
            };

            // Save to character-specific key
            const characterKey = `pandora_character_${sanitizedName}`;
            localStorage.setItem(characterKey, JSON.stringify(fullCharacterData));

            // Update character list
            this.addToCharacterList(sanitizedName);

            // Set as active character
            this.setActiveCharacter(sanitizedName);

            return true;
        } catch (error) {
            console.error('Failed to save character by name:', error);
            return false;
        }
    }

    loadCharacterByName(characterName) {
        try {
            if (!characterName || characterName.trim() === '') {
                return null;
            }

            const sanitizedName = characterName.trim();
            const characterKey = `pandora_character_${sanitizedName}`;
            const data = localStorage.getItem(characterKey);
            
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error('Failed to load character by name:', error);
            return null;
        }
    }

    addToCharacterList(characterName) {
        try {
            const characterList = this.getCharacterList();
            if (!characterList.includes(characterName)) {
                characterList.push(characterName);
                localStorage.setItem(this.keys.characterList, JSON.stringify(characterList));
            }
            return true;
        } catch (error) {
            console.error('Failed to add to character list:', error);
            return false;
        }
    }

    getCharacterList() {
        try {
            const data = localStorage.getItem(this.keys.characterList);
            if (data) {
                return JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error('Failed to get character list:', error);
            return [];
        }
    }

    deleteCharacter(characterName) {
        try {
            if (!characterName || characterName.trim() === '') {
                return false;
            }

            const sanitizedName = characterName.trim();
            const characterKey = `pandora_character_${sanitizedName}`;
            
            // Remove character data
            localStorage.removeItem(characterKey);

            // Remove from character list
            const characterList = this.getCharacterList();
            const updatedList = characterList.filter(name => name !== sanitizedName);
            localStorage.setItem(this.keys.characterList, JSON.stringify(updatedList));

            // If this was the active character, clear active character
            if (this.getActiveCharacter() === sanitizedName) {
                localStorage.removeItem(this.keys.activeCharacter);
            }

            return true;
        } catch (error) {
            console.error('Failed to delete character:', error);
            return false;
        }
    }

    setActiveCharacter(characterName) {
        try {
            localStorage.setItem(this.keys.activeCharacter, characterName || '');
            return true;
        } catch (error) {
            console.error('Failed to set active character:', error);
            return false;
        }
    }

    getActiveCharacter() {
        try {
            return localStorage.getItem(this.keys.activeCharacter) || '';
        } catch (error) {
            console.error('Failed to get active character:', error);
            return '';
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
} else {
    window.StorageManager = StorageManager;
}