import Storage from '../utils/storage.js';
import LensSelector from '../utils/lens-selector.js';

class LensPopup {
    constructor() {
        this.data = null;
        this.currentLens = null;
        this.dom = {
            principle: document.getElementById('principle-display'),
            userInput: document.getElementById('user-input'),
            inputSection: document.getElementById('input-section'),
            btnReflect: document.getElementById('btn-reflect'),
            btnNew: document.getElementById('btn-new'),
            btnCopy: document.getElementById('btn-copy'),
            reflectContent: document.getElementById('reflect-content'),
            promptsList: document.getElementById('prompts-list'),
            counterText: document.getElementById('counter-text')
        };

        this.isReflectExpanded = false;
    }

    async init() {
        // Load Data
        try {
            const response = await fetch('../data/lenses.en.json');
            this.data = await response.json();
        } catch (e) {
            console.error("Failed to load lenses:", e);
            this.dom.principle.textContent = "Error loading content.";
            return;
        }

        // Load Settings & State
        const settings = await Storage.get(Storage.KEYS.SETTINGS);

        // Setup UI based on settings
        if (settings.showInput) {
            this.dom.inputSection.classList.remove('hidden');
            // Restore draft if any - optional, spec says "can clear on popup close if desired"
            // Let's keep it clean and empty on open for "clarity moment" unless user wants draft?
            // Spec says "draftInput: string (optional)" in storage.
            // Let's implement auto-save draft for niceness.
            const draft = await Storage.get(Storage.KEYS.DRAFT_INPUT);
            if (draft) this.dom.userInput.value = draft;
        }

        // Setup Event Listeners
        this.dom.btnNew.addEventListener('click', () => this.refreshLens());
        this.dom.btnReflect.addEventListener('click', () => this.toggleReflect());
        this.dom.btnCopy.addEventListener('click', () => this.copyContent());
        this.dom.userInput.addEventListener('input', (e) => this.handleInput(e));

        // Initial Load
        await this.refreshLens();
    }

    async refreshLens() {
        const settings = await Storage.get(Storage.KEYS.SETTINGS);
        const recentIds = await Storage.get(Storage.KEYS.RECENT_LENS_IDS);
        const currentId = this.currentLens ? this.currentLens.id : null;

        const nextLens = LensSelector.selectNextLens(
            this.data,
            recentIds,
            settings.antiRepeatN,
            currentId
        );

        if (nextLens) {
            this.currentLens = nextLens;
            await Storage.addRecentLensId(nextLens.id, settings.antiRepeatN);
            this.render();
        }
    }

    render() {
        if (!this.currentLens) return;

        // Animate principle change
        this.dom.principle.classList.remove('fade-in');
        void this.dom.principle.offsetWidth; // trigger reflow
        this.dom.principle.textContent = this.currentLens.principle;
        this.dom.principle.classList.add('fade-in');

        // Update prompts (hidden by default unless reflect is open)
        // Spec says: "New Lens replaces current card content."
        // Spec says Reflect default: collapsed.
        // So we should collapse on new lens?
        // "New Lens... Update recentLensIds." 
        // User experience: if I have Reflect open and click New Lens, should it stay open or close?
        // Usually safer to close to focus on the new principle first.
        if (this.isReflectExpanded) {
            this.toggleReflect(false);
        }

        // Prepare hidden content
        this.dom.promptsList.innerHTML = this.currentLens.prompts.map(p => `<li>${p}</li>`).join('');
        this.dom.counterText.textContent = this.currentLens.counter;
    }

    toggleReflect(forceState = null) {
        if (forceState !== null) {
            this.isReflectExpanded = forceState;
        } else {
            this.isReflectExpanded = !this.isReflectExpanded;
        }

        if (this.isReflectExpanded) {
            this.dom.reflectContent.classList.remove('hidden');
            this.dom.btnReflect.textContent = "Hide";
            // Scroll to bottom if needed?
        } else {
            this.dom.reflectContent.classList.add('hidden');
            this.dom.btnReflect.textContent = "Reflect";
        }
    }

    async handleInput(e) {
        // Persist draft
        await Storage.set(Storage.KEYS.DRAFT_INPUT, e.target.value);
    }

    async copyContent() {
        if (!this.currentLens) return;

        const text = `Lens — Perspective
Principle: ${this.currentLens.principle}

Reflect:
${this.currentLens.prompts.map(p => `- ${p}`).join('\n')}

Counter:
- ${this.currentLens.counter}

(This tool offers perspectives, not decisions.)`;

        try {
            await navigator.clipboard.writeText(text);

            // Visual feedback
            const originalIcon = this.dom.btnCopy.innerHTML;
            // Checkmark icon
            this.dom.btnCopy.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => {
                this.dom.btnCopy.innerHTML = originalIcon;
            }, 2000);

        } catch (err) {
            console.error('Failed to copy', err);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const popup = new LensPopup();
    popup.init();
});
