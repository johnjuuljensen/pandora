/**
 * Main Application Entry Point
 * Initializes the application and loads version info
 */

// Global character manager instance
let characterManager;

// Initialize the application when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load version info
        await loadVersionInfo();
        
        // Initialize character manager
        characterManager = new CharacterManager();
        
        // Make it globally available for onclick handlers
        window.characterManager = characterManager;
        
        console.log('Pandora RPG application initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show fallback error message
        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10000;
            text-align: center;
            max-width: 400px;
        `;
        messageEl.innerHTML = `
            <h3>⚠️ Initialiserings Fejl</h3>
            <p>Kunne ikke starte applikationen. Prøv at genindlæse siden.</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #dc3545;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                margin-top: 10px;
                cursor: pointer;
            ">Genindlæs</button>
        `;
        document.body.appendChild(messageEl);
    }
});

// Load version information
async function loadVersionInfo() {
    try {
        const response = await fetch('./version.json');
        const versionData = await response.json();
        
        // Update version number
        const versionElement = document.getElementById('app-version');
        if (versionElement) {
            versionElement.textContent = versionData.version;
        }
        
        // Update build date (use today's date as actual build date)
        const buildDateElement = document.getElementById('build-date');
        if (buildDateElement) {
            const today = new Date();
            const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            buildDateElement.textContent = dateString;
        }
        
        // Store version info for potential use
        window.appVersion = versionData;
        
    } catch (error) {
        console.log('Could not load version info, using defaults');
        // Fallback to current date if version.json fails to load
        const buildDateElement = document.getElementById('build-date');
        if (buildDateElement) {
            const today = new Date();
            const dateString = today.toISOString().split('T')[0];
            buildDateElement.textContent = dateString;
        }
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // Show user-friendly error message
    if (window.characterManager && window.characterManager.uiManager) {
        window.characterManager.uiManager.showMessage('Der opstod en fejl. Prøv at genindlæse siden hvis problemet fortsætter.');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser behavior
    event.preventDefault();
    
    // Show user-friendly error message
    if (window.characterManager && window.characterManager.uiManager) {
        window.characterManager.uiManager.showMessage('Der opstod en netværksfejl. Tjek din forbindelse.');
    }
});