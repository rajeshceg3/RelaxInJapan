document.addEventListener('DOMContentLoaded', () => {
    const themeSelectorButtons = document.querySelectorAll('.theme-selector-btn');
    const bodyElement = document.body;
    const previewWidget = document.querySelector('.preview-widget-example');
    const previewText = previewWidget ? previewWidget.querySelector('.preview-text') : null;
    const previewButtonPrimary = previewWidget ? previewWidget.querySelector('.preview-button-primary') : null;
    const previewButtonSecondary = previewWidget ? previewWidget.querySelector('.preview-button-secondary') : null;

    const THEME_STORAGE_KEY = 'selectedDashboardTheme';

    // Function to apply a theme
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
            // Remove existing theme classes from preview widget
            previewWidget.className = previewWidget.className.replace(/theme-\S+/g, '');
            if (themeName !== 'default') {
                previewWidget.classList.add(`theme-${themeName}`);
            }
            // Manually update preview element styles based on the new theme's CSS variables
            // This is a bit more explicit to ensure preview updates correctly without full page style recalculation issues
            updatePreviewStyles(themeName);
        }

        // Save the selected theme to local storage
        localStorage.setItem(THEME_STORAGE_KEY, themeName);
    }

    // Function to update preview styles based on current theme CSS variables
    function updatePreviewStyles(themeName) {
        if (!previewText || !previewButtonPrimary || !previewButtonSecondary) return;

        // Temporarily apply the theme to the body to get computed styles
        const originalBodyClass = bodyElement.className;
        bodyElement.className = ''; // Clear existing classes
        if (themeName !== 'default') {
            bodyElement.classList.add(`theme-${themeName}`);
        }

        const computedStyle = getComputedStyle(bodyElement);

        previewText.style.color = computedStyle.getPropertyValue('--current-text-color').trim() || computedStyle.getPropertyValue('--color-text-deep-charcoal').trim();

        const primaryAccent = computedStyle.getPropertyValue('--current-accent-color').trim() || computedStyle.getPropertyValue('--color-secondary-bamboo-green').trim();
        previewButtonPrimary.style.backgroundColor = primaryAccent;
        previewButtonPrimary.style.borderColor = primaryAccent;
        previewButtonPrimary.style.color = computedStyle.getPropertyValue('--color-primary-warm-white-1').trim();

        const secondaryGrey = computedStyle.getPropertyValue('--color-secondary-zen-grey').trim();
        previewButtonSecondary.style.backgroundColor = secondaryGrey;
        previewButtonSecondary.style.borderColor = secondaryGrey;
        previewButtonSecondary.style.color = computedStyle.getPropertyValue('--current-text-color').trim() || computedStyle.getPropertyValue('--color-text-deep-charcoal').trim();

        // Restore original body class if needed, or re-apply current theme if it was default
        bodyElement.className = originalBodyClass;
         if (themeName === 'default' && !bodyElement.className.includes('theme-')) {
            // If default was selected and no other theme class is present (e.g. weather themes)
            // no specific theme class needs to be on body.
        } else if (themeName !=='default' && !bodyElement.classList.contains(`theme-${themeName}`)){
            bodyElement.classList.add(`theme-${themeName}`);
        }
    }

    // Add event listeners to theme selector buttons
    themeSelectorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const themeName = button.dataset.theme;
            applyTheme(themeName);
        });
    });

    // Load saved theme from local storage on page load
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // If no theme is saved, apply the default and update preview
        applyTheme('default');
    }
});
