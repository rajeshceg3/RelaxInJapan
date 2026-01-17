/**
 * @file ui-polish.js
 * Adds "World Class" UI details:
 * - Dynamic Welcome Message
 * - Parallax Tilt Effect for Widgets (Desktop)
 * - Smooth Entry Animations
 */

document.addEventListener('DOMContentLoaded', () => {
    initDynamicGreeting();
    initParallaxTilt();
    revealDashboard();
});

function revealDashboard() {
    // Ensure the dashboard fades in smoothly
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 1.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
        document.body.style.opacity = '1';
    });
}

function initDynamicGreeting() {
    const welcomeHeading = document.querySelector('.welcome-message h2');
    if (!welcomeHeading) return;

    const hour = new Date().getHours();
    let greeting = 'Welcome to your serene space.';

    if (hour >= 5 && hour < 12) {
        greeting = 'Good morning.';
    } else if (hour >= 12 && hour < 18) {
        greeting = 'Good afternoon.';
    } else if (hour >= 18 || hour < 5) {
        greeting = 'Good evening.';
    }

    // Smooth text transition
    welcomeHeading.style.opacity = 0;
    setTimeout(() => {
        welcomeHeading.textContent = greeting;
        welcomeHeading.style.transition = 'opacity 1s ease';
        welcomeHeading.style.opacity = 1;
    }, 500);
}

function initParallaxTilt() {
    // Only apply on devices that support hover (Desktop)
    if (!window.matchMedia('(hover: hover)').matches) return;

    const cards = document.querySelectorAll('.widget');

    cards.forEach(card => {
        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);
        card.addEventListener('mouseenter', handleMouseEnter);
    });
}

function handleMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate rotation (max 2 degrees for subtle effect)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -2; // Invert Y axis
    const rotateY = ((x - centerX) / centerX) * 2;

    // Apply transform with a bit of lerp handled by CSS transition usually,
    // but for mousemove we want instant or very fast.
    // However, our CSS has a transition on 'transform'.
    // We need to temporarily disable transition for strictly mousemove to avoid lag,
    // OR ensure the transition is very fast/springy.

    // Let's use a specialized variable approach or inline style override.
    // Inline style is easiest for this specific effect.
    card.style.transition = 'transform 0.1s ease-out, box-shadow 0.4s ease'; // Fast transform
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
}

function handleMouseLeave(e) {
    const card = e.currentTarget;

    // Revert to CSS defined transition for smooth return
    card.style.transition = '';
    card.style.transform = ''; // Clear inline transform to let CSS take over (hover state or base state)
}

function handleMouseEnter(e) {
    const card = e.currentTarget;
    // Remove transition initially to snap to start if needed, but usually we want to start smoothing
    // The mousemove will pick it up.
}
