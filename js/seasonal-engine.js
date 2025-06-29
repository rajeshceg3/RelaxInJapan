// js/seasonal-engine.js

const TRANSITION_DURATION_DAYS = 5;
const SEASON_BOUNDARIES = {
    northern: {
        spring: 79, // March 20
        summer: 172, // June 21
        autumn: 266, // September 23
        winter: 355 // December 22
    },
    southern: {
        spring: 266, // September 23
        summer: 355, // December 22
        autumn: 79,  // March 20
        winter: 172  // June 21
    }
};
const CSS_VARIABLES_TO_TRANSITION = [
    '--current-bg-color',
    '--current-text-color',
    '--current-accent-color',
    '--current-widget-bg-color',
    '--current-border-color',
    '--seasonal-filter-effect'
];
const themeCssVariableCache = {};

const SEASONAL_AUTOMATION_ENABLED_KEY = 'seasonalAutomationEnabled';
const SEASONAL_HEMISPHERE_KEY = 'seasonalHemisphere';
const THEME_STORAGE_KEY_FOR_ORIGINAL = 'selectedDashboardTheme'; // From theme-switcher.js, used for saving original

window.seasonalAutomationEnabled = false;
window.selectedHemisphere = 'northern';

let _applyThemeCallback = null;
let _setGalleryFilterCallback = null;
let _refreshInspirationCallback = null; // Added for gallery/inspiration refresh

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

// Helper function to get the day of the year (1-366)
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
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

function registerSeasonalCallbacks(applyThemeFunc, setGalleryFilterFunc, refreshInspirationFunc) { // Added refreshInspirationFunc
    _applyThemeCallback = applyThemeFunc;
    _setGalleryFilterCallback = setGalleryFilterFunc;
    _refreshInspirationCallback = refreshInspirationFunc; // Store the new callback
}

function getThemeCssVariables(themeName) {
    if (themeCssVariableCache[themeName]) {
        return themeCssVariableCache[themeName];
    }

    const tempDiv = document.createElement('div');
    tempDiv.className = `theme-${themeName}`; // e.g., theme-yuki
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px'; // Off-screen
    tempDiv.style.opacity = '0'; // Invisible
    document.body.appendChild(tempDiv);

    const computedStyle = getComputedStyle(tempDiv);
    const variables = {};

    CSS_VARIABLES_TO_TRANSITION.forEach(varName => {
        variables[varName] = computedStyle.getPropertyValue(varName).trim();
    });

    document.body.removeChild(tempDiv);
    themeCssVariableCache[themeName] = variables;
    return variables;
}

// Helper function to parse CSS color strings (rgb, rgba, hex)
function parseColor(colorString) {
    if (!colorString) return { r: 0, g: 0, b: 0, a: 0 }; // Handle undefined or empty string
    if (colorString.startsWith('rgba')) {
        const parts = colorString.substring(colorString.indexOf('(') + 1, colorString.lastIndexOf(')')).split(',');
        const [r, g, b, a] = parts.map(Number);
        return { r, g, b, a };
    } else if (colorString.startsWith('rgb')) {
        const parts = colorString.substring(colorString.indexOf('(') + 1, colorString.lastIndexOf(')')).split(',');
        const [r, g, b] = parts.map(Number);
        return { r, g, b, a: 1 };
    } else if (colorString.startsWith('#')) {
        let hex = colorString.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        if (hex.length === 6) {
            const bigint = parseInt(hex, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return { r, g, b, a: 1 };
        } else if (hex.length === 8) { // #RRGGBBAA
            const bigint = parseInt(hex, 16);
            const r = (bigint >> 24) & 255;
            const g = (bigint >> 16) & 255;
            const b = (bigint >> 8) & 255;
            const a = (bigint & 255) / 255;
            return { r, g, b, a };
        }
    }
    console.warn(`Could not parse color: ${colorString}. Returning transparent black.`);
    return { r: 0, g: 0, b: 0, a: 0 }; // Default if parsing fails
}

// Helper function to interpolate between two color objects
function interpolateColor(color1, color2, factor) {
    const c1 = color1 || { r: 0, g: 0, b: 0, a: 0 }; // Default to transparent if undefined
    const c2 = color2 || { r: 0, g: 0, b: 0, a: 0 }; // Default to transparent if undefined
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    const a = (c1.a === undefined ? 1 : c1.a) + ((c2.a === undefined ? 1 : c2.a) - (c1.a === undefined ? 1 : c1.a)) * factor;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

// Helper function to interpolate between two numbers
function interpolateNumber(num1, num2, factor) {
    return num1 + (num2 - num1) * factor;
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

    if (typeof _refreshInspirationCallback === 'function') {
        _refreshInspirationCallback(seasonName); // Pass season for specific content
    } else {
        console.warn("refreshInspirationCallback not registered for applyEffectsForSeason.");
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

    // applyEffectsForSeason(seasonToApply, isCurrentlyPreviewing); // Original call, will be replaced by new logic below

    if (isCurrentlyPreviewing) {
        // Preview logic remains largely the same: apply the target season directly without transition
        applyEffectsForSeason(seasonToApply, true);
        return;
    }

    // --- Start of new transition logic ---

    // If previewing, apply effects directly and skip transition logic
    if (isCurrentlyPreviewing) {
        applyEffectsForSeason(seasonToApply, true);
        // Ensure any CSS variables from a previous transition are cleared if we enter preview mode
        CSS_VARIABLES_TO_TRANSITION.forEach(varName => document.documentElement.style.removeProperty(varName));
        // Ensure body classes are reset/reapplied correctly for the previewed theme
        if (typeof _applyThemeCallback === 'function') {
            _applyThemeCallback(mapSeasonToTheme(seasonToApply));
        }
        return;
    }

    if (!window.seasonalAutomationEnabled) {
        console.log("Seasonal automation is disabled. No seasonal logic applied.");
        clearInterpolatedStyles(); // Ensure any lingering transition styles are removed
        // The theme-switcher.js or handleExitPreview should manage restoring the correct theme
        return;
    }

    const currentDate = new Date();
    const dayOfYear = getDayOfYear(currentDate);
    const hemisphere = window.selectedHemisphere;
    const boundaries = SEASON_BOUNDARIES[hemisphere];

    let currentSeasonName = getSeasonForDate(currentDate, hemisphere);
    // Define the canonical order of seasons for progressing
    const seasonCycle = ['spring', 'summer', 'autumn', 'winter'];

    let currentSeasonCycleIndex = seasonCycle.indexOf(currentSeasonName);
    if (currentSeasonCycleIndex === -1) { // Should not happen if getSeasonForDate is robust
        console.error(`Season ${currentSeasonName} not in cycle! Defaulting to spring.`);
        currentSeasonName = 'spring';
        currentSeasonCycleIndex = 0;
    }

    const nextSeasonName = seasonCycle[(currentSeasonCycleIndex + 1) % seasonCycle.length];
    let nextSeasonStartDateDayOfYear = boundaries[nextSeasonName];

    // Year wrap logic:
    // If the next season's nominal start day_of_year is numerically smaller than the current season's nominal start day_of_year,
    // it implies the next season starts in the following year.
    // This is true for NH: Winter (day 355) -> Spring (day 79)
    // And for SH: Summer (day 355) -> Autumn (day 79)
    // Note: This relies on `getSeasonForDate` correctly identifying the current season even if it spans new year.
    // The `SEASON_BOUNDARIES` stores the *typical* start day.

    const currentSeasonNominalStartDay = boundaries[currentSeasonName];

    if (nextSeasonStartDateDayOfYear < currentSeasonNominalStartDay) {
        // This condition correctly identifies NH Winter -> Spring and SH Summer -> Autumn.
        // It also correctly identifies SH Autumn (79) -> Winter (172) as NOT needing year wrap.
        // And SH Winter (172) -> Spring (266) as NOT needing year wrap.
        // And SH Spring (266) -> Summer (355) as NOT needing year wrap.
        const daysInYear = getDayOfYear(new Date(currentDate.getFullYear(), 11, 31));
        nextSeasonStartDateDayOfYear += daysInYear;
    }

    // Special case: If current season is Winter (NH) and it's already January/February,
    // then `currentSeasonNominalStartDay` (355) is for last year.
    // `dayOfYear` (e.g., 30 for Jan 30) is small.
    // `nextSeasonStartDateDayOfYear` for Spring (79) is > `dayOfYear`.
    // Example: Jan 30 (dayOfYear 30). Current season is Winter. Next is Spring.
    // currentSeasonName = 'winter'. nextSeasonName = 'spring'.
    // nextSeasonStartDateDayOfYear for Spring is boundaries.spring (79).
    // currentSeasonNominalStartDay for Winter is boundaries.winter (355).
    // 79 < 355 is true. So, daysInYear is added. This is correct. Spring is "79 days into next year".
    // But `daysUntilNextSeason` will be `(79 + 365) - 30` which is too large.
    // The `nextSeasonStartDateDayOfYear` should be relative to the *current* year's day numbering.
    // So, if Spring starts day 79, and it's Jan 30 (day 30), then days until is 79-30 = 49.
    // If it's Dec 30 (day 364), current is Winter. Next is Spring.
    // nextSeasonStartDateDayOfYear = 79. currentSeasonNominalStartDay = 355.
    // 79 < 355, so nextSeasonStartDateDayOfYear becomes 79 + 365 = 444.
    // daysUntilNextSeason = 444 - 364 = 80. This is correct (approx. 80 days from Dec 30 to Mar 20).

    // The above year wrap logic seems to correctly handle calculating future start date's "absolute" day number.
    // For example, if today is Dec 30th 2023 (day 364) and Spring starts on Mar 20th 2024 (day 79 of 2024),
    // then the "absolute" day number for Spring's start is 365 (days in 2023) + 79 = 444.
    // Days until Spring = 444 - 364 = 80 days. This is correct.

    // If today is Jan 10th 2024 (day 10), current season is Winter (NH). Next is Spring.
    // currentSeasonName = 'winter', nextSeasonName = 'spring'.
    // nextSeasonStartDateDayOfYear (for spring) = 79.
    // currentSeasonNominalStartDay (for winter) = 355.
    // Since 79 < 355, it adds daysInYear. This assumes winter started last year.
    // So, nextSeasonStartDateDayOfYear = 79 (Spring start) + 365 (days in current year, assuming we are calculating for *next* year's spring relative to winter of *this* year).
    // This becomes problematic if `getSeasonForDate` correctly says "Winter" for Jan 10th.
    // Then `currentSeasonNominalStartDay` (355) refers to Dec 22nd of *last* year conceptually.
    // `dayOfYear` is 10.
    // `nextSeasonStartDateDayOfYear` (Spring) is 79. This is correct for current year.
    // The `if (nextSeasonStartDateDayOfYear < currentSeasonNominalStartDay)`:
    //    `79 < 355` is true. So it adds `daysInYear` to `nextSeasonStartDateDayOfYear`. This is WRONG for this case.
    //    Spring is this year, not next year.

    // Revised Year Wrap Logic:
    // The goal is to find the number of days from *today* until the *next actual occurrence* of the next season's start.
    nextSeasonStartDateDayOfYear = boundaries[nextSeasonName]; // Get the nominal start day of the next season

    if (dayOfYear > nextSeasonStartDateDayOfYear) {
        // If today (dayOfYear) has already passed the nominal start day of the next season,
        // it means the next season's occurrence we are targeting is in the *next* year.
        // e.g., Today is Day 300 (Autumn). Next season is Winter (starts day 355). dayOfYear < 355. This branch not taken. (Correct)
        //      daysUntilNextSeason = 355 - 300 = 55.
        // e.g., Today is Day 360 (Winter). Next season is Spring (starts day 79). dayOfYear > 79. This branch IS taken.
        //      So, next Spring is next year.
        //      nextSeasonStartDateDayOfYear needs to be `daysInYear + 79`.
        const daysInYear = getDayOfYear(new Date(currentDate.getFullYear(), 11, 31));
        nextSeasonStartDateDayOfYear += daysInYear;
    }
    // Exception: If current is Winter and next is Spring (NH), and it's Jan/Feb.
    // dayOfYear is small (e.g., 15). currentSeason is Winter. nextSeason is Spring (starts day 79).
    // dayOfYear (15) > nextSeasonStartDateDayOfYear (79) is FALSE. So, no daysInYear added. This is correct.
    // daysUntilNextSeason = 79 - 15 = 64.

    // Exception: SH Summer (Dec, e.g. day 360) to SH Autumn (Mar, day 79).
    // dayOfYear (360). currentSeason is Summer. nextSeason is Autumn (starts day 79).
    // dayOfYear (360) > nextSeasonStartDateDayOfYear (79) is TRUE. Add daysInYear.
    // nextSeasonStartDateDayOfYear = 79 + 365 = 444.
    // daysUntilNextSeason = 444 - 360 = 84. Correct.

    const daysUntilNextSeason = nextSeasonStartDateDayOfYear - dayOfYear;

    console.log(`Current Date: ${currentDate.toDateString()}, Day of Year: ${dayOfYear}, Hemisphere: ${hemisphere}`);
    console.log(`Current Season: ${currentSeasonName}, Next Season: ${nextSeasonName}, Next Starts Day (abs): ${nextSeasonStartDateDayOfYear}, Days Until: ${daysUntilNextSeason}`);

    if (daysUntilNextSeason >= 0 && daysUntilNextSeason <= TRANSITION_DURATION_DAYS && currentSeasonName !== nextSeasonName) { // Added currentSeasonName !== nextSeasonName to prevent continuous transition on the exact boundary day if logic is fuzzy
        const transitionProgress = 1 - (daysUntilNextSeason / TRANSITION_DURATION_DAYS);
        console.log(`In transition to ${nextSeasonName}. Progress: ${transitionProgress.toFixed(2)}`);

        const currentThemeName = mapSeasonToTheme(currentSeasonName);
        const nextThemeName = mapSeasonToTheme(nextSeasonName);

        const currentThemeVars = getThemeCssVariables(currentThemeName);
        const nextThemeVars = getThemeCssVariables(nextThemeName);

        // Clear body theme classes to ensure CSS variables take precedence
        if (document.body.className.match(/theme-\S+/)) {
            document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
        }
        // Also remove from html element if themes are applied there by some other logic
        if (document.documentElement.className.match(/theme-\S+/)) {
            document.documentElement.className = document.documentElement.className.replace(/theme-\S+/g, '').trim();
        }


        CSS_VARIABLES_TO_TRANSITION.forEach(varName => {
            if (varName === '--seasonal-filter-effect') {
                // Handle filter effect separately
                const currentFilter = currentThemeVars[varName];
                const nextFilter = nextThemeVars[varName];

                // Naive approach: switch at midpoint or if one is 'none'
                // A more sophisticated approach would parse and interpolate filter functions if compatible
                if (transitionProgress > 0.5 || currentFilter === 'none') {
                    document.documentElement.style.setProperty(varName, nextFilter);
                } else {
                    document.documentElement.style.setProperty(varName, currentFilter);
                }
            } else {
                const color1 = parseColor(currentThemeVars[varName]);
                const color2 = parseColor(nextThemeVars[varName]);
                if (color1 && color2) { // Ensure colors were parsed
                    const interpolatedColor = interpolateColor(color1, color2, transitionProgress);
                    document.documentElement.style.setProperty(varName, interpolatedColor);
                } else {
                    // Fallback: set to next theme's color directly if parsing failed for one
                    document.documentElement.style.setProperty(varName, nextThemeVars[varName] || currentThemeVars[varName]);
                }
            }
        });

        // Gallery and inspiration content switch to next season's content at the start of transition or midpoint
        // For now, let's switch them at the start (or if progress > 0)
        if (transitionProgress > 0) {
            if (typeof _setGalleryFilterCallback === 'function') {
                _setGalleryFilterCallback('seasons'); // Generic 'seasons' or mapSeasonToTheme(nextSeasonName) for specific filter
            }
            if (typeof _refreshInspirationCallback === 'function') {
                _refreshInspirationCallback(nextSeasonName);
            }
        }
        // _applyThemeCallback should NOT be called with a main seasonal theme during interpolation

    } else {
        console.log(`Not in transition. Applying season: ${currentSeasonName}`);
        clearInterpolatedStyles();
        // Call _applyThemeCallback as usual to set the theme class
        if (typeof _applyThemeCallback === 'function') {
            _applyThemeCallback(mapSeasonToTheme(currentSeasonName));
        }
        // Refresh gallery/inspiration for the current season
        if (typeof _setGalleryFilterCallback === 'function') {
             _setGalleryFilterCallback('seasons'); // Or mapSeasonToTheme(currentSeasonName)
        }
        if (typeof _refreshInspirationCallback === 'function') {
            _refreshInspirationCallback(currentSeasonName);
        }
    }
}

function clearInterpolatedStyles() {
    console.log("Clearing interpolated styles.");
    CSS_VARIABLES_TO_TRANSITION.forEach(varName => {
        document.documentElement.style.removeProperty(varName);
    });
    // Restore body class if it was removed by transition logic, let _applyThemeCallback handle it
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
    if (typeof _refreshInspirationCallback === 'function') {
        // Refresh with no specific season to get current actual or general content
        _refreshInspirationCallback();
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
        applySeasonalLogic(); // This will now use the transition logic if applicable
    } else {
        // If automation is disabled, clear any interpolated styles and let theme-switcher handle theme
        clearInterpolatedStyles();
        // Potentially call _applyThemeCallback with the user's saved theme or default
        // This is often handled by theme-switcher.js when automation is toggled off.
        // For safety, ensure styles are cleared.
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY_FOR_ORIGINAL) || 'default';
        if(_applyThemeCallback) _applyThemeCallback(savedTheme);

    }
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
    applySeasonalLogic(); // Apply seasonal logic on initial load
}


document.addEventListener('DOMContentLoaded', () => {
    initializeSeasonalSettings();
    // applySeasonalLogic(); // Moved into initializeSeasonalSettings to ensure it runs after all setup
});

window.registerSeasonalCallbacks = registerSeasonalCallbacks;
window.applySeasonalLogic = applySeasonalLogic;
    window.setSeasonalAutomation = setSeasonalAutomation; // Exposed
// window.initializeSeasonalSettings is called on DOMContentLoaded from this script.

    // Expose specific functions needed by other scripts (some might already be)
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
