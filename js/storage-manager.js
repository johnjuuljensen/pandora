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
            settings: 'pandora_settings'
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
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
} else {
    window.StorageManager = StorageManager;
}