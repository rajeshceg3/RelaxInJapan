// js/seasonal-engine.js

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

window.selectedHemisphere = 'northern';

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

function initializeSeasonalSettings() {
    const savedHemisphere = localStorage.getItem('seasonalHemisphere');
    window.selectedHemisphere = savedHemisphere || 'northern';
    console.log(`Loaded hemisphere setting: ${window.selectedHemisphere}`);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeSeasonalSettings();
});

window.getSeasonForDate = getSeasonForDate;
