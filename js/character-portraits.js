/**
 * Character Portrait System
 * Manages Borderlands 3 character portraits for avatar system
 */

class CharacterPortraits {
    constructor() {
        this.characters = [
            {
                id: 'amara',
                name: 'Amara',
                class: 'The Siren',
                image: 'assets/characters/amara.png',
                fallbackImage: 'assets/characters/amara.jpg',
                emoji: '🔥', // Fallback if image not found
                color: '#e74c3c' // Red theme for Amara
            },
            {
                id: 'fl4k',
                name: 'FL4K',
                class: 'The Beastmaster',
                image: 'assets/characters/fl4k.jpg',
                fallbackImage: 'assets/characters/fl4k.jpg',
                emoji: '🤖', // Fallback if image not found
                color: '#27ae60' // Green theme for FL4K
            },
            {
                id: 'moze',
                name: 'Moze',
                class: 'The Gunner',
                image: 'assets/characters/moze.jpg',
                fallbackImage: 'assets/characters/moze.jpg',
                emoji: '💣', // Fallback if image not found
                color: '#f39c12' // Orange theme for Moze
            },
            {
                id: 'zane',
                name: 'Zane',
                class: 'The Operative',
                image: 'assets/characters/zane.png',
                fallbackImage: 'assets/characters/zane.jpg',
                emoji: '🎯', // Fallback if image not found
                color: '#3498db' // Blue theme for Zane
            }
        ];
        
        // Cache for loaded images
        this.imageCache = new Map();
        this.loadingPromises = new Map();
    }

    async loadCharacterImage(character) {
        if (this.imageCache.has(character.id)) {
            return this.imageCache.get(character.id);
        }

        if (this.loadingPromises.has(character.id)) {
            return this.loadingPromises.get(character.id);
        }

        const loadPromise = new Promise((resolve) => {
            const img = new Image();
            
            const onLoad = () => {
                this.imageCache.set(character.id, { success: true, url: img.src });
                resolve({ success: true, url: img.src });
            };

            const onError = () => {
                // Try fallback image
                if (img.src === character.image && character.fallbackImage) {
                    img.src = character.fallbackImage;
                } else {
                    // Use emoji fallback
                    this.imageCache.set(character.id, { success: false, emoji: character.emoji });
                    resolve({ success: false, emoji: character.emoji });
                }
            };

            img.onload = onLoad;
            img.onerror = onError;
            img.src = character.image;
        });

        this.loadingPromises.set(character.id, loadPromise);
        return loadPromise;
    }

    async createPortraitHTML(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) {
            // Default to first character if not found
            return this.createPortraitHTML(this.characters[0].id);
        }

        const imageData = await this.loadCharacterImage(character);
        
        if (imageData.success) {
            return `
            <div class="character-portrait" style="
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${character.color}, ${this.darkenColor(character.color)});
                border: 3px solid rgba(255, 255, 255, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
            " title="${character.name} - ${character.class}">
                <img src="${imageData.url}" alt="${character.name}" style="
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                ">
                
                <!-- Sci-fi Glow Effect -->
                <div style="
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent);
                    z-index: 1;
                    pointer-events: none;
                "></div>
            </div>`;
        } else {
            // Fallback to emoji with character theme
            return `
            <div class="character-portrait" style="
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${character.color}, ${this.darkenColor(character.color)});
                border: 3px solid rgba(255, 255, 255, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
            " title="${character.name} - ${character.class}">
                <div style="
                    font-size: 35px;
                    filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));
                ">${imageData.emoji}</div>
                
                <!-- Sci-fi Glow Effect -->
                <div style="
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent);
                    z-index: 1;
                    pointer-events: none;
                "></div>
            </div>`;
        }
    }

    createCharacterSelector(currentCharacterId, onUpdate) {
        const current = this.characters.find(c => c.id === currentCharacterId) || this.characters[0];
        
        return `
        <div class="character-selector-popup" style="
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            max-width: 500px;
            margin: 0 auto;
            backdrop-filter: blur(10px);
        ">
            <h3 style="text-align: center; color: #1e3c72; margin-bottom: 25px;">🎭 Vælg Karakter</h3>
            
            <!-- Current Selection Preview -->
            <div style="text-align: center; margin-bottom: 25px;">
                <div id="character-preview">
                    ${this.createPortraitPreview(current)}
                </div>
                <div style="margin-top: 10px; color: #2c3e50; font-weight: bold;">
                    ${current.name} - ${current.class}
                </div>
            </div>
            
            <!-- Character Grid -->
            <div class="character-grid" style="
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 25px;
            ">
                ${this.characters.map(character => `
                    <div class="character-option ${character.id === currentCharacterId ? 'selected' : ''}" 
                         data-character="${character.id}" 
                         style="
                        border: 3px solid ${character.id === currentCharacterId ? character.color : 'rgba(0,0,0,0.1)'};
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        background: ${character.id === currentCharacterId ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'};
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                    ">
                        <!-- Character Image Area -->
                        <div class="character-portrait character-option-image" style="
                            width: 100%;
                            background: linear-gradient(135deg, ${character.color}, ${this.darkenColor(character.color)});
                            position: relative;
                            overflow: hidden;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <img src="${character.image}" alt="${character.name}" style="
                                width: 100%;
                                height: 100%;
                                object-fit: cover;
                            " onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div style="font-size: 40px; display: none; color: white;">${character.emoji}</div>
                        </div>
                        
                        <!-- Character Info Area -->
                        <div style="
                            padding: 8px 5px;
                            text-align: center;
                            background: rgba(255,255,255,0.9);
                        ">
                            <div style="font-weight: bold; color: ${character.color}; font-size: 14px;">${character.name}</div>
                            <div style="font-size: 10px; color: #666; margin-top: 2px;">${character.class}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="text-align: center;">
                <button id="save-character-selection" class="action-btn">✅ Gem Valg</button>
                <button id="cancel-character-selection" class="action-btn" style="background: #6c757d; margin-left: 10px;">❌ Annuller</button>
            </div>
        </div>`;
    }

    createPortraitPreview(character) {
        return `
        <div class="character-portrait character-portrait-large" style="
            width: 100px;
            height: 100px;
            margin: 0 auto;
            border-radius: 50%;
            background: linear-gradient(135deg, ${character.color}, ${this.darkenColor(character.color)});
            border: 3px solid rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        ">
            <img src="${character.image}" alt="${character.name}" style="
                width: 100%;
                height: 100%;
                border-radius: 50%;
            " onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="font-size: 45px; display: none;">${character.emoji}</div>
        </div>`;
    }

    createMiniPortrait(character) {
        return `
        <div class="character-portrait character-portrait-mini" style="
            width: 60px;
            height: 60px;
            margin: 0 auto;
            border-radius: 50%;
            background: linear-gradient(135deg, ${character.color}, ${this.darkenColor(character.color)});
            border: 2px solid rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        ">
            <img src="${character.image}" alt="${character.name}" style="
                width: 100%;
                height: 100%;
                border-radius: 50%;
            " onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="font-size: 25px; display: none;">${character.emoji}</div>
        </div>`;
    }

    getCharacterById(id) {
        return this.characters.find(c => c.id === id) || this.characters[0];
    }

    getRandomCharacter() {
        return this.characters[Math.floor(Math.random() * this.characters.length)];
    }

    darkenColor(color) {
        // Simple color darkening for gradient effect
        const colorMap = {
            '#e74c3c': '#a93226',
            '#27ae60': '#1e8449', 
            '#f39c12': '#d68910',
            '#3498db': '#2980b9'
        };
        return colorMap[color] || color;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterPortraits;
} else {
    window.CharacterPortraits = CharacterPortraits;
}