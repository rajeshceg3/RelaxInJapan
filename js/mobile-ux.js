document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('mobile-settings-toggle');
    const sidebar = document.querySelector('.column-sidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');

    // Create backdrop element
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);

    function toggleSidebar() {
        const isVisible = sidebar.classList.toggle('sidebar-visible');
        backdrop.classList.toggle('active', isVisible);
        document.body.style.overflow = isVisible ? 'hidden' : ''; // Prevent background scrolling

        toggleBtn.setAttribute('aria-expanded', isVisible);
    }

    function closeSidebar() {
        sidebar.classList.remove('sidebar-visible');
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
        toggleBtn.setAttribute('aria-expanded', 'false');
    }

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });

        // Close when clicking backdrop
        backdrop.addEventListener('click', closeSidebar);

        // Close when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('sidebar-visible')) {
                closeSidebar();
            }
        });

        // Swipe to close (simple implementation)
        let touchStartX = 0;
        let touchEndX = 0;

        sidebar.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});

        sidebar.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, {passive: true});

        function handleSwipe() {
            if (touchEndX < touchStartX - 50) { // Swipe left
                closeSidebar();
            }
        }
    }
});
