/**
 * UI Manager Module
 * Handles display updates, HTML templates, and user interface management
 */

class UIManager {
    constructor(debugManager = null) {
        this.messageTimeout = null;
        this.debugManager = debugManager;
    }

    darkenColor(color, percent) {
        // Convert hex to RGB
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return "#" + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
    }

    showMessage(message, duration = 3000) {
        // Use debug manager if available, otherwise fallback to original method
        if (this.debugManager) {
            this.debugManager.showMessage(message, 'info', duration);
        } else {
            this.fallbackShowMessage(message, duration);
        }
    }

    fallbackShowMessage(message, duration = 3000) {
        // Original message display logic
        let messageEl = document.getElementById('system-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'system-message';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10000;
                max-width: 300px;
                font-size: 14px;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(messageEl);
        }

        messageEl.textContent = message;
        messageEl.style.opacity = '1';
        messageEl.style.transform = 'translateX(0)';

        // Clear existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        // Hide message after duration
        this.messageTimeout = setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(100%)';
        }, duration);
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
                    ${weapon.weaponClass === 'Shield' ? 
                        `<span title="Shield Points: ${weapon.shieldPoints}">🛡️${weapon.shieldPoints}</span>` :
                        `<span title="Skade: ${weapon.damage}">💥${weapon.damage}</span>`
                    }
                    <span title="Præcision: ${weapon.accuracy}%">🎯${weapon.accuracy}%</span>
                    <span title="Rækkevidde: ${weapon.range}m">📏${weapon.range}m</span>
                </div>
                <div class="weapon-actions">
                    <button onclick="characterManager.addWeaponToInventory(${weapon.id})" class="action-btn compact">
                        Tilføj
                    </button>
                    <button onclick="characterManager.shareWeapon(${weapon.id})" class="action-btn compact" style="background: #6f42c1;">
                        📤 Del
                    </button>
                    <button onclick="characterManager.discardWeapon()" class="action-btn compact" style="background: #dc3545;">
                        Afvis
                    </button>
                </div>
            </div>
        `;
        display.style.display = 'block';
    }

    displayReceivedWeapon(weapon) {
        const display = document.getElementById('new-weapon-display');
        display.innerHTML = `
            <h3>📦 Våben Modtaget!</h3>
            <div class="weapon-card compact">
                <div class="weapon-image">${weapon.image}</div>
                <div class="weapon-name" style="color: ${weapon.rarity.color}">${weapon.name}</div>
                <div class="weapon-class" style="color: ${weapon.classColor}; font-weight: bold; margin: 5px 0;">
                    ${weapon.classEmoji} ${weapon.weaponClass}
                </div>
                <div class="weapon-stats compact">
                    <span title="Level: ${weapon.level}">⭐${weapon.level}</span>
                    ${weapon.weaponClass === 'Shield' ? 
                        `<span title="Shield Points: ${weapon.shieldPoints}">🛡️${weapon.shieldPoints}</span>` :
                        `<span title="Skade: ${weapon.damage}">💥${weapon.damage}</span>`
                    }
                    <span title="Præcision: ${weapon.accuracy}%">🎯${weapon.accuracy}%</span>
                    <span title="Rækkevidde: ${weapon.range}m">📏${weapon.range}m</span>
                </div>
                <div class="received-info">
                    <small>📷 Modtaget fra QR kode - kan ikke deles igen</small>
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

    updateWeaponDisplay(weapons, selectedClass = 'all') {
        const weaponList = document.getElementById('weapon-list');
        
        if (!weapons || weapons.length === 0) {
            weaponList.innerHTML = '<p class="empty-state">Ingen våben endnu. Generer noget loot!</p>';
            return;
        }

        // Filter weapons by class
        let filteredWeapons = weapons;
        if (selectedClass !== 'all') {
            filteredWeapons = weapons.filter(weapon => weapon.weaponClass === selectedClass);
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

        weaponList.innerHTML = sortedWeapons.map(weapon => this.createWeaponCard(weapon)).join('');
        
        // Update equipped weapon display on character tab
        this.updateEquippedWeaponDisplay(weapons);
    }

    updateEquippedWeaponDisplay(weapons) {
        const equippedWeaponDisplay = document.getElementById('equipped-weapon-display');
        if (!equippedWeaponDisplay) return;

        // Find the equipped weapon (non-shield) and shield
        const equippedWeapon = weapons.find(w => w.equipped && w.weaponClass !== 'Shield');
        const equippedShield = weapons.find(w => w.equipped && w.weaponClass === 'Shield');
        
        let html = '<div class="equipped-items-grid">';
        
        // Weapon slot
        if (equippedWeapon) {
            const rarityColor = equippedWeapon.rarity.color;
            html += `
                <div class="equipped-item-card weapon" onclick="characterManager.unequipWeapon(${equippedWeapon.id})" title="Klik for at unequip våben" style="background: linear-gradient(135deg, ${rarityColor} 0%, ${this.darkenColor(rarityColor, 20)} 100%);">
                    <div class="equipped-item-header">
                        <span class="equipped-item-level">⭐${equippedWeapon.level}</span>
                        <span class="equipped-item-icon">${equippedWeapon.image}</span>
                        <span class="equipped-item-type">⚔️ Våben</span>
                    </div>
                    <div class="equipped-item-name">${equippedWeapon.name}</div>
                    <div class="equipped-item-stats">
                        <span>💥${equippedWeapon.damage}</span>
                        <span>🎯${equippedWeapon.accuracy}%</span>
                        <span>📏${equippedWeapon.range}m</span>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="equipped-item-card empty">
                    <div class="equipped-item-header">
                        <span class="equipped-item-icon">⚔️</span>
                        <span class="equipped-item-type">Våben</span>
                    </div>
                    <div class="equipped-item-empty">Intet våben equipped</div>
                </div>
            `;
        }
        
        // Shield slot
        if (equippedShield) {
            const rarityColor = equippedShield.rarity.color;
            html += `
                <div class="equipped-item-card shield" onclick="characterManager.unequipWeapon(${equippedShield.id})" title="Klik for at unequip shield" style="background: linear-gradient(135deg, ${rarityColor} 0%, ${this.darkenColor(rarityColor, 20)} 100%);">
                    <div class="equipped-item-header">
                        <span class="equipped-item-level">⭐${equippedShield.level}</span>
                        <span class="equipped-item-icon">${equippedShield.image}</span>
                        <span class="equipped-item-type">🛡️ Shield</span>
                    </div>
                    <div class="equipped-item-name">${equippedShield.name}</div>
                    <div class="equipped-item-stats">
                        <span>🛡️${equippedShield.shieldPoints}</span>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="equipped-item-card empty">
                    <div class="equipped-item-header">
                        <span class="equipped-item-icon">🛡️</span>
                        <span class="equipped-item-type">Shield</span>
                    </div>
                    <div class="equipped-item-empty">Intet shield equipped</div>
                </div>
            `;
        }
        
        html += '</div>';
        equippedWeaponDisplay.innerHTML = html;
    }

    createWeaponCard(weapon) {
        const currentLevel = parseInt(document.getElementById('character-level')?.value) || 1;
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
                    ${weapon.weaponClass === 'Shield' ? 
                        `<span title="Shield Points: ${weapon.shieldPoints}">🛡️${weapon.shieldPoints}</span>` :
                        `<span title="Skade: ${weapon.damage}">💥${weapon.damage}</span>`
                    }
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
    }

    updateHealthBar(currentHP, maxHP) {
        const healthBar = document.getElementById('health-bar-visual');
        if (healthBar) {
            const percentage = Math.max(0, (currentHP / maxHP) * 100);
            healthBar.style.width = `${percentage}%`;
            
            // Set color based on health percentage
            if (percentage > 60) {
                healthBar.style.backgroundColor = '#28a745'; // Green
            } else if (percentage > 30) {
                healthBar.style.backgroundColor = '#ffc107'; // Yellow
            } else {
                healthBar.style.backgroundColor = '#dc3545'; // Red
            }
        }
    }

    updateShieldBar(currentShield, maxShield) {
        const shieldBar = document.getElementById('shield-bar-visual');
        if (shieldBar) {
            const percentage = maxShield > 0 ? Math.max(0, (currentShield / maxShield) * 100) : 0;
            shieldBar.style.width = `${percentage}%`;
        }
    }

    updateSlotCounter(currentSlots, maxSlots) {
        const slotCounter = document.getElementById('slot-counter');
        if (slotCounter) {
            slotCounter.textContent = `📦 Slots: ${currentSlots}/${maxSlots}`;
        }
    }

    displayDiceResult(result) {
        const diceResultEl = document.getElementById('dice-result');
        if (diceResultEl) {
            diceResultEl.innerHTML = `🎲 Du slog: <strong>${result}</strong>`;
            diceResultEl.style.display = 'block';
            
            // Hide after 5 seconds
            setTimeout(() => {
                diceResultEl.style.display = 'none';
            }, 5000);
        }
    }

    playDeathAnimation() {
        // Create death animation overlay
        const deathOverlay = document.createElement('div');
        deathOverlay.className = 'death-animation';
        deathOverlay.innerHTML = '💀';
        document.body.appendChild(deathOverlay);

        // Start animation
        setTimeout(() => {
            deathOverlay.classList.add('animate');
        }, 50);

        // Remove overlay after animation
        setTimeout(() => {
            deathOverlay.remove();
        }, 2000);
    }

    setupHelpTooltips() {
        // Help tooltips for mobile (click to toggle)
        document.querySelectorAll('.help-tooltip').forEach(tooltip => {
            tooltip.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Hide all other tooltips
                document.querySelectorAll('.help-tooltip').forEach(t => {
                    if (t !== tooltip) t.classList.remove('show-tooltip');
                });
                
                // Toggle this tooltip
                tooltip.classList.toggle('show-tooltip');
            });
        });
        
        // Hide tooltips when clicking elsewhere
        document.addEventListener('click', () => {
            document.querySelectorAll('.help-tooltip.show-tooltip').forEach(tooltip => {
                tooltip.classList.remove('show-tooltip');
            });
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
}