// tests/seasonal-engine.test.js

// Import functions to be tested.
// First, require the file to execute it and populate window/global
// We do this inside beforeEach with resetModules to ensure clean state

// Access functions from window *inside* tests or beforeEach to ensure they are defined
// const { ... } = window; // Removed top-level destructuring

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: () => {
      store = {};
    },
    removeItem: jest.fn(key => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Callbacks
let mockApplyThemeCallback;
let mockSetGalleryFilterCallback;

// Mock Daily Inspiration Widget
let mockDailyInspirationWidget;


describe('Seasonal Engine Logic', () => {
    beforeEach(() => {
        jest.resetModules(); // Reset module registry to re-evaluate requires

        // Reset window properties for each test
        window.seasonalAutomationEnabled = false;
        window.selectedHemisphere = 'northern';
        window.isPreviewingSeason = false; // Not a global, but internal state reset for clarity
        window.previewSeasonOffset = 0;   // Internal state reset

        // Mock DOM elements that might be used by applyEffectsForSeason
        // These are used if isPreview is true within applyEffectsForSeason
        document.body.innerHTML = `
            <div id="seasonal-preview-info"></div>
            <button id="exit-seasonal-preview-btn"></button>
        `;

        try {
            require('../js/seasonal-engine.js');
        } catch (e) {
            console.error("Error requiring seasonal-engine.js:", e);
        }

        // Reset and re-register mock callbacks
        mockApplyThemeCallback = jest.fn();
        mockSetGalleryFilterCallback = jest.fn();
        // Access registerSeasonalCallbacks from window
        if (window.registerSeasonalCallbacks) {
            window.registerSeasonalCallbacks(mockApplyThemeCallback, mockSetGalleryFilterCallback);
        }

        mockDailyInspirationWidget = {
            refreshContentForSeason: jest.fn(),
        };
        window.dailyInspirationWidget = mockDailyInspirationWidget;


        // Clear localStorage mock
        localStorageMock.clear();

        // Assign to window for direct access if functions expect them on window, or ensure they are found by document.getElementById
        // The seasonal-engine.js caches these in `initializeSeasonalControls`, so direct assignment to window might not be how it works.
        // Instead, the functions use module-scoped `seasonalPreviewInfoEl`, `exitSeasonalPreviewBtnEl`.
        // For `applyEffectsForSeason` tests, we need to ensure these are defined if `isPreview` is true.
        // We can pre-cache them in the test setup if `initializeSeasonalControls` is not called.
        window.seasonalPreviewInfoEl = document.getElementById('seasonal-preview-info');
        window.exitSeasonalPreviewBtnEl = document.getElementById('exit-seasonal-preview-btn');


        // Spy on console messages if needed for specific tests, or rely on Jest's default handling
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore original console functions
        jest.restoreAllMocks();
        // Delete test-specific window properties
        delete window.seasonalPreviewInfoEl;
        delete window.exitSeasonalPreviewBtnEl;
        delete window.dailyInspirationWidget;
        // Clean up DOM
        document.body.innerHTML = '';
    });

    describe('getSeasonForDate', () => {
        // Northern Hemisphere Tests
        it('should return "spring" for Northern Hemisphere spring dates', () => {
            expect(window.getSeasonForDate(new Date(2024, 2, 20), 'northern')).toBe('spring'); // March 20
            expect(window.getSeasonForDate(new Date(2024, 3, 15), 'northern')).toBe('spring'); // April 15
            expect(window.getSeasonForDate(new Date(2024, 5, 20), 'northern')).toBe('spring'); // June 20
        });

        it('should return "summer" for Northern Hemisphere summer dates', () => {
            expect(window.getSeasonForDate(new Date(2024, 5, 21), 'northern')).toBe('summer'); // June 21
            expect(window.getSeasonForDate(new Date(2024, 7, 1), 'northern')).toBe('summer');   // August 1
            expect(window.getSeasonForDate(new Date(2024, 8, 22), 'northern')).toBe('summer'); // Sept 22
        });

        it('should return "autumn" for Northern Hemisphere autumn dates', () => {
            expect(window.getSeasonForDate(new Date(2024, 8, 23), 'northern')).toBe('autumn'); // Sept 23
            expect(window.getSeasonForDate(new Date(2024, 10, 1), 'northern')).toBe('autumn'); // Nov 1
            expect(window.getSeasonForDate(new Date(2024, 11, 21), 'northern')).toBe('autumn'); // Dec 21
        });

        it('should return "winter" for Northern Hemisphere winter dates', () => {
            expect(window.getSeasonForDate(new Date(2024, 11, 22), 'northern')).toBe('winter'); // Dec 22
            expect(window.getSeasonForDate(new Date(2024, 0, 15), 'northern')).toBe('winter');  // Jan 15
            expect(window.getSeasonForDate(new Date(2024, 2, 19), 'northern')).toBe('winter');  // March 19
        });

        // Southern Hemisphere Tests
        it('should return "autumn" for Southern Hemisphere autumn dates (corresponds to NH spring)', () => {
            expect(window.getSeasonForDate(new Date(2024, 2, 20), 'southern')).toBe('autumn');
            expect(window.getSeasonForDate(new Date(2024, 3, 15), 'southern')).toBe('autumn');
            expect(window.getSeasonForDate(new Date(2024, 5, 20), 'southern')).toBe('autumn');
        });

        it('should return "winter" for Southern Hemisphere winter dates (corresponds to NH summer)', () => {
            expect(window.getSeasonForDate(new Date(2024, 5, 21), 'southern')).toBe('winter');
            expect(window.getSeasonForDate(new Date(2024, 7, 1), 'southern')).toBe('winter');
            expect(window.getSeasonForDate(new Date(2024, 8, 22), 'southern')).toBe('winter');
        });

        it('should return "spring" for Southern Hemisphere spring dates (corresponds to NH autumn)', () => {
            expect(window.getSeasonForDate(new Date(2024, 8, 23), 'southern')).toBe('spring');
            expect(window.getSeasonForDate(new Date(2024, 10, 1), 'southern')).toBe('spring');
            expect(window.getSeasonForDate(new Date(2024, 11, 21), 'southern')).toBe('spring');
        });

        it('should return "summer" for Southern Hemisphere summer dates (corresponds to NH winter)', () => {
            expect(window.getSeasonForDate(new Date(2024, 11, 22), 'southern')).toBe('summer');
            expect(window.getSeasonForDate(new Date(2024, 0, 15), 'southern')).toBe('summer');
            expect(window.getSeasonForDate(new Date(2024, 2, 19), 'southern')).toBe('summer');
        });
    });

    describe('mapSeasonToTheme', () => {
        it('should map "spring" to "haru"', () => {
            expect(window.mapSeasonToTheme('spring')).toBe('haru');
        });

        it('should map "summer" to "natsu"', () => {
            expect(window.mapSeasonToTheme('summer')).toBe('natsu');
        });

        it('should map "autumn" to "momiji"', () => {
            expect(window.mapSeasonToTheme('autumn')).toBe('momiji');
        });

        it('should map "winter" to "yuki"', () => {
            expect(window.mapSeasonToTheme('winter')).toBe('yuki');
        });

        it('should map an unknown season to "default"', () => {
            expect(window.mapSeasonToTheme('unknownSeason')).toBe('default');
            expect(window.mapSeasonToTheme('')).toBe('default');
        });
    });

    describe('getSeasonByOffset', () => {
        const baseDate = new Date(2024, 5, 15); // June 15, 2024 (Northern Spring / Southern Winter)

        it('should return the current season for offset 0', () => {
            expect(window.getSeasonByOffset(0, baseDate, 'northern')).toBe('spring'); // June 15 is spring
            expect(window.getSeasonByOffset(0, baseDate, 'southern')).toBe('winter');
        });

        it('should return next season for offset 1 (Northern)', () => {
            // Base: June 15 (Spring) -> Offset 1 (3 months later: Sept 15) -> Summer
            expect(window.getSeasonByOffset(1, baseDate, 'northern')).toBe('summer');
        });

        it('should return previous season for offset -1 (Northern)', () => {
            // Base: June 15 (Spring) -> Offset -1 (3 months earlier: March 15) -> Winter
            expect(window.getSeasonByOffset(-1, baseDate, 'northern')).toBe('winter');
        });

        it('should return next season for offset 1 (Southern)', () => {
             // Base: June 15 (Winter) -> Offset 1 (3 months later: Sept 15) -> Spring
            expect(window.getSeasonByOffset(1, baseDate, 'southern')).toBe('spring');
        });

        it('should return previous season for offset -1 (Southern)', () => {
            // Base: June 15 (Winter) -> Offset -1 (3 months earlier: March 15) -> Autumn
            expect(window.getSeasonByOffset(-1, baseDate, 'southern')).toBe('autumn');
        });

        it('should handle larger offsets correctly (e.g., 4 for a year later)', () => {
            // Base: June 15, 2024 (Spring NH) -> Offset 4 (12 months later: June 15, 2025) -> Spring NH
            expect(window.getSeasonByOffset(4, baseDate, 'northern')).toBe('spring');
        });

         it('should use window.selectedHemisphere if hemisphere is not provided', () => {
            window.selectedHemisphere = 'southern';
            // Base: June 15 (Winter SH) -> Offset 0 -> Winter SH
            expect(window.getSeasonByOffset(0, baseDate)).toBe('winter');
            window.selectedHemisphere = 'northern'; // reset for other tests
        });
    });

    describe('applyEffectsForSeason', () => {
        // Note: seasonalPreviewInfoEl and exitSeasonalPreviewBtnEl are set up in beforeEach
        // These elements are used by the function being tested.

        it('should call applyTheme and setGalleryFilter callbacks with correct theme and category (not preview)', () => {
            window.applyEffectsForSeason('spring', false);
            expect(mockApplyThemeCallback).toHaveBeenCalledWith('haru');
            expect(mockSetGalleryFilterCallback).toHaveBeenCalledWith('all'); // Default original category
            expect(mockDailyInspirationWidget.refreshContentForSeason).toHaveBeenCalledWith('spring');
            expect(window.seasonalPreviewInfoEl.textContent).toBe('');
            expect(window.exitSeasonalPreviewBtnEl.style.display).toBe('none');
        });

        it('should call applyTheme and setGalleryFilter for "seasons" category (preview mode)', () => {
            window.applyEffectsForSeason('summer', true);
            expect(mockApplyThemeCallback).toHaveBeenCalledWith('natsu');
            expect(mockSetGalleryFilterCallback).toHaveBeenCalledWith('seasons');
            expect(mockDailyInspirationWidget.refreshContentForSeason).toHaveBeenCalledWith('summer');
            expect(window.seasonalPreviewInfoEl.textContent).toBe('Previewing: Summer');
            expect(window.exitSeasonalPreviewBtnEl.style.display).toBe('inline-block');
        });

        it('should use originalGalleryCategory when exiting preview (isPreview=false, originalGalleryCategory set)', () => {
            // This specific scenario is more directly handled by handleExitPreview,
            // but applyEffectsForSeason is called by it.
            // We simulate the state where originalGalleryCategory is set.
            window.originalGalleryCategory = 'nature'; // Simulate this internal state for the test.
            window.applyEffectsForSeason('winter', false);
            expect(mockApplyThemeCallback).toHaveBeenCalledWith('yuki');
            // When isPreview is false, it should use originalGalleryCategory if available
            expect(mockSetGalleryFilterCallback).toHaveBeenCalledWith('nature');
            delete window.originalGalleryCategory; // Clean up
        });

        it('should handle missing dailyInspirationWidget gracefully', () => {
            delete window.dailyInspirationWidget; // Simulate widget not existing
            window.applyEffectsForSeason('autumn', false);
            expect(mockApplyThemeCallback).toHaveBeenCalledWith('momiji');
            expect(mockSetGalleryFilterCallback).toHaveBeenCalledWith('all');
            expect(console.warn).toHaveBeenCalledWith("dailyInspirationWidget or refreshContentForSeason method not found during applyEffectsForSeason.");
        });

        it('should handle missing applyTheme callback gracefully', () => {
            window.registerSeasonalCallbacks(null, mockSetGalleryFilterCallback); // Unregister applyTheme
            window.applyEffectsForSeason('spring', false);
            expect(mockApplyThemeCallback).not.toHaveBeenCalled(); // It was jest.fn() but now null
            expect(console.error).toHaveBeenCalledWith("applyTheme callback not registered for applyEffectsForSeason.");
            expect(mockSetGalleryFilterCallback).toHaveBeenCalledWith('all');
        });

        it('should handle missing setGalleryFilter callback gracefully', () => {
            window.registerSeasonalCallbacks(mockApplyThemeCallback, null); // Unregister setGalleryFilter
            window.applyEffectsForSeason('spring', false);
            expect(mockApplyThemeCallback).toHaveBeenCalledWith('haru');
            expect(console.warn).toHaveBeenCalledWith("setGalleryFilterCallback not registered for applyEffectsForSeason.");
            expect(mockSetGalleryFilterCallback).not.toHaveBeenCalled();
        });
    });

    describe('applySeasonalLogic', () => {
        // Mock getSeasonByOffset and getSeasonForDate as they are dependencies
        let originalGetSeasonByOffset;
        let originalGetSeasonForDate;

        beforeEach(() => {
            // Store original functions and replace with mocks
            originalGetSeasonByOffset = window.getSeasonByOffset;
            originalGetSeasonForDate = window.getSeasonForDate;
            window.getSeasonByOffset = jest.fn();
            window.getSeasonForDate = jest.fn();

            // Spy on applyEffectsForSeason as it's called by applySeasonalLogic
            jest.spyOn(window, 'applyEffectsForSeason');

            // Reset internal states that applySeasonalLogic reads
            window.isPreviewingSeason = false;
            window.previewSeasonOffset = 0;
            window.seasonalAutomationEnabled = false;
        });

        afterEach(() => {
            // Restore original functions
            window.getSeasonByOffset = originalGetSeasonByOffset;
            window.getSeasonForDate = originalGetSeasonForDate;
            if (window.applyEffectsForSeason && window.applyEffectsForSeason.mockRestore) {
                 window.applyEffectsForSeason.mockRestore();
            }
        });

        test('should call applyEffectsForSeason with preview season if isPreviewingSeason is true', () => {
            window.isPreviewingSeason = true;
            window.previewSeasonOffset = 1;
            window.getSeasonByOffset.mockReturnValue('mockPreviewSeason');

            window.applySeasonalLogic();

            expect(window.getSeasonByOffset).toHaveBeenCalledWith(1, expect.any(Date), window.selectedHemisphere);
            expect(window.applyEffectsForSeason).toHaveBeenCalledWith('mockPreviewSeason', true);
            expect(window.getSeasonForDate).not.toHaveBeenCalled();
        });

        test('should call applyEffectsForSeason with actual season if automation is enabled and not previewing', () => {
            window.seasonalAutomationEnabled = true;
            window.isPreviewingSeason = false;
            window.getSeasonForDate.mockReturnValue('mockActualSeason');

            window.applySeasonalLogic();

            expect(window.getSeasonForDate).toHaveBeenCalledWith(expect.any(Date), window.selectedHemisphere);
            expect(window.applyEffectsForSeason).toHaveBeenCalledWith('mockActualSeason', false);
            expect(window.getSeasonByOffset).not.toHaveBeenCalled();
        });

        test('should do nothing if automation is disabled and not previewing', () => {
            window.seasonalAutomationEnabled = false;
            window.isPreviewingSeason = false;

            window.applySeasonalLogic();

            expect(window.applyEffectsForSeason).not.toHaveBeenCalled();
            expect(window.getSeasonForDate).not.toHaveBeenCalled();
            expect(window.getSeasonByOffset).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith("Seasonal automation is disabled. No seasonal logic applied.");
        });
    });

    describe('handleExitPreview', () => {
        beforeEach(() => {
            window.isPreviewingSeason = true;
            window.previewSeasonOffset = 2;
            window.originalUserTheme = 'theme-original';
            window.originalGalleryCategory = 'category-original';
            window.originalSeasonalAutomationState = true;

            if (typeof window.setSeasonalAutomation === 'function') {
                jest.spyOn(window, 'setSeasonalAutomation').mockImplementation(() => {});
            } else {
                window.setSeasonalAutomation = jest.fn();
            }

            if (window.seasonalPreviewInfoEl) window.seasonalPreviewInfoEl.textContent = 'Previewing something';
            if (window.exitSeasonalPreviewBtnEl) window.exitSeasonalPreviewBtnEl.style.display = 'inline-block';
        });

        afterEach(() => {
            delete window.originalUserTheme;
            delete window.originalGalleryCategory;
            delete window.originalSeasonalAutomationState;
            if (window.setSeasonalAutomation && window.setSeasonalAutomation.mockRestore) {
                window.setSeasonalAutomation.mockRestore();
            }
        });

        test('should do nothing if not in preview mode', () => {
            window.isPreviewingSeason = false;
            window.handleExitPreview();
            expect(mockApplyThemeCallback).not.toHaveBeenCalled();
        });

        test('should restore original theme, category, and reset preview state', () => {
            window.handleExitPreview();

            expect(window.isPreviewingSeason).toBe(false);
            expect(window.previewSeasonOffset).toBe(0);
            expect(mockApplyThemeCallback).toHaveBeenCalledWith('theme-original');
            expect(mockSetGalleryFilterCallback).toHaveBeenCalledWith('category-original');
            expect(mockDailyInspirationWidget.refreshContentForSeason).toHaveBeenCalledWith();

            expect(window.seasonalPreviewInfoEl.textContent).toBe('');
            expect(window.exitSeasonalPreviewBtnEl.style.display).toBe('none');
        });

        test('should call setSeasonalAutomation with original automation state (true)', () => {
            window.originalSeasonalAutomationState = true;
            window.handleExitPreview();
            expect(window.setSeasonalAutomation).toHaveBeenCalledWith(true);
        });

        test('should call setSeasonalAutomation with original automation state (false) and reapply original theme', () => {
            window.originalSeasonalAutomationState = false;
            window.originalUserTheme = 'manual-theme-when-auto-off';
            mockApplyThemeCallback.mockClear();

            window.handleExitPreview();

            expect(window.setSeasonalAutomation).toHaveBeenCalledWith(false);
            expect(mockApplyThemeCallback).toHaveBeenCalledWith('manual-theme-when-auto-off');
        });

        test('should default to "default" theme and "all" category if originals were null', () => {
            window.originalUserTheme = null;
            window.originalGalleryCategory = null;
            window.handleExitPreview();
            expect(mockApplyThemeCallback).toHaveBeenCalledWith('default');
            expect(mockSetGalleryFilterCallback).toHaveBeenCalledWith('all');
        });
    });

    describe('setSeasonalAutomation', () => {
        let handleExitPreviewSpy;
        let applySeasonalLogicSpy;

        beforeEach(() => {
            if (typeof window.handleExitPreview === 'function') {
                handleExitPreviewSpy = jest.spyOn(window, 'handleExitPreview').mockImplementation(() => {});
            } else {
                window.handleExitPreview = jest.fn();
                handleExitPreviewSpy = window.handleExitPreview;
            }

            if (typeof window.applySeasonalLogic === 'function') {
                applySeasonalLogicSpy = jest.spyOn(window, 'applySeasonalLogic').mockImplementation(() => {});
            } else {
                window.applySeasonalLogic = jest.fn();
                applySeasonalLogicSpy = window.applySeasonalLogic;
            }
            localStorageMock.setItem.mockClear();
        });

        afterEach(() => {
            if (handleExitPreviewSpy && handleExitPreviewSpy.mockRestore) handleExitPreviewSpy.mockRestore();
            if (applySeasonalLogicSpy && applySeasonalLogicSpy.mockRestore) applySeasonalLogicSpy.mockRestore();
        });

        test('should enable automation, save to localStorage, and apply logic', () => {
            window.isPreviewingSeason = false;
            window.setSeasonalAutomation(true);

            expect(window.seasonalAutomationEnabled).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith('seasonalAutomationEnabled', 'true');
            expect(applySeasonalLogicSpy).toHaveBeenCalled();
            expect(handleExitPreviewSpy).not.toHaveBeenCalled();
        });

        test('should disable automation and save to localStorage', () => {
            window.isPreviewingSeason = false;
            window.setSeasonalAutomation(false);

            expect(window.seasonalAutomationEnabled).toBe(false);
            expect(localStorageMock.setItem).toHaveBeenCalledWith('seasonalAutomationEnabled', 'false');
            expect(applySeasonalLogicSpy).not.toHaveBeenCalled();
            expect(handleExitPreviewSpy).not.toHaveBeenCalled();
        });

        test('should call handleExitPreview if enabling/disabling while in preview mode', () => {
            window.isPreviewingSeason = true;
            window.setSeasonalAutomation(true);
            expect(handleExitPreviewSpy).toHaveBeenCalled();
            expect(applySeasonalLogicSpy).toHaveBeenCalled();
        });
    });

    describe('setSelectedHemisphere', () => {
        let handleExitPreviewSpy;
        let applySeasonalLogicSpy;

        beforeEach(() => {
            if (typeof window.handleExitPreview === 'function') {
                handleExitPreviewSpy = jest.spyOn(window, 'handleExitPreview').mockImplementation(() => {});
            } else {
                window.handleExitPreview = jest.fn();
                handleExitPreviewSpy = window.handleExitPreview;
            }

            if (typeof window.applySeasonalLogic === 'function') {
                applySeasonalLogicSpy = jest.spyOn(window, 'applySeasonalLogic').mockImplementation(() => {});
            } else {
                window.applySeasonalLogic = jest.fn();
                applySeasonalLogicSpy = window.applySeasonalLogic;
            }
            localStorageMock.setItem.mockClear();
            window.seasonalAutomationEnabled = false;
            window.selectedHemisphere = 'northern';
        });

        afterEach(() => {
            if (handleExitPreviewSpy && handleExitPreviewSpy.mockRestore) handleExitPreviewSpy.mockRestore();
            if (applySeasonalLogicSpy && applySeasonalLogicSpy.mockRestore) applySeasonalLogicSpy.mockRestore();
        });

        test('should set hemisphere to "southern", save, and apply logic if automation is on', () => {
            window.seasonalAutomationEnabled = true;
            window.isPreviewingSeason = false;
            window.setSelectedHemisphere('southern');

            expect(window.selectedHemisphere).toBe('southern');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('seasonalHemisphere', 'southern');
            expect(applySeasonalLogicSpy).toHaveBeenCalled();
            expect(handleExitPreviewSpy).not.toHaveBeenCalled();
        });

        test('should set hemisphere to "northern", save, but not apply logic if automation is off', () => {
            window.seasonalAutomationEnabled = false;
            window.isPreviewingSeason = false;
            window.setSelectedHemisphere('northern');

            expect(window.selectedHemisphere).toBe('northern');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('seasonalHemisphere', 'northern');
            expect(applySeasonalLogicSpy).not.toHaveBeenCalled();
            expect(handleExitPreviewSpy).not.toHaveBeenCalled();
        });

        test('should not change hemisphere for an invalid value', () => {
            const initialHemisphere = window.selectedHemisphere;
            window.setSelectedHemisphere('invalidValue');

            expect(window.selectedHemisphere).toBe(initialHemisphere);
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
            expect(applySeasonalLogicSpy).not.toHaveBeenCalled();
        });

        test('should call handleExitPreview if changing hemisphere while in preview mode', () => {
            window.isPreviewingSeason = true;
            window.seasonalAutomationEnabled = true;
            window.setSelectedHemisphere('southern');

            expect(handleExitPreviewSpy).toHaveBeenCalled();
            expect(applySeasonalLogicSpy).toHaveBeenCalled();
        });
    });

    describe('initializeSeasonalSettings', () => {
        let northernRadio, southernRadio;
        let initializeSeasonalControlsSpy;

        beforeEach(() => {
            document.body.innerHTML += `
                <input type="radio" id="hemisphere-northern" name="hemisphere">
                <input type="radio" id="hemisphere-southern" name="hemisphere">
            `;
            northernRadio = document.getElementById('hemisphere-northern');
            southernRadio = document.getElementById('hemisphere-southern');

            // Ensure initializeSeasonalControls is a mock for this suite
            window.initializeSeasonalControls = jest.fn();
            initializeSeasonalControlsSpy = window.initializeSeasonalControls;

            localStorageMock.getItem.mockClear();
            window.seasonalAutomationEnabled = false;
            window.selectedHemisphere = 'northern';
        });

        afterEach(() => {
             // No need to restore initializeSeasonalControls if it's always mocked per test run in this suite
             document.body.innerHTML = '';
        });

        test('should load automation and hemisphere settings from localStorage (if available)', () => {
            localStorageMock.getItem.mockImplementation(key => {
                if (key === 'seasonalAutomationEnabled') return 'true';
                if (key === 'seasonalHemisphere') return 'southern';
                return null;
            });

            window.initializeSeasonalSettings();

            expect(localStorageMock.getItem).toHaveBeenCalledWith('seasonalAutomationEnabled');
            expect(localStorageMock.getItem).toHaveBeenCalledWith('seasonalHemisphere');
            expect(window.seasonalAutomationEnabled).toBe(true);
            expect(window.selectedHemisphere).toBe('southern');
        });

        test('should use default settings if localStorage is empty', () => {
            localStorageMock.getItem.mockReturnValue(null);
            window.initializeSeasonalSettings();
            expect(window.seasonalAutomationEnabled).toBe(false);
            expect(window.selectedHemisphere).toBe('northern');
        });

        test('should set radio button checked state based on loaded hemisphere', () => {
            localStorageMock.getItem.mockImplementation(key => key === 'seasonalHemisphere' ? 'southern' : null);
            window.initializeSeasonalSettings();
            expect(southernRadio.checked).toBe(true);
            expect(northernRadio.checked).toBe(false);

            localStorageMock.getItem.mockImplementation(key => key === 'seasonalHemisphere' ? 'northern' : null);
            window.initializeSeasonalSettings();
            expect(northernRadio.checked).toBe(true);
            expect(southernRadio.checked).toBe(false);
        });

        test('should call initializeSeasonalControls', () => {
            window.initializeSeasonalSettings();
            expect(initializeSeasonalControlsSpy).toHaveBeenCalled();
        });

        test('should add event listeners to hemisphere radio buttons', () => {
            const addEventListenerSpyNorth = jest.spyOn(northernRadio, 'addEventListener');
            const addEventListenerSpySouth = jest.spyOn(southernRadio, 'addEventListener');

            // Mock setSelectedHemisphere as it's called by the event listener
            const originalSetSelectedHemisphere = window.setSelectedHemisphere;
            window.setSelectedHemisphere = jest.fn();

            window.initializeSeasonalSettings();

            expect(addEventListenerSpyNorth).toHaveBeenCalledWith('change', expect.any(Function));
            expect(addEventListenerSpySouth).toHaveBeenCalledWith('change', expect.any(Function));

            // Simulate change event
            southernRadio.checked = true;
            const changeEvent = new Event('change');
            southernRadio.dispatchEvent(changeEvent);
            expect(window.setSelectedHemisphere).toHaveBeenCalledWith('southern');

            northernRadio.checked = true;
            northernRadio.dispatchEvent(changeEvent);
            expect(window.setSelectedHemisphere).toHaveBeenCalledWith('northern');

            addEventListenerSpyNorth.mockRestore();
            addEventListenerSpySouth.mockRestore();
            window.setSelectedHemisphere = originalSetSelectedHemisphere; // Restore
        });

        test('should warn if hemisphere radio buttons are not found', () => {
            document.body.innerHTML = '';
            window.initializeSeasonalSettings();
            expect(console.warn).toHaveBeenCalledWith("Hemisphere radio buttons not found for event listeners.");
        });
    });

    describe('initializeSeasonalControls', () => {
        let prevBtn, nextBtn, exitBtn;
        let applySeasonalLogicSpy;
        let handleExitPreviewSpy;

        beforeEach(() => {
            document.body.innerHTML += `
                <button id="preview-prev-season-btn"></button>
                <button id="preview-next-season-btn"></button>
                <button id="exit-seasonal-preview-btn"></button>
                <div id="seasonal-preview-info"></div>
            `;
            prevBtn = document.getElementById('preview-prev-season-btn');
            nextBtn = document.getElementById('preview-next-season-btn');
            exitBtn = document.getElementById('exit-seasonal-preview-btn');
            window.seasonalPreviewInfoEl = document.getElementById('seasonal-preview-info');

            applySeasonalLogicSpy = jest.spyOn(window, 'applySeasonalLogic').mockImplementation(() => {});
            handleExitPreviewSpy = jest.spyOn(window, 'handleExitPreview').mockImplementation(() => {});

            window.isPreviewingSeason = false;
            window.previewSeasonOffset = 0;
            window.originalUserTheme = null;
            window.originalGalleryCategory = null;
            window.originalSeasonalAutomationState = null;
            window.seasonalAutomationEnabled = false;

            localStorageMock.getItem.mockImplementation(key => {
                if (key === 'dashboardUserTheme') return 'mock-theme-from-storage'; // Assuming THEME_STORAGE_KEY_FOR_ORIGINAL is 'dashboardUserTheme'
                return null;
            });
            window.imageGalleryState = { selectedCategory: 'mock-category-from-gallery' };
        });

        afterEach(() => {
            applySeasonalLogicSpy.mockRestore();
            handleExitPreviewSpy.mockRestore();
            document.body.innerHTML = '';
            delete window.imageGalleryState;
            delete window.seasonalPreviewInfoEl; // Clean up manually added window property
        });

        test('should add event listener to previous season button and call applySeasonalLogic on click', () => {
            const addEventListenerSpy = jest.spyOn(prevBtn, 'addEventListener');
            window.initializeSeasonalControls();
            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

            const callback = addEventListenerSpy.mock.calls[0][1];
            callback();

            expect(window.isPreviewingSeason).toBe(true);
            expect(window.previewSeasonOffset).toBe(-1);
            expect(applySeasonalLogicSpy).toHaveBeenCalled();
            expect(window.originalUserTheme).toBe('mock-theme-from-storage');
            expect(window.originalGalleryCategory).toBe('mock-category-from-gallery');
            addEventListenerSpy.mockRestore();
        });

        test('should add event listener to next season button and call applySeasonalLogic on click', () => {
            const addEventListenerSpy = jest.spyOn(nextBtn, 'addEventListener');
            window.initializeSeasonalControls();
            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

            const callback = addEventListenerSpy.mock.calls[0][1];
            callback();

            expect(window.isPreviewingSeason).toBe(true);
            expect(window.previewSeasonOffset).toBe(1);
            expect(applySeasonalLogicSpy).toHaveBeenCalled();
            addEventListenerSpy.mockRestore();
        });

        test('should add event listener to exit preview button and call handleExitPreview on click', () => {
            const addEventListenerSpy = jest.spyOn(exitBtn, 'addEventListener');
            window.initializeSeasonalControls();
            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

            const callback = addEventListenerSpy.mock.calls[0][1];
            callback();
            expect(handleExitPreviewSpy).toHaveBeenCalled();
            addEventListenerSpy.mockRestore();
        });

        test('should correctly temporarily disable seasonalAutomation if it was on when starting preview', () => {
            window.seasonalAutomationEnabled = true;
            const addEventListenerSpy = jest.spyOn(nextBtn, 'addEventListener');
            window.initializeSeasonalControls();

            const callback = addEventListenerSpy.mock.calls[0][1];
            callback();

            expect(window.isPreviewingSeason).toBe(true);
            expect(window.originalSeasonalAutomationState).toBe(true);
            expect(window.seasonalAutomationEnabled).toBe(false);
            expect(applySeasonalLogicSpy).toHaveBeenCalled();
            addEventListenerSpy.mockRestore();
        });

        test('should find DOM elements if they exist for controls', () => {
            const prevSpy = jest.spyOn(prevBtn, 'addEventListener');
            const nextSpy = jest.spyOn(nextBtn, 'addEventListener');
            const exitSpy = jest.spyOn(exitBtn, 'addEventListener');

            window.initializeSeasonalControls();

            expect(prevSpy).toHaveBeenCalled();
            expect(nextSpy).toHaveBeenCalled();
            expect(exitSpy).toHaveBeenCalled();

            prevSpy.mockRestore();
            nextSpy.mockRestore();
            exitSpy.mockRestore();
        });

        test('should not throw error if control buttons are missing', () => {
            document.body.innerHTML = '<div id="seasonal-preview-info"></div>';
            expect(() => {
                window.initializeSeasonalControls();
            }).not.toThrow();
            expect(applySeasonalLogicSpy).not.toHaveBeenCalled();
            expect(handleExitPreviewSpy).not.toHaveBeenCalled();
        });
    });

}); // End of main describe('Seasonal Engine Logic')
