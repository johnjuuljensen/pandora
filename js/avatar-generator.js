/**
 * Avatar Generator Module
 * Creates customizable character avatars using emoji and CSS
 */

class AvatarGenerator {
    constructor() {
        this.avatarParts = {
            faces: ['😀', '😃', '😄', '😊', '😎', '🤖', '👽', '🤠', '👨‍🚀', '👩‍🚀'],
            accessories: ['', '🕶️', '👓', '🎩', '👑', '🧢', '⚡', '🔥', '✨', '💫'],
            backgrounds: ['#1e3c72', '#2a5298', '#9b59b6', '#8e44ad', '#e74c3c', '#c0392b', '#f39c12', '#d68910', '#27ae60', '#239b56']
        };
    }

    generateRandomAvatar() {
        return {
            face: this.getRandomElement(this.avatarParts.faces),
            accessory: this.getRandomElement(this.avatarParts.accessories),
            background: this.getRandomElement(this.avatarParts.backgrounds)
        };
    }

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    createAvatarHTML(avatarData) {
        const avatar = avatarData || this.generateRandomAvatar();
        
        // Clean up legacy hair data for backwards compatibility
        if (avatar.hair) {
            delete avatar.hair;
        }
        
        return `
        <div class="character-avatar" style="
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${avatar.background}, ${this.darkenColor(avatar.background)});
            border: 3px solid rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        ">
            <!-- Background Pattern -->
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%);
            "></div>
            
            <!-- Main Face -->
            <div style="
                font-size: 35px;
                z-index: 2;
                position: relative;
                filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
            ">${avatar.face}</div>
            
            
            <!-- Accessory Overlay -->
            ${avatar.accessory ? `
            <div style="
                position: absolute;
                top: 5px;
                right: 5px;
                font-size: 20px;
                z-index: 4;
                filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
            ">${avatar.accessory}</div>
            ` : ''}
            
            <!-- Sci-fi Glow Effect -->
            <div style="
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                border-radius: 50%;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                z-index: 1;
            "></div>
        </div>`;
    }

    createAvatarCustomizer(currentAvatar, onUpdate) {
        return `
        <div class="avatar-customizer" style="
            background: rgba(255, 255, 255, 0.95);
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            max-width: 400px;
            margin: 0 auto;
        ">
            <h3 style="text-align: center; color: #1e3c72; margin-bottom: 20px;">🎭 Customize Avatar</h3>
            
            <!-- Avatar Preview -->
            <div style="text-align: center; margin-bottom: 20px;">
                <div id="avatar-preview">
                    ${this.createAvatarHTML(currentAvatar)}
                </div>
            </div>
            
            <!-- Customization Options -->
            <div class="customizer-options">
                <div class="option-group">
                    <label style="font-weight: bold; color: #333;">Ansigt:</label>
                    <div class="option-buttons" id="face-options">
                        ${this.avatarParts.faces.map((face, index) => 
                            `<button class="option-btn ${currentAvatar?.face === face ? 'active' : ''}" 
                                     data-type="face" data-value="${face}" 
                                     style="font-size: 20px; margin: 2px;">${face}</button>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="option-group">
                    <label style="font-weight: bold; color: #333;">Baggrund:</label>
                    <div class="option-buttons" id="background-options">
                        ${this.avatarParts.backgrounds.map((bg, index) => 
                            `<button class="option-btn ${currentAvatar?.background === bg ? 'active' : ''}" 
                                     data-type="background" data-value="${bg}" 
                                     style="background: ${bg}; width: 30px; height: 30px; margin: 2px; border-radius: 50%;"></button>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="option-group">
                    <label style="font-weight: bold; color: #333;">Tilbehør:</label>
                    <div class="option-buttons" id="accessory-options">
                        <button class="option-btn ${!currentAvatar?.accessory ? 'active' : ''}" 
                                data-type="accessory" data-value="" 
                                style="margin: 2px;">Ingen</button>
                        ${this.avatarParts.accessories.filter(acc => acc).map((acc, index) => 
                            `<button class="option-btn ${currentAvatar?.accessory === acc ? 'active' : ''}" 
                                     data-type="accessory" data-value="${acc}" 
                                     style="font-size: 16px; margin: 2px;">${acc}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button id="randomize-avatar" class="action-btn" style="margin-right: 10px;">🎲 Tilfældig</button>
                <button id="save-avatar" class="action-btn">✅ Gem Avatar</button>
                <button id="cancel-avatar" class="action-btn" style="background: #6c757d;">❌ Annuller</button>
            </div>
        </div>`;
    }

    darkenColor(color) {
        // Simple color darkening for gradient effect
        const colorMap = {
            '#1e3c72': '#0f1e39',
            '#2a5298': '#15294c',
            '#9b59b6': '#4d2c5b',
            '#8e44ad': '#472256',
            '#e74c3c': '#731e26',
            '#c0392b': '#601c15',
            '#f39c12': '#794e09',
            '#d68910': '#6b4408',
            '#27ae60': '#135730',
            '#239b56': '#114d2b'
        };
        return colorMap[color] || color;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarGenerator;
} else {
    window.AvatarGenerator = AvatarGenerator;
}