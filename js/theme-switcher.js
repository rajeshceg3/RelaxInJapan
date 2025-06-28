// js/theme-switcher.js
// ASSUMPTION: seasonal-engine.js and gallery.js are loaded before this script,
// making their relevant functions (e.g., window.registerSeasonalCallbacks, window.setSeasonalCategoryFilter) globally available.

document.addEventListener('DOMContentLoaded', () => {
    const themeSelectorButtons = document.querySelectorAll('.theme-selector-btn');
    const bodyElement = document.body;
    const previewWidget = document.querySelector('.preview-widget-example');
    const previewText = previewWidget ? previewWidget.querySelector('.preview-text') : null;
    const previewButtonPrimary = previewWidget ? previewWidget.querySelector('.preview-button-primary') : null;
    const previewButtonSecondary = previewWidget ? previewWidget.querySelector('.preview-button-secondary') : null;

    const seasonalAutomationToggle = document.getElementById('seasonal-automation-toggle');

    const THEME_STORAGE_KEY = 'selectedDashboardTheme';

    // Main function to apply a theme
    function applyTheme(themeName) {
        // Remove any existing theme classes from the body
        bodyElement.className = bodyElement.className.replace(/theme-\S+/g, '');

        if (themeName !== 'default') {
            bodyElement.classList.add(`theme-${themeName}`);
        }

        // Update aria-pressed state for buttons
        themeSelectorButtons.forEach(button => {
            button.setAttribute('aria-pressed', button.dataset.theme === themeName ? 'true' : 'false');
        });

        // Update preview area
        if (previewWidget) {
            previewWidget.className = previewWidget.className.replace(/theme-\S+/g, '');
            if (themeName !== 'default') {
                previewWidget.classList.add(`theme-${themeName}`);
            }
            updatePreviewStyles(themeName);
        }

        // Only save to localStorage if seasonal automation is not enabled.
        // window.seasonalAutomationEnabled is managed by seasonal-engine.js
        if (typeof window.seasonalAutomationEnabled === 'undefined' || !window.seasonalAutomationEnabled) {
            localStorage.setItem(THEME_STORAGE_KEY, themeName);
        }
    }

    // Function to update preview styles
    function updatePreviewStyles(themeName) {
        if (!previewText || !previewButtonPrimary || !previewButtonSecondary) return;

        const originalBodyClass = bodyElement.className;
        bodyElement.className = '';
        if (themeName !== 'default') {
            bodyElement.classList.add(`theme-${themeName}`);
        }

        const computedStyle = getComputedStyle(bodyElement);

        previewWidget.style.backgroundColor = computedStyle.getPropertyValue('--current-widget-bg-color').trim() || computedStyle.getPropertyValue('--color-primary-warm-white-2').trim();
        previewWidget.style.borderColor = computedStyle.getPropertyValue('--current-border-color').trim() || computedStyle.getPropertyValue('--color-secondary-zen-grey').trim();
        previewText.style.color = computedStyle.getPropertyValue('--current-text-color').trim() || computedStyle.getPropertyValue('--color-text-deep-charcoal').trim();

        const primaryAccent = computedStyle.getPropertyValue('--current-accent-color').trim() || computedStyle.getPropertyValue('--color-secondary-bamboo-green').trim();
        previewButtonPrimary.style.backgroundColor = primaryAccent;
        previewButtonPrimary.style.borderColor = primaryAccent;
        previewButtonPrimary.style.color = computedStyle.getPropertyValue('--color-primary-warm-white-1').trim();

        previewButtonSecondary.style.backgroundColor = computedStyle.getPropertyValue('--current-widget-bg-color').trim() || computedStyle.getPropertyValue('--color-secondary-zen-grey').trim();
        previewButtonSecondary.style.borderColor = computedStyle.getPropertyValue('--current-border-color').trim() || computedStyle.getPropertyValue('--color-secondary-zen-grey').trim();
        previewButtonSecondary.style.color = computedStyle.getPropertyValue('--current-text-color').trim() || computedStyle.getPropertyValue('--color-text-deep-charcoal').trim();

        bodyElement.className = originalBodyClass;
         if (themeName === 'default' && !bodyElement.className.includes('theme-')) {
        } else if (themeName !=='default' && !bodyElement.classList.contains(`theme-${themeName}`)){
            bodyElement.classList.add(`theme-${themeName}`);
        }
    }

    // Add event listeners to theme selector buttons
    themeSelectorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const themeName = button.dataset.theme;
            // If user manually selects a theme, disable seasonal automation.
            if (seasonalAutomationToggle && window.seasonalAutomationEnabled && typeof window.setSeasonalAutomation === 'function') {
                seasonalAutomationToggle.checked = false;
                window.setSeasonalAutomation(false);
                console.log("Seasonal automation disabled due to manual theme selection.");
            }
            applyTheme(themeName);
        });
    });

    // --- Seasonal Automation Integration ---
    // Check if seasonal engine and gallery functions are available
    if (typeof window.registerSeasonalCallbacks === 'function' &&
        typeof window.setSeasonalAutomation === 'function' &&
        typeof window.applySeasonalLogic === 'function' &&
        typeof window.initializeSeasonalSettings === 'function') {

        // Register callbacks with the seasonal engine
        // Ensure setSeasonalCategoryFilter from gallery.js is available globally or pass it correctly
        const galleryFilterFunc = typeof window.setSeasonalCategoryFilter === 'function' ? window.setSeasonalCategoryFilter : null;
        if (!galleryFilterFunc) {
            console.warn("setSeasonalCategoryFilter not found on window. Seasonal gallery filter will not be applied by automation.");
        }
        window.registerSeasonalCallbacks(applyTheme, galleryFilterFunc);

        // Seasonal engine's initializeSeasonalSettings will load automation and hemisphere states.
        // It also sets up hemisphere radio button listeners.
        // We still need to set up the automation toggle listener here in theme-switcher.

        if (seasonalAutomationToggle) {
            seasonalAutomationToggle.checked = window.seasonalAutomationEnabled; // Set checkbox state

            seasonalAutomationToggle.addEventListener('change', () => {
                window.setSeasonalAutomation(seasonalAutomationToggle.checked);
                // applySeasonalLogic is called within setSeasonalAutomation if it's enabled.
                // If disabled, revert to manual/default theme.
                if (!window.seasonalAutomationEnabled) {
                    const lastManuallySavedTheme = localStorage.getItem(THEME_STORAGE_KEY);
                    applyTheme(lastManuallySavedTheme || 'default');
                }
            });
        } else {
            console.warn("#seasonal-automation-toggle checkbox not found.");
        }

        // Initial theme application based on settings
        // Seasonal engine's initializeSeasonalSettings handles loading prefs.
        // If automation is enabled, applySeasonalLogic should be called.
        if (window.seasonalAutomationEnabled) {
            window.applySeasonalLogic(); // Call with no args, uses registered callbacks
        } else {
            const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            applyTheme(savedTheme || 'default');
        }
    }
});
