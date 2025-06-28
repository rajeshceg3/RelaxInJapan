document.addEventListener('DOMContentLoaded', () => {
    const inspirationWidget = {
        elements: {
            widgetContainer: document.getElementById('daily-inspiration-widget'),
            typeIndicator: document.getElementById('inspiration-type-indicator'),
            japaneseText: document.getElementById('inspiration-japanese-text'),
            romajiText: document.getElementById('inspiration-romaji-text'),
            englishText: document.getElementById('inspiration-english-text'),
            explanationText: document.getElementById('inspiration-explanation'),
            sourceText: document.getElementById('inspiration-source'),
            // ADDED:
            languageToggle: document.getElementById('language-toggle'),
            romajiToggle: document.getElementById('romaji-toggle'),
        },
        content: [],
        currentContent: null,
        // ADDED:
        languageMode: 'dual', // Default: 'dual', 'jp_primary', 'en_primary'
        showRomaji: true,     // Default: true

        async init() {
            if (!this.elements.widgetContainer) {
                console.error('Daily Inspiration widget container not found.');
                return;
            }

            // ADDED: Load preferences
            this.loadPreferences();

            await this.loadContent();
            if (this.content.length > 0) {
                this.selectDailyContent();
                this.displayContent(); // This will now also apply visibility rules
                this.scheduleDailyUpdate();
            } else {
                this.showError('No content loaded.');
            }

            // ADDED: Event listeners for toggles
            if (this.elements.languageToggle) {
                this.elements.languageToggle.addEventListener('change', (e) => {
                    this.languageMode = e.target.value;
                    this.savePreferences();
                    this.applyTextVisibility();
                });
            }
            if (this.elements.romajiToggle) {
                this.elements.romajiToggle.addEventListener('change', (e) => {
                    this.showRomaji = e.target.checked;
                    this.savePreferences();
                    this.applyTextVisibility();
                });
            }
        },

        // ADDED: Load preferences from localStorage
        loadPreferences() {
            const savedMode = localStorage.getItem('inspirationLanguageMode');
            if (savedMode) {
                this.languageMode = savedMode;
                if (this.elements.languageToggle) this.elements.languageToggle.value = savedMode;
            }
            const savedRomaji = localStorage.getItem('inspirationShowRomaji');
            if (savedRomaji !== null) { // Check for null as 'false' is a valid string
                this.showRomaji = savedRomaji === 'true';
                if (this.elements.romajiToggle) this.elements.romajiToggle.checked = this.showRomaji;
            }
        },

        // ADDED: Save preferences to localStorage
        savePreferences() {
            localStorage.setItem('inspirationLanguageMode', this.languageMode);
            localStorage.setItem('inspirationShowRomaji', this.showRomaji);
        },

        async loadContent() {
            // ... (existing loadContent method remains the same)
            try {
                const response = await fetch('js/inspiration_content.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this.content = await response.json();
            } catch (error) {
                console.error('Error loading inspiration content:', error);
                this.showError('Could not load content.');
                this.content = [];
            }
        },

        selectDailyContent(targetSeason = null) {
            if (!this.content || this.content.length === 0) {
                this.currentContent = null;
                return;
            }

            let seasonToFilterBy = targetSeason;

            if (!seasonToFilterBy) { // If no targetSeason provided, get current actual season
                if (typeof window.getCurrentSeason === 'function' && typeof window.selectedHemisphere !== 'undefined') {
                    try {
                        seasonToFilterBy = window.getCurrentSeason(window.selectedHemisphere);
                        console.log("Daily Inspiration: Fetched current season for content - ", seasonToFilterBy);
                    } catch (e) {
                        console.error("Error getting current season for inspiration content:", e);
                    }
                } else {
                    console.warn("Seasonal functions (getCurrentSeason or selectedHemisphere) not available for daily inspiration. Using all content.");
                }
            } else {
                console.log("Daily Inspiration: Using target season for content - ", targetSeason);
            }

            let applicableContent = this.content; // Default to all content

            if (seasonToFilterBy) {
                const seasonalAndGeneralContent = this.content.filter(item => {
                    const itemSeason = item.season ? item.season.toLowerCase() : null;
                    const itemSeasonTags = Array.isArray(item.season_tags) ? item.season_tags.map(t => t.toLowerCase()) : [];

                    const isGeneral = !itemSeason && itemSeasonTags.length === 0; // Truly general if no season info
                    const isGeneralViaTag = itemSeasonTags.includes("general");
                    const isSeasonalMatch = itemSeason === seasonToFilterBy.toLowerCase();
                    const hasMatchingSeasonTag = itemSeasonTags.includes(seasonToFilterBy.toLowerCase());

                    return isGeneral || isGeneralViaTag || isSeasonalMatch || hasMatchingSeasonTag;
                });

                if (seasonalAndGeneralContent.length > 0) {
                    applicableContent = seasonalAndGeneralContent;
                    console.log(`Daily Inspiration: Using ${applicableContent.length} items for season '${seasonToFilterBy}'.`);
                } else {
                    console.log(`Daily Inspiration: No specific or general content for season '${seasonToFilterBy}', falling back to all ${this.content.length} items.`);
                    // Fallback to all content is already default (applicableContent = this.content)
                }
            }

            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 0);
            const diff = now - startOfYear;
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);

            if (applicableContent.length > 0) {
                const contentIndex = (dayOfYear - 1 + applicableContent.length) % applicableContent.length; // Ensure positive index
                this.currentContent = applicableContent[contentIndex];
            } else {
                this.currentContent = null;
            }
        },

        refreshContentForSeason(targetSeason = null) {
            console.log(`Daily Inspiration: Refreshing content. Target season: ${targetSeason || 'current actual'}`);
            this.selectDailyContent(targetSeason);
            this.displayContent();
        },

        displayContent() {
            if (!this.currentContent) {
                if (!this.elements.widgetContainer.classList.contains('error-state')) {
                     this.showError('No content selected for today.');
                }
                return;
            }
            this.clearError();
            const { type, japanese_text, romaji, english_text, explanation, source } = this.currentContent;

            if (this.elements.typeIndicator) {
                let typeLabel = type.replace('_', ' ');
                typeLabel = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
                this.elements.typeIndicator.textContent = `Type: ${typeLabel}`;
            }
            // Set text content first
            if (this.elements.japaneseText) this.elements.japaneseText.textContent = japanese_text || '';
            if (this.elements.romajiText) this.elements.romajiText.textContent = romaji || '';
            if (this.elements.englishText) this.elements.englishText.textContent = english_text || '';

            if (this.elements.explanationText) {
                this.elements.explanationText.textContent = explanation || '';
                this.elements.explanationText.style.display = explanation ? 'block' : 'none'; // Keep this logic
            }
            if (this.elements.sourceText) {
                this.elements.sourceText.textContent = source ? `Source: ${source}` : '';
                this.elements.sourceText.style.display = source ? 'block' : 'none'; // Keep this logic
            }
            // THEN apply visibility rules
            this.applyTextVisibility();
        },

        // ADDED: Apply text visibility based on mode and romaji preference
        applyTextVisibility() {
            if (!this.elements.japaneseText || !this.elements.romajiText || !this.elements.englishText) {
                return; // Elements not found
            }

            const jpVisible = (this.languageMode === 'dual' || this.languageMode === 'jp_primary');
            const enVisible = (this.languageMode === 'dual' || this.languageMode === 'en_primary');
            const romajiVisible = this.showRomaji && (this.languageMode === 'dual' || this.languageMode === 'jp_primary') && this.elements.romajiText.textContent;

            this.elements.japaneseText.style.display = jpVisible ? 'block' : 'none';
            this.elements.englishText.style.display = enVisible ? 'block' : 'none';
            this.elements.romajiText.style.display = romajiVisible ? 'block' : 'none';

            // Adjust styles for primary modes (optional, can be enhanced with CSS classes)
            if (this.languageMode === 'jp_primary') {
                this.elements.japaneseText.style.fontWeight = 'bold'; // Example
                this.elements.englishText.style.fontWeight = 'normal';
            } else if (this.languageMode === 'en_primary') {
                this.elements.englishText.style.fontWeight = 'bold'; // Example
                this.elements.japaneseText.style.fontWeight = 'normal';
            } else { // dual
                this.elements.japaneseText.style.fontWeight = 'normal';
                this.elements.englishText.style.fontWeight = 'normal';
            }
        },

        showError(message) {
            // ... (existing showError method remains the same)
            if (this.elements.widgetContainer) this.elements.widgetContainer.classList.add('error-state');
            if (this.elements.japaneseText) this.elements.japaneseText.textContent = message;
            if (this.elements.typeIndicator) this.elements.typeIndicator.textContent = '';
            if (this.elements.romajiText) this.elements.romajiText.textContent = '';
            if (this.elements.englishText) this.elements.englishText.textContent = '';
            if (this.elements.explanationText) this.elements.explanationText.style.display = 'none';
            if (this.elements.sourceText) this.elements.sourceText.style.display = 'none';
        },

        clearError() {
            // ... (existing clearError method remains the same)
            if (this.elements.widgetContainer) this.elements.widgetContainer.classList.remove('error-state');
        },

        scheduleDailyUpdate() {
            // ... (existing scheduleDailyUpdate method remains the same)
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const msUntilMidnight = tomorrow - now;
            setTimeout(() => {
                this.selectDailyContent();
                this.displayContent();
                this.scheduleDailyUpdate();
            }, msUntilMidnight);
        }
    };

    inspirationWidget.init();
    window.dailyInspirationWidget = inspirationWidget;
});
