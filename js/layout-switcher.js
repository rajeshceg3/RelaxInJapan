document.addEventListener('DOMContentLoaded', () => {
    const LAYOUT_STORAGE_KEY = 'selectedDashboardLayout';
    window.LAYOUT_STORAGE_KEY = LAYOUT_STORAGE_KEY; // Expose for seasonal-engine

    const dashboardMain = document.querySelector('.dashboard-main');
    const layoutButtons = document.querySelectorAll('.layout-selector-btn');

    // Define all known layout classes for easy removal
    const ALL_LAYOUT_CLASSES = [
        'layout-default', // Though default usually means no class
        'layout-traditional-grid',
        'layout-minimalist-center',
        'layout-asymmetrical-zen',
        'layout-seasonal-flow',
        'layout-sf-spring',
        'layout-sf-summer',
        'layout-sf-autumn',
        'layout-sf-winter'
    ];

    function applyLayout(layoutName) {
        if (!dashboardMain) {
            console.error('Dashboard main container not found for layout switching.');
            return;
        }

        // Remove all potential layout classes
        ALL_LAYOUT_CLASSES.forEach(cls => dashboardMain.classList.remove(cls));

        let actualLayoutClassToAdd = '';

        if (layoutName === 'seasonal-flow') {
            if (typeof window.getSeasonForDate === 'function' &&
                typeof window.selectedHemisphere !== 'undefined' &&
                typeof window.getSeasonSpecificLayoutClass === 'function') {

                const currentSeason = window.getSeasonForDate(new Date(), window.selectedHemisphere);
                actualLayoutClassToAdd = window.getSeasonSpecificLayoutClass(currentSeason);

                dashboardMain.classList.add('layout-seasonal-flow'); // Add the base class
                if (actualLayoutClassToAdd) {
                    dashboardMain.classList.add(actualLayoutClassToAdd); // Add the season-specific sub-class
                }
                console.log(`Applied seasonal flow: base 'layout-seasonal-flow', specific '${actualLayoutClassToAdd}' for season ${currentSeason}`);
            } else {
                console.warn("Seasonal functions not available for 'seasonal-flow' layout. Applying base class only or defaulting.");
                // Fallback: just add layout-seasonal-flow, or nothing if functions are missing
                 dashboardMain.classList.add('layout-seasonal-flow');
            }
        } else if (layoutName && layoutName !== 'default') {
            actualLayoutClassToAdd = `layout-${layoutName}`;
            dashboardMain.classList.add(actualLayoutClassToAdd);
            console.log(`Applied layout: ${actualLayoutClassToAdd}`);
        } else {
            // Default layout - no class added, or a specific 'layout-default' if it has styles
            console.log("Applied default layout (no specific class or 'layout-default').");
        }

        // Update aria-pressed state for buttons
        layoutButtons.forEach(button => {
            button.setAttribute('aria-pressed', button.dataset.layout === layoutName ? 'true' : 'false');
        });

        // Save the user's *choice* (e.g., "seasonal-flow"), not the derived class
        try {
            localStorage.setItem(LAYOUT_STORAGE_KEY, layoutName);
        } catch (error) {
            console.error('Error saving layout preference to localStorage:', error);
        }
    }
    window.applyLayout = applyLayout; // Expose globally

    function loadLayoutSettings() {
        let savedLayout = 'default'; // Default to 'default'
        try {
            const storedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
            if (storedLayout) {
                // Ensure only valid layouts are loaded, otherwise default
                const validLayouts = Array.from(layoutButtons).map(btn => btn.dataset.layout);
                if (validLayouts.includes(storedLayout)) {
                    savedLayout = storedLayout;
                } else {
                    console.warn(`Invalid layout '${storedLayout}' found in localStorage. Resetting to default.`);
                    localStorage.setItem(LAYOUT_STORAGE_KEY, 'default'); // Correct the stored value
                }
            }
        } catch (error) {
            console.error('Error reading layout preference from localStorage:', error);
            // Keep default layout if localStorage access fails
        }
        applyLayout(savedLayout);
    }

    if (layoutButtons.length > 0 && dashboardMain) {
        layoutButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                applyLayout(event.target.dataset.layout);
            });
        });
         // Initial load
        loadLayoutSettings();
    } else {
        if (!dashboardMain) console.error('Dashboard main element not found for layout switcher initialization.');
        if (layoutButtons.length === 0) console.warn('No layout selector buttons found for layout switcher.');
    }
});
