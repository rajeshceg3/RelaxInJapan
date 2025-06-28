document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const opacitySlider = document.getElementById('global-widget-opacity-slider');
    const opacityValueSpan = document.getElementById('global-widget-opacity-value');
    const blurSlider = document.getElementById('widget-background-blur-slider');
    const blurValueSpan = document.getElementById('widget-background-blur-value');
    const presetButtons = document.querySelectorAll('.preset-transparency-btn');

    const WIDGET_OPACITY_KEY = 'globalWidgetOpacity';
    const WIDGET_BLUR_KEY = 'globalWidgetBackgroundBlur';

    function applyOpacity(value) {
        const opacityValue = parseFloat(value);
        root.style.setProperty('--widget-opacity', opacityValue.toString());
        if (opacityValueSpan) {
            opacityValueSpan.textContent = `${Math.round(opacityValue * 100)}%`;
        }
    }

    function applyBlur(value) {
        const blurValue = parseInt(value, 10);
        root.style.setProperty('--widget-background-blur', `${blurValue}px`);
        if (blurValueSpan) {
            blurValueSpan.textContent = `${blurValue}px`;
        }
    }

    function loadSettings() {
        const savedOpacity = localStorage.getItem(WIDGET_OPACITY_KEY);
        const savedBlur = localStorage.getItem(WIDGET_BLUR_KEY);

        let initialOpacity = 1;
        let initialBlur = 0;

        if (savedOpacity !== null) {
            initialOpacity = parseFloat(savedOpacity);
        }
        if (opacitySlider) opacitySlider.value = initialOpacity.toString(); // Set slider position
        applyOpacity(initialOpacity.toString()); // Apply style and text

        if (savedBlur !== null) {
            initialBlur = parseInt(savedBlur, 10);
        }
        if (blurSlider) blurSlider.value = initialBlur.toString(); // Set slider position
        applyBlur(initialBlur.toString()); // Apply style and text
    }

    if (opacitySlider) {
        opacitySlider.addEventListener('input', (event) => {
            const value = event.target.value;
            applyOpacity(value);
            localStorage.setItem(WIDGET_OPACITY_KEY, value);
        });
    } else {
        console.warn('Opacity slider #global-widget-opacity-slider not found.');
    }

    if (blurSlider) {
        blurSlider.addEventListener('input', (event) => {
            const value = event.target.value;
            applyBlur(value);
            localStorage.setItem(WIDGET_BLUR_KEY, value);
        });
    } else {
        console.warn('Blur slider #widget-background-blur-slider not found.');
    }

    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const opacity = button.dataset.opacity;
            const blur = button.dataset.blur;

            if (opacitySlider) {
                opacitySlider.value = opacity;
                opacitySlider.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                applyOpacity(opacity);
                localStorage.setItem(WIDGET_OPACITY_KEY, opacity);
            }

            if (blurSlider) {
                blurSlider.value = blur;
                blurSlider.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                applyBlur(blur);
                localStorage.setItem(WIDGET_BLUR_KEY, blur);
            }
        });
    });

    loadSettings();

    // --- Individual Widget Opacity Controls ---
    const individualOpacitySliders = document.querySelectorAll('.individual-opacity-slider');

    individualOpacitySliders.forEach(slider => {
        const variableName = slider.dataset.widgetVar;
        // Ensure valueSpan is correctly selected relative to each slider
        const valueSpan = slider.parentElement.querySelector('.individual-opacity-value');
        const storageKey = `widgetOpacity_${variableName}`;

        // Function to apply individual opacity
        function applyIndividualOpacity(valueStr) {
            const val = parseFloat(valueStr);
            root.style.setProperty(variableName, val.toString());
            if (valueSpan) { // Check if valueSpan was found
                valueSpan.textContent = `${Math.round(val * 100)}%`;
            } else {
                // console.warn(`Value span not found for slider of ${variableName}`);
            }
        }

        // Load saved setting for this slider
        const savedIndividualOpacity = localStorage.getItem(storageKey);
        let initialIndividualOpacity = 1; // Default to 1 (effectively inherits global or is fully opaque)

        if (savedIndividualOpacity !== null) {
            initialIndividualOpacity = parseFloat(savedIndividualOpacity);
        }
        slider.value = initialIndividualOpacity.toString();
        applyIndividualOpacity(initialIndividualOpacity.toString());

        // Add event listener
        slider.addEventListener('input', (event) => {
            const value = event.target.value;
            applyIndividualOpacity(value);
            localStorage.setItem(storageKey, value);
        });
    });
});
