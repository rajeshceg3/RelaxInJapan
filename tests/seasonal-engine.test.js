const {
    getSeasonForDate,
    initializeSeasonalSettings,
} = require('../js/seasonal-engine.js');

describe('Seasonal Engine Logic', () => {
    beforeEach(() => {
        // Mock localStorage
        const localStorageMock = (() => {
            let store = {};
            return {
                getItem: (key) => store[key] || null,
                setItem: (key, value) => {
                    store[key] = value.toString();
                },
                clear: () => {
                    store = {};
                }
            };
        })();
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock
        });
    });

    test('getSeasonForDate should return the correct season for the northern hemisphere', () => {
        // Spring
        expect(getSeasonForDate(new Date('2024-03-20'), 'northern')).toBe('spring');
        // Summer
        expect(getSeasonForDate(new Date('2024-06-21'), 'northern')).toBe('summer');
        // Autumn
        expect(getSeasonForDate(new Date('2024-09-23'), 'northern')).toBe('autumn');
        // Winter
        expect(getSeasonForDate(new Date('2024-12-22'), 'northern')).toBe('winter');
    });

    test('getSeasonForDate should return the correct season for the southern hemisphere', () => {
        // Spring
        expect(getSeasonForDate(new Date('2024-09-23'), 'southern')).toBe('spring');
        // Summer
        expect(getSeasonForDate(new Date('2024-12-22'), 'southern')).toBe('summer');
        // Autumn
        expect(getSeasonForDate(new Date('2024-03-20'), 'southern')).toBe('autumn');
        // Winter
        expect(getSeasonForDate(new Date('2024-06-21'), 'southern')).toBe('winter');
    });

    test('initializeSeasonalSettings should load settings from localStorage', () => {
        window.localStorage.setItem('seasonalHemisphere', 'southern');
        initializeSeasonalSettings();
        expect(window.selectedHemisphere).toBe('southern');
    });
});
