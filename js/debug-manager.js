/**
 * Debug Manager Module
 * Handles logging, error tracking, and debug information display
 */

class DebugManager {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // Limit to prevent memory issues
        this.logCount = 0;
        
        this.init();
    }

    init() {
        // Override console methods to capture logs
        this.overrideConsole();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize debug counter
        this.updateCounter();
        
        this.log('Debug Manager initialized', 'info');
    }

    overrideConsole() {
        // Store original console methods
        this.originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };

        // Override console methods
        console.log = (...args) => {
            this.originalConsole.log(...args);
            this.addLog(this.formatArgs(args), 'info');
        };

        console.error = (...args) => {
            this.originalConsole.error(...args);
            this.addLog(this.formatArgs(args), 'error');
        };

        console.warn = (...args) => {
            this.originalConsole.warn(...args);
            this.addLog(this.formatArgs(args), 'warning');
        };

        console.info = (...args) => {
            this.originalConsole.info(...args);
            this.addLog(this.formatArgs(args), 'info');
        };
    }

    formatArgs(args) {
        return args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
    }

    addLog(message, type = 'info', includeStack = false) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            message,
            type,
            id: this.logCount++
        };

        // Add stack trace for errors
        if (includeStack && (type === 'error' || type === 'warning')) {
            try {
                const stack = new Error().stack;
                logEntry.stack = stack;
            } catch (e) {
                // Ignore stack trace errors
            }
        }

        this.logs.push(logEntry);

        // Remove old logs if we exceed the limit
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Update the UI if the debug tab is visible
        this.updateDebugDisplay();
        this.updateCounter();
    }

    log(message, type = 'info') {
        this.addLog(message, type, true);
    }

    error(message, error = null) {
        let fullMessage = message;
        if (error) {
            fullMessage += ` | Error: ${error.message || error}`;
            if (error.stack) {
                fullMessage += `\nStack: ${error.stack}`;
            }
        }
        this.addLog(fullMessage, 'error', true);
    }

    warn(message) {
        this.addLog(message, 'warning', true);
    }

    success(message) {
        this.addLog(message, 'success');
    }

    updateDebugDisplay() {
        const debugLog = document.getElementById('debug-log');
        if (!debugLog) return;

        // Only update if debug tab is visible (performance optimization)
        const debugTab = document.getElementById('tab-debug');
        if (!debugTab || !debugTab.classList.contains('active')) return;

        // Get last 50 logs for display
        const recentLogs = this.logs.slice(-50);
        
        debugLog.innerHTML = recentLogs.map(log => 
            `<p class="debug-entry ${log.type}">
                <span class="timestamp">[${log.timestamp}]</span> 
                ${this.escapeHtml(log.message)}
            </p>`
        ).join('');

        // Auto-scroll to bottom
        debugLog.scrollTop = debugLog.scrollHeight;
    }

    updateCounter() {
        const counterEl = document.getElementById('debug-count');
        if (counterEl) {
            counterEl.textContent = this.logs.length;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearLog() {
        this.logs = [];
        this.logCount = 0;
        this.updateDebugDisplay();
        this.updateCounter();
        this.log('Debug log cleared', 'info');
    }

    exportLog() {
        const logText = this.logs.map(log => 
            `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
        ).join('\n');

        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(logText).then(() => {
                this.success('Debug log copied to clipboard');
            }).catch(() => {
                this.fallbackCopyToClipboard(logText);
            });
        } else {
            this.fallbackCopyToClipboard(logText);
        }
    }

    fallbackCopyToClipboard(text) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.success('Debug log copied to clipboard (fallback)');
        } catch (err) {
            this.error('Failed to copy debug log', err);
        }
        
        document.body.removeChild(textArea);
    }

    setupEventListeners() {
        // Clear log button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'clear-debug-log') {
                this.clearLog();
            } else if (e.target.id === 'export-debug-log') {
                this.exportLog();
            }
        });

        // Update display when debug tab becomes active
        document.addEventListener('click', (e) => {
            if (e.target.dataset.tab === 'debug') {
                setTimeout(() => this.updateDebugDisplay(), 100);
            }
        });

        // Global error handler
        window.addEventListener('error', (event) => {
            this.error(`Uncaught Error: ${event.message}`, {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.error(`Unhandled Promise Rejection: ${event.reason}`, event.reason);
        });
    }

    // Enhanced message display that also logs to debug
    showMessage(message, type = 'info', duration = 3000) {
        // Log to debug
        this.log(`UI Message: ${message}`, type);

        // Show UI message (existing functionality)
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

    // Get system info for debugging
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
            },
            localStorage: {
                available: typeof(Storage) !== "undefined",
                used: this.getLocalStorageSize()
            },
            appVersion: window.appVersion?.version || 'unknown'
        };
    }

    getLocalStorageSize() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length;
                }
            }
            return `${Math.round(total / 1024)} KB`;
        } catch (e) {
            return 'unavailable';
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugManager;
} else {
    window.DebugManager = DebugManager;
}