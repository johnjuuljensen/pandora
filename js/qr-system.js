/**
 * QR System Module
 * Handles weapon sharing via QR codes and camera scanning
 */

class QRSystem {
    constructor(weaponGenerator, uiManager) {
        this.weaponGenerator = weaponGenerator;
        this.uiManager = uiManager;
        this.currentScanner = null;
    }

    shareWeapon(weapon) {
        if (!weapon) {
            this.showMessage('Fejl: Våben ikke fundet');
            return;
        }

        // Create ultra-compact weapon data for QR code (Version 3 format)
        // Array format: [version, typeCode, rarityCode, damage, accuracy, range, level, shieldPoints]
        const weaponData = [
            3,  // Version 3
            this.weaponGenerator.getWeaponTypeCode(weapon.type),
            this.weaponGenerator.getRarityCode(weapon.rarity.name),
            weapon.damage,
            weapon.accuracy,
            weapon.range,
            weapon.level,
            weapon.shieldPoints || 0
        ];

        try {
            // Create QR code with lower error correction for more data capacity
            const qr = qrcode(0, 'M'); // Version 0 = auto, Error correction level L (lowest)
            const qrData = JSON.stringify(weaponData);
            console.log('QR Data:', qrData); // Debugging output
            qr.addData(qrData);
            qr.make();

            // Replace weapon display with QR code
            const display = document.getElementById('new-weapon-display');
            display.innerHTML = `
                <div class="qr-share-container">
                    <h3>📤 Del Våben</h3>
                    <p><strong>${weapon.name}</strong> er klar til deling!</p>
                    <div class="qr-code-container">
                        ${qr.createSvgTag({cellSize: 2, margin: 2, scalable: true})}
                    </div>
                    <p class="share-info">
                        Lad en anden spiller scanne denne QR kode med "📷 Modtag Våben" funktionen.
                        <br><strong>Våbnet er nu væk fra dit loot!</strong>
                    </p>
                    <button onclick="characterManager.finishSharing()" class="action-btn">✅ Færdig</button>
                </div>
            `;

            this.showMessage('QR kode genereret! Våben er klar til deling 📤');
            return true;

        } catch (error) {
            console.error('QR Generation error:', error);
            this.showMessage(`QR Generation fejl: ${error.message || error}`);
            return false;
        }
    }

    finishSharing() {
        document.getElementById('new-weapon-display').style.display = 'none';
        this.showMessage('Våben delt! Generer nyt loot når du er klar 🎲');
    }

    startQRScanner() {
        const scannerSection = document.getElementById('qr-scanner-section');
        const scannerContainer = document.getElementById('qr-scanner-container');
        
        // Hide other sections
        document.getElementById('new-weapon-display').style.display = 'none';
        document.getElementById('dice-result').style.display = 'none';
        
        // Show scanner section
        scannerSection.style.display = 'block';
        
        // Create video element for scanner
        scannerContainer.innerHTML = '<video id="qr-video" style="width: 100%; max-width: 400px; border-radius: 10px;"></video>';
        
        const video = document.getElementById('qr-video');
        
        // Initialize QR Scanner
        const scanner = new QrScanner(video, (result) => {
            try {
                const weaponData = JSON.parse(result.data);
                
                // Check if it's the new array format (version 3)
                if (Array.isArray(weaponData)) {
                    if (weaponData[0] !== 3) {
                        this.showMessage(`Unsupported QR version: ${weaponData[0]}. This app only supports version 3.`);
                        return;
                    }
                    this.receiveWeaponV3(weaponData);
                } else {
                    // Legacy object format - show deprecation message
                    this.showMessage('Legacy QR format detected. Please generate a new QR code.');
                    return;
                }
                
                this.stopQRScanner();
            } catch (error) {
                console.error(`QR decode error: ${result.data}`);
                console.error('QR decode error:', result, error);
                this.showMessage('Ugyldig QR kode. Prøv igen.');
            }
        }, {
            highlightScanRegion: true,
            highlightCodeOutline: true,
        });

        scanner.start().then(() => {
            this.currentScanner = scanner;
            this.showMessage('Kamera startet! Ret det mod QR koden 📷');
        }).catch(error => {
            console.error('Camera error:', error);
            this.showMessage('Kunne ikke få adgang til kamera. Tjek tilladelser.');
            this.stopQRScanner();
        });
    }

    stopQRScanner() {
        if (this.currentScanner) {
            this.currentScanner.stop();
            this.currentScanner.destroy();
            this.currentScanner = null;
        }
        
        document.getElementById('qr-scanner-section').style.display = 'none';
        this.showMessage('Scanner stoppet');
    }

    receiveWeaponV3(weaponData) {
        try {
            // Destructure array format: [version, typeCode, rarityCode, damage, accuracy, range, level, shieldPoints]
            const [version, typeCode, rarityCode, damage, accuracy, range, level, shieldPoints] = weaponData;
            
            // Reconstruct weapon from compact data
            const weaponType = this.weaponGenerator.getWeaponTypeFromCode(typeCode);
            const weaponClass = this.weaponGenerator.getWeaponClassFromTypeCode(typeCode);
            const rarityName = this.weaponGenerator.getRarityFromCode(rarityCode);
            
            // Reconstruct weapon name from rarity + type
            const weaponName = `${rarityName} ${weaponType}`;
            
            const weapon = {
                id: Date.now(),
                name: weaponName,
                type: weaponType,
                weaponClass: weaponClass,
                damage: damage,
                accuracy: accuracy,
                range: range,
                level: level,
                shieldPoints: shieldPoints || 0,
                rarity: this.weaponGenerator.getRarityByName(rarityName),
                image: this.weaponGenerator.getWeaponImageByClass(weaponClass),
                classEmoji: this.weaponGenerator.getClassEmojiByClass(weaponClass),
                classColor: this.weaponGenerator.getClassColorByClass(weaponClass),
                isReceived: true // Mark as received weapon (cannot be shared again)
            };

            // Set as current generated weapon so it can be added to inventory
            if (window.characterManager) {
                window.characterManager.currentGeneratedWeapon = weapon;
            }

            // Show received weapon using UI manager
            this.uiManager.displayReceivedWeapon(weapon);
            this.showMessage(`Våben modtaget! ${weapon.name} er nu tilgængeligt 📦`);

            return weapon;

        } catch (error) {
            console.error('Weapon reconstruction error:', error);
            this.showMessage(`Våben modtagelse fejl: ${error.message || error}`);
            return null;
        }
    }

    // Legacy method for backwards compatibility (deprecated)
    receiveWeapon(weaponData) {
        try {
            // Reconstruct weapon from QR data
            const weaponClass = this.weaponGenerator.getClassFromCode(weaponData.c);
            const rarityName = this.weaponGenerator.getRarityFromCode(weaponData.t);
            
            const weapon = {
                id: Date.now(),
                name: weaponData.n,
                weaponClass: weaponClass,
                damage: weaponData.d,
                accuracy: weaponData.a,
                range: weaponData.r,
                level: weaponData.l,
                shieldPoints: weaponData.s || 0,
                rarity: this.weaponGenerator.getRarityByName(rarityName),
                image: this.weaponGenerator.getWeaponImageByClass(weaponClass),
                classEmoji: this.weaponGenerator.getClassEmojiByClass(weaponClass),
                classColor: this.weaponGenerator.getClassColorByClass(weaponClass),
                isReceived: true // Mark as received weapon (cannot be shared again)
            };

            // Set as current generated weapon so it can be added to inventory
            if (window.characterManager) {
                window.characterManager.currentGeneratedWeapon = weapon;
            }

            // Show received weapon using UI manager
            this.uiManager.displayReceivedWeapon(weapon);
            this.showMessage(`Våben modtaget! ${weapon.name} er nu tilgængeligt 📦`);

            return weapon;

        } catch (error) {
            console.error('Weapon reconstruction error:', error);
            this.showMessage(`Våben modtagelse fejl: ${error.message || error}`);
            return null;
        }
    }

    showMessage(message) {
        // Delegate to character manager or UI manager
        if (window.characterManager && window.characterManager.showMessage) {
            window.characterManager.showMessage(message);
        } else {
            console.log(message);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRSystem;
} else {
    window.QRSystem = QRSystem;
}