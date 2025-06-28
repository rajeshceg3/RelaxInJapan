document.addEventListener('DOMContentLoaded', () => {
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const amPmElement = document.getElementById('am-pm');
    const dateDisplayElement = document.getElementById('date-display');
    const timezoneAbbrElement = document.getElementById('timezone-abbr');
    const settingsButtonElement = document.getElementById('widget-settings-button');
    const settingsPanelElement = document.getElementById('widget-settings-panel');
    const timeFormatToggleElement = document.getElementById('time-format-toggle');
    const timeDateWidgetElement = document.getElementById('time-date-widget');

    let is24HourFormat = localStorage.getItem('timeWidgetFormat') === '24';

    // Set initial state of the toggle
    if (timeFormatToggleElement) {
        timeFormatToggleElement.checked = is24HourFormat;
    }

    function updateTime() {
        const now = new Date(); // Changed 'date' to 'now' for clarity
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');

        if (is24HourFormat) {
            if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
            if (amPmElement) amPmElement.style.display = 'none'; // Hide AM/PM
        } else {
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // Convert hour '0' to '12'
            if (hoursElement) hoursElement.textContent = hours.toString();
            if (amPmElement) {
                amPmElement.textContent = ampm;
                amPmElement.style.display = 'inline'; // Show AM/PM
            }
        }
        if (minutesElement) minutesElement.textContent = minutes;
        if (secondsElement) secondsElement.textContent = seconds;
    }

    // Call updateTime once immediately to display the time when the page loads
    updateTime(); // This needs to be after is24HourFormat is defined.

    // Use setInterval to call updateTime every second
    setInterval(updateTime, 1000);

    // Event listener for settings button
    if (settingsButtonElement && settingsPanelElement) {
        settingsButtonElement.addEventListener('click', () => {
            const isHidden = settingsPanelElement.classList.toggle('hidden');
            settingsButtonElement.setAttribute('aria-expanded', !isHidden); // If panel is not hidden, it's expanded
        });
    }

    // Event listener for time format toggle
    if (timeFormatToggleElement) {
        timeFormatToggleElement.addEventListener('change', () => {
            is24HourFormat = timeFormatToggleElement.checked;
            localStorage.setItem('timeWidgetFormat', is24HourFormat ? '24' : '12');
            updateTime(); // Immediately update time display
        });
    }

    function updateDate() {
        if (!dateDisplayElement) return;
        const date = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = date.toLocaleDateString(undefined, options); // undefined uses default locale
        dateDisplayElement.textContent = formattedDate;
    }

    function scheduleDateUpdate() {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const msUntilMidnight = tomorrow - now;

        setTimeout(() => {
            updateDate();
            displayTimezone(); // Update timezone along with date
            updateSeasonalTheme(); // Update seasonal theme along with date
            scheduleDateUpdate(); // Reschedule for the next day
        }, msUntilMidnight);
    }

    function displayTimezone() {
        if (!timezoneAbbrElement) return;
        try {
            const date = new Date();
            const options = { timeZoneName: 'short' };
            const dateTimeFormat = new Intl.DateTimeFormat(undefined, options);
            const parts = dateTimeFormat.formatToParts(date);
            let shortTzName = '';
            for (const part of parts) {
                if (part.type === 'timeZoneName') {
                    shortTzName = part.value;
                    break;
                }
            }
            // Fallback if abbreviation isn't found, show full name's last part.
            if (!shortTzName) {
                const fullTimeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
                const tzParts = fullTimeZone.split('/');
                shortTzName = tzParts[tzParts.length - 1].replace('_', ' ');
            }
            timezoneAbbrElement.textContent = shortTzName;
        } catch (e) {
            console.error("Error getting timezone:", e);
            timezoneAbbrElement.textContent = ''; // Clear if error
        }
    }

    // Initial calls
    // updateTime(); // Already called above after is24HourFormat is set
    updateDate();
    displayTimezone(); // Initial call for timezone
    updateSeasonalTheme(); // Initial call for seasonal theme
    scheduleDateUpdate();

    function getCurrentSeason(date) {
        const month = date.getMonth() + 1; // 1-12
        const day = date.getDate();

        // Northern hemisphere seasons (approximation)
        // Spring: March 20 - June 20
        if ((month === 3 && day >= 20) || (month > 3 && month < 6) || (month === 6 && day < 21)) return 'spring';
        // Summer: June 21 - September 21
        if ((month === 6 && day >= 21) || (month > 6 && month < 9) || (month === 9 && day < 22)) return 'summer';
        // Autumn: September 22 - December 20
        if ((month === 9 && day >= 22) || (month > 9 && month < 12) || (month === 12 && day < 21)) return 'autumn';
        // Winter: December 21 - March 19
        return 'winter';
    }

    function updateSeasonalTheme() {
        if (timeDateWidgetElement) {
            const currentSeason = getCurrentSeason(new Date());
            // Remove old season classes
            timeDateWidgetElement.classList.remove('time-widget-spring', 'time-widget-summer', 'time-widget-autumn', 'time-widget-winter');
            // Add current season class
            timeDateWidgetElement.classList.add(`time-widget-${currentSeason}`);
            // console.log(`Current season: ${currentSeason}`); // For debugging
        }
    }
});
