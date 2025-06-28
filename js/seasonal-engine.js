// js/seasonal-engine.js

const SEASONAL_AUTOMATION_ENABLED_KEY = 'seasonalAutomationEnabled';
const SEASONAL_HEMISPHERE_KEY = 'seasonalHemisphere';
const THEME_STORAGE_KEY_FOR_ORIGINAL = 'selectedDashboardTheme'; // From theme-switcher.js, used for saving original

window.seasonalAutomationEnabled = false;
window.selectedHemisphere = 'northern';

let _applyThemeCallback = null;
let _setGalleryFilterCallback = null;

// State for seasonal preview
let isPreviewingSeason = false;
let previewSeasonOffset = 0;
let originalUserTheme = null;
let originalGalleryCategory = null;
let originalSeasonalAutomationState = null;

// DOM elements for preview controls - cached in initializeSeasonalControls
let seasonalPreviewInfoEl, exitSeasonalPreviewBtnEl, prevSeasonBtnEl, nextSeasonBtnEl;

/**
 * Determines the season for a given date and hemisphere.
 * @param {Date} dateObject - The date for which to determine the season.
 * @param {string} hemisphere - 'northern' or 'southern'.
 * @returns {string} Current season: 'spring', 'summer', 'autumn', or 'winter'.
 */
function getSeasonForDate(dateObject, hemisphere) {
    const month = dateObject.getMonth() + 1; // 1-12
    const day = dateObject.getDate();

    if (hemisphere === 'northern') {
        if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day <= 20)) return 'spring';
        if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day <= 22)) return 'summer';
        if ((month === 9 && day >= 23) || month === 10 || month === 11 || (month === 12 && day <= 21)) return 'autumn';
        return 'winter';
    } else { // Southern Hemisphere
        if ((month === 9 && day >= 23) || month === 10 || month === 11 || (month === 12 && day <= 21)) return 'spring';
        if ((month === 12 && day >= 22) || month === 1 || month === 2 || (month === 3 && day <= 19)) return 'summer';
        if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day <= 20)) return 'autumn';
        return 'winter';
    }
}

function getSeasonByOffset(offset, baseDate = new Date(), hemisphere = window.selectedHemisphere) {
    const targetDate = new Date(baseDate);
    targetDate.setMonth(baseDate.getMonth() + (offset * 3));
    return getSeasonForDate(targetDate, hemisphere);
}

/**
 * Maps a season to a specific theme name.
 * @param {string} season - 'spring', 'summer', 'autumn', or 'winter'.
 * @returns {string} Corresponding theme name.
 */
function mapSeasonToTheme(season) {
    // This function remains the same
    switch (season) {
        case 'spring': return 'haru';
        case 'summer': return 'natsu';
        case 'autumn': return 'momiji';
        case 'winter': return 'yuki';
        default: return 'default';
    }
}

function registerSeasonalCallbacks(applyThemeFunc, setGalleryFilterFunc) {
    _applyThemeCallback = applyThemeFunc;
    _setGalleryFilterCallback = setGalleryFilterFunc;
}

function applyEffectsForSeason(seasonName, isPreview) {
    const themeName = mapSeasonToTheme(seasonName);
    if (typeof _applyThemeCallback === 'function') {
        _applyThemeCallback(themeName);
    } else {
        console.error("applyTheme callback not registered for applyEffectsForSeason.");
    }

    if (typeof _setGalleryFilterCallback === 'function') {
        // During preview, always set to 'seasons'. When exiting, originalGalleryCategory is used.
        _setGalleryFilterCallback(isPreview ? 'seasons' : (originalGalleryCategory || 'all'));
    } else {
        console.warn('setGalleryFilterCallback not registered for applyEffectsForSeason.');
    }

    if (window.dailyInspirationWidget && typeof window.dailyInspirationWidget.refreshContentForSeason === 'function') {
        window.dailyInspirationWidget.refreshContentForSeason(seasonName); // Pass season for specific content
    } else {
        console.warn("dailyInspirationWidget or refreshContentForSeason method not found during applyEffectsForSeason.");
    }

    if (seasonalPreviewInfoEl) {
        if (isPreview) {
            seasonalPreviewInfoEl.textContent = `Previewing: ${seasonName.charAt(0).toUpperCase() + seasonName.slice(1)}`;
            if(exitSeasonalPreviewBtnEl) exitSeasonalPreviewBtnEl.style.display = 'inline-block';
        } else {
            seasonalPreviewInfoEl.textContent = '';
            if(exitSeasonalPreviewBtnEl) exitSeasonalPreviewBtnEl.style.display = 'none';
        }
    }
}

function applySeasonalLogic() {
    let seasonToApply;
    let isCurrentlyPreviewing = isPreviewingSeason; // Capture current preview state for this application

    if (isCurrentlyPreviewing) {
        seasonToApply = getSeasonByOffset(previewSeasonOffset, new Date(), window.selectedHemisphere);
        console.log(`Previewing season: ${seasonToApply} (Offset: ${previewSeasonOffset})`);
    } else { // Applying actual current season based on automation or initial load
        if (!window.seasonalAutomationEnabled) {
            console.log("Seasonal automation is disabled and not in preview. No seasonal logic applied.");
            // If exiting preview and automation was off, theme should have been restored by handleExitPreview
            return;
        }
        seasonToApply = getSeasonForDate(new Date(), window.selectedHemisphere);
        console.log(`Applying actual season: ${seasonToApply} for hemisphere: ${window.selectedHemisphere}`);
    }

    applyEffectsForSeason(seasonToApply, isCurrentlyPreviewing);
}

function handleExitPreview() {
    if (!isPreviewingSeason) return;

    console.log("Exiting seasonal preview.");
    isPreviewingSeason = false;
    previewSeasonOffset = 0;

    if (typeof _applyThemeCallback === 'function') {
        _applyThemeCallback(originalUserTheme || 'default');
    }
    if (typeof _setGalleryFilterCallback === 'function') {
        _setGalleryFilterCallback(originalGalleryCategory || 'all');
    }
    if (window.dailyInspirationWidget && typeof window.dailyInspirationWidget.refreshContentForSeason === 'function') {
        // Refresh with no specific season to get current actual or general content
        window.dailyInspirationWidget.refreshContentForSeason();
    }

    if (seasonalPreviewInfoEl) seasonalPreviewInfoEl.textContent = '';
    if (exitSeasonalPreviewBtnEl) exitSeasonalPreviewBtnEl.style.display = 'none';

    // Restore original automation state *after* applying themes/filters
    if (originalSeasonalAutomationState) {
        // This will call setSeasonalAutomation(true) which in turn calls applySeasonalLogic for current season
        window.setSeasonalAutomation(true);
    } else {
        // If automation was originally off, ensure it's truly off and current (non-seasonal) logic applies
        window.setSeasonalAutomation(false);
        // Re-apply the originally selected theme if automation was off.
        // This is important if a manual theme was active.
        if (originalUserTheme && typeof _applyThemeCallback === 'function') {
             _applyThemeCallback(originalUserTheme);
        }
    }

    originalUserTheme = null;
    originalGalleryCategory = null;
    originalSeasonalAutomationState = null;
}

function setSeasonalAutomation(enabled) {
    if (isPreviewingSeason) {
        handleExitPreview();
    }
    window.seasonalAutomationEnabled = !!enabled;
    localStorage.setItem(SEASONAL_AUTOMATION_ENABLED_KEY, window.seasonalAutomationEnabled);
    console.log(`Seasonal automation ${window.seasonalAutomationEnabled ? 'enabled' : 'disabled'}.`);

    if (window.seasonalAutomationEnabled) {
        applySeasonalLogic();
    }
    // If disabled, theme reversion is handled by theme-switcher.js or if exiting preview.
}

function setSelectedHemisphere(hemisphere) {
    if (isPreviewingSeason) {
        handleExitPreview();
    }
    if (hemisphere === 'northern' || hemisphere === 'southern') {
        window.selectedHemisphere = hemisphere;
        localStorage.setItem(SEASONAL_HEMISPHERE_KEY, window.selectedHemisphere);
        console.log(`Hemisphere set to: ${window.selectedHemisphere}`);
        if (window.seasonalAutomationEnabled && !isPreviewingSeason) { // Don't auto-apply if exiting preview handled it
            applySeasonalLogic();
        }
    }
}

function initializeSeasonalControls() {
    // Cache DOM elements for preview controls
    seasonalPreviewInfoEl = document.getElementById('seasonal-preview-info');
    exitSeasonalPreviewBtnEl = document.getElementById('exit-seasonal-preview-btn');
    prevSeasonBtnEl = document.getElementById('preview-prev-season-btn');
    nextSeasonBtnEl = document.getElementById('preview-next-season-btn');

    if (prevSeasonBtnEl) {
        prevSeasonBtnEl.addEventListener('click', () => {
            if (!isPreviewingSeason) {
                originalUserTheme = localStorage.getItem(THEME_STORAGE_KEY_FOR_ORIGINAL) ||
                                    (document.body.className.match(/theme-\S+/)?.[0]) ||
                                    'default';
                originalGalleryCategory = window.imageGalleryState ? window.imageGalleryState.selectedCategory : 'all';
                originalSeasonalAutomationState = window.seasonalAutomationEnabled;
                isPreviewingSeason = true;
                // If automation was on, disable it temporarily for the preview without saving this "off" state as the preference
                if (originalSeasonalAutomationState) {
                    window.seasonalAutomationEnabled = false;
                }
            }
            previewSeasonOffset--;
            applySeasonalLogic();
        });
    }

    if (nextSeasonBtnEl) {
        nextSeasonBtnEl.addEventListener('click', () => {
            if (!isPreviewingSeason) {
                originalUserTheme = localStorage.getItem(THEME_STORAGE_KEY_FOR_ORIGINAL) ||
                                    (document.body.className.match(/theme-\S+/)?.[0]) ||
                                    'default';
                originalGalleryCategory = window.imageGalleryState ? window.imageGalleryState.selectedCategory : 'all';
                originalSeasonalAutomationState = window.seasonalAutomationEnabled;
                isPreviewingSeason = true;
                if (originalSeasonalAutomationState) {
                     window.seasonalAutomationEnabled = false;
                }
            }
            previewSeasonOffset++;
            applySeasonalLogic();
        });
    }

    if (exitSeasonalPreviewBtnEl) {
        exitSeasonalPreviewBtnEl.addEventListener('click', handleExitPreview);
    }
}


function initializeSeasonalSettings() {
    const savedAutomationState = localStorage.getItem(SEASONAL_AUTOMATION_ENABLED_KEY);
    window.seasonalAutomationEnabled = savedAutomationState === 'true';
    console.log(`Loaded seasonal automation setting: ${window.seasonalAutomationEnabled}`);

    const savedHemisphere = localStorage.getItem(SEASONAL_HEMISPHERE_KEY);
    window.selectedHemisphere = savedHemisphere || 'northern';
    console.log(`Loaded hemisphere setting: ${window.selectedHemisphere}`);

    const northernRadio = document.getElementById('hemisphere-northern');
    const southernRadio = document.getElementById('hemisphere-southern');
    if (northernRadio && southernRadio) {
        if (window.selectedHemisphere === 'northern') {
            northernRadio.checked = true;
        } else {
            southernRadio.checked = true;
        }

        northernRadio.addEventListener('change', () => setSelectedHemisphere('northern'));
        southernRadio.addEventListener('change', () => setSelectedHemisphere('southern'));
    } else {
        console.warn("Hemisphere radio buttons not found for event listeners.");
    }

    initializeSeasonalControls(); // Setup listeners for preview buttons
}


document.addEventListener('DOMContentLoaded', () => {
    initializeSeasonalSettings();
});

window.registerSeasonalCallbacks = registerSeasonalCallbacks;
window.applySeasonalLogic = applySeasonalLogic;
window.setSeasonalAutomation = setSeasonalAutomation;
// window.initializeSeasonalSettings is called on DOMContentLoaded from this script.

// Expose specific functions needed by other scripts
window.getSeasonForDate = getSeasonForDate; // Needed by layout-switcher if it calculates season for seasonal-flow
window.getSeasonSpecificLayoutClass = function(season) { // Exposed for layout-switcher
    switch (season) {
        case 'spring': return 'layout-sf-spring';
        case 'summer': return 'layout-sf-summer';
        case 'autumn': return 'layout-sf-autumn';
        case 'winter': return 'layout-sf-winter';
        default: return 'layout-sf-spring'; // Fallback, e.g. for spring
    }
};
