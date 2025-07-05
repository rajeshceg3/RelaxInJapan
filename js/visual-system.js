document.addEventListener('DOMContentLoaded', () => {
    // --- Background Color Transitions ---
    const palettes = [
        { name: "Sakura Bloom", colors: ["#FFB7C5", "#FFE4E1"] }, // Cherry blossom pinks, misty rose
        { name: "Zen Garden", colors: ["#8FBC8F", "#D3D3D3"] },   // Bamboo green, zen grey
        { name: "Kyoto Sunset", colors: ["#FFDAB9", "#FFA07A"] }, // Peach puff, light salmon (sunset)
        { name: "Ocean Mist", colors: ["#B0E0E6", "#ADD8E6"] },   // Powder blue, light blue (ocean/misty)
        { name: "Forest Depth", colors: ["#2F4F4F", "#556B2F"] }, // Dark slate gray, dark olive green
        { name: "Autumn Leaves", colors: ["#FF7F50", "#DEB887"] } // Coral, Burlywood
    ];
    let currentPaletteIndex = 0;
    const transitionInterval = 45000; // 45 seconds (PRD: 30-60s)

    function changeBackgroundPalette() {
        currentPaletteIndex = (currentPaletteIndex + 1) % palettes.length;
        const newPalette = palettes[currentPaletteIndex];

        document.documentElement.style.setProperty('--dynamic-bg-color1', newPalette.colors[0]);
        document.documentElement.style.setProperty('--dynamic-bg-color2', newPalette.colors[1]);

        // Ensure the body has the class to apply the gradient
        // This could also be added once initially if the gradient is always desired.
        document.body.classList.add('dynamic-gradient-background');

        console.log(`Background palette changed to: ${newPalette.name}`);
    }

    // Initial background set
    if (palettes.length > 0) {
        const initialPalette = palettes[currentPaletteIndex];
        document.documentElement.style.setProperty('--dynamic-bg-color1', initialPalette.colors[0]);
        document.documentElement.style.setProperty('--dynamic-bg-color2', initialPalette.colors[1]);
        document.body.classList.add('dynamic-gradient-background');
    }
    setInterval(changeBackgroundPalette, transitionInterval);

    // --- SVG Background Illustrations ---
    const svgContainer = document.getElementById('background-svg-animations');
    if (svgContainer) {
        const svgs = svgContainer.querySelectorAll('svg');

        svgs.forEach(svg => {
            // Initial random position/transform adjustments (optional)
            // Example: Random initial rotation for some elements
            if (svg.classList.contains('svg-sakura-branch') || svg.classList.contains('svg-enso-circle')) {
                svg.style.transform = `rotate(${Math.random() * 360}deg) scale(${0.8 + Math.random() * 0.4})`;
            } else {
                 svg.style.transform = `scale(${0.9 + Math.random() * 0.2})`;
            }

            // Fade them in
            setTimeout(() => {
                svg.style.opacity = (parseFloat(getComputedStyle(svgContainer).opacity) || 0.3); // Use container's base opacity
            }, Math.random() * 2000 + 500); // Staggered fade-in

            // Subtle continuous animation (example: slow drift)
            // The CSS transition for transform will handle this if we change transform values over time.
            // For more complex continuous animation, JS animation loop (requestAnimationFrame) would be better.
            // For PRD's "subtle parallax on scroll/mouse", we need scroll/mouse listeners.

            // Start a slow drift for elements that are not parallax-controlled (or as a base movement)
            if (!svg.dataset.isParallaxControlled) { // Add this dataset attr if some SVGs are parallax
                animateDrift(svg);
            }
        });

        // Basic Parallax on Mouse Move (optional, as per PRD)
        document.addEventListener('mousemove', (e) => {
            const parallaxSvgs = svgContainer.querySelectorAll('svg[data-parallax-intensity]');
            parallaxSvgs.forEach(svg => {
                const intensity = parseFloat(svg.dataset.parallaxIntensity) || 0.01;
                const x = (window.innerWidth / 2 - e.clientX) * intensity;
                const y = (window.innerHeight / 2 - e.clientY) * intensity;
                // Combine with existing transforms if any (e.g., from animateDrift or initial setup)
                // This is a simple override; a more robust solution would combine transforms.
                svg.style.transform = `translateX(${x}px) translateY(${y}px) ${svg.dataset.baseTransform || ''}`;
            });
        });
    }

    function animateDrift(svgElement) {
        // This is a very basic drift. CSS animations or more sophisticated JS would be better.
        // The current CSS transition on transform is very long (60s), so minor changes will be slow.
        // To make it "continuous", we'd need to update this periodically.
        // This is more of a one-time slow movement based on current CSS.
        const currentTransform = getComputedStyle(svgElement).transform;
        // Note: getComputedStyle returns a matrix. Parsing it is complex.
        // For simplicity, we'll just add a small random translation.
        // This won't "continue" drifting without more logic.

        // Let's assume base transform is handled by CSS classes or initial JS.
        // The 60s transform transition in CSS will make any change slow.
        // For a more continuous "drift", we'd need to use JS requestAnimationFrame.
        // Given the PRD's "subtle parallax", the mouse-based parallax might be the primary "movement".
        // The long CSS transition on transform is more for initial placement or slow, non-interactive changes.
    }

    // Store base transform for SVGs that will have parallax, to combine later
    svgContainer.querySelectorAll('svg[data-parallax-intensity]').forEach(svg => {
        svg.dataset.baseTransform = getComputedStyle(svg).transform;
    });


    console.log("Visual System (Background Colors, SVGs) initialized.");
});
