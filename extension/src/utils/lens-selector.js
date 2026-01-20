/**
 * Lens Selection Logic
 */
const LensSelector = {
    /**
     * Select a random lens respecting anti-repeat rules
     * @param {Array} allLenses - Array of lens objects
     * @param {Array} recentLensIds - Array of recently seen lens IDs
     * @param {Number} n - Anti-repeat count
     * @param {String} currentLensId - The ID currently displayed (to avoid immediate refresh repeat)
     * @returns {Object} Selected lens
     */
    selectNextLens(allLenses, recentLensIds, n, currentLensId = null) {
        if (!allLenses || allLenses.length === 0) return null;

        // Filter out recent IDs
        // "Avoid repeating any of the last N shown cards."
        let availableLenses = allLenses.filter(lens => !recentLensIds.includes(lens.id));

        // Also avoid the *currently* displayed lens if user clicks "New Lens" (unless it's the only one)
        if (currentLensId) {
            availableLenses = availableLenses.filter(lens => lens.id !== currentLensId);
        }

        // "If deck < N+1, fall back to random without strict avoidance"
        // Actually the logic implies if available pool is empty or too small?
        // Let's safe guard: if available is empty, fall back to all (minus current).
        if (availableLenses.length === 0) {
            availableLenses = allLenses.filter(lens => lens.id !== currentLensId);
            // If still empty (e.g. only 1 lens total), use all
            if (availableLenses.length === 0) availableLenses = allLenses;
        }

        // Random selection
        const randomIndex = Math.floor(Math.random() * availableLenses.length);
        return availableLenses[randomIndex];
    },

    // Placeholder for input-aware selection (optional 4.2)
    // We can implement basic keyword matching if we have time, but sticking to MVP first.
};

export default LensSelector;
