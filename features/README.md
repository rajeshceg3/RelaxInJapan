# Feature map - RelaxInJapan (Serene Dashboard)

| Feature | Entry point | Proven by |
| --- | --- | --- |
| Rotating image gallery with categories, lightbox | `js/gallery.js` | jest gallery.test.js, calm-browser |
| Journaling widget with backup/recovery | `js/journaling-widget.js` | journal-recovery.test.js, journal-browser |
| Meditation timer (durations, pomodoro, breathing guide) | `js/meditation-timer.js` | meditation-timer.test.js, timer-browser |
| Quick links | `js/quick-links.js` | quick-link-data.test.js, quick-links-browser |
| Layouts and preference persistence | `js/layout-switcher.js` | calm-data across 5 layouts |

The automated proof lives in `.cursor/skills/verify-relax-in-japan/`.
