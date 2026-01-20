/**
 * Storage wrapper for chrome.storage.local
 */
const Storage = {
    // Keys
    KEYS: {
        RECENT_LENS_IDS: 'recentLensIds',
        SETTINGS: 'settings',
        UI_STATE: 'uiState', // Optional, if we want to persist reflect state
        DRAFT_INPUT: 'draftInput'
    },

    // Defaults
    DEFAULTS: {
        recentLensIds: [],
        settings: {
            antiRepeatN: 7,
            showInput: true
        }
    },

    /**
     * Get a value by key, returning default if not set
     */
    async get(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                if (result[key] === undefined) {
                    if (key === this.KEYS.RECENT_LENS_IDS) resolve(this.DEFAULTS.recentLensIds);
                    else if (key === this.KEYS.SETTINGS) resolve(this.DEFAULTS.settings);
                    else resolve(null);
                } else {
                    resolve(result[key]);
                }
            });
        });
    },

    /**
     * Set a value by key
     */
    async set(key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, () => {
                resolve();
            });
        });
    },

    /**
     * Update recent lens IDs
     * Helper to manage the queue directly in storage
     */
    async addRecentLensId(id, antiRepeatN) {
        let recentIds = await this.get(this.KEYS.RECENT_LENS_IDS);

        // Remove if existing (shouldn't happen with proper logic but good for hygiene)
        // actually spec says "most recent first", simple queue

        // Add to front
        recentIds.unshift(id);

        // Truncate to N
        if (recentIds.length > antiRepeatN) {
            recentIds = recentIds.slice(0, antiRepeatN);
        }

        await this.set(this.KEYS.RECENT_LENS_IDS, recentIds);
    }
};

// Export for ES modules or global if not using modules (we are using vanilla imports in popup probably, or just script tags)
// Since we might keep it simple with script tags in HTML, we attach to window or just let it define const.
// For now, let's assume we'll use <script src="..."></script> which puts it in global scope, 
// or ES modules <script type="module">.
// Given "most ordinary" request, I will export it if I use type="module", otherwise just global.
// Let's use type="module" in popup.html effectively.
export default Storage;
