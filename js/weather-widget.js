/**
 * @file weather-widget.js
 * Implements the functionality for a weather widget on the dashboard.
 * This includes fetching weather data from an API (OpenWeatherMap assumed),
 * displaying current weather and a 5-day forecast, allowing manual location search,
 * caching data in localStorage, managing recent locations, applying weather-influenced
 * themes to the dashboard, and providing loading messages.
 */
(function() {
    'use strict'; // Enforces stricter parsing and error handling in JavaScript.

    // Event listener for when the DOM content is fully loaded and parsed.
    document.addEventListener('DOMContentLoaded', () => {
        // --- Constants and Configuration ---
        const API_KEY = 'YOUR_API_KEY'; // Placeholder for the OpenWeatherMap API key. MUST be replaced.
        const MAX_RECENT_LOCATIONS = 5; // Maximum number of recent locations to store.
        const CURRENT_WEATHER_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds.
        const FORECAST_REFRESH_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours in milliseconds.

        // Base path for weather icon images.
        const iconBasePath = 'images/weather-icons/';
        // Mapping of OpenWeatherMap icon codes to local SVG icon filenames.
        const weatherIconMap = {
            '01d': 'sunny.svg', '01n': 'sunny-night.svg', // Clear sky day/night
            '02d': 'cloudy.svg', '02n': 'cloudy-night.svg',// Few clouds day/night
            '03d': 'cloudy.svg', '03n': 'cloudy.svg',      // Scattered clouds
            '04d': 'overcast.svg', '04n': 'overcast.svg',  // Broken clouds / Overcast
            '09d': 'rain.svg', '09n': 'rain.svg',          // Shower rain
            '10d': 'rain.svg', '10n': 'rain.svg',          // Rain
            '11d': 'storm.svg', '11n': 'storm.svg',        // Thunderstorm
            '13d': 'snow.svg', '13n': 'snow.svg',          // Snow
            '50d': 'fog.svg', '50n': 'fog.svg',            // Mist/Fog
            'default': 'default.svg'                       // Fallback icon
        };

        // --- DOM Element Selectors ---
        // References to various HTML elements used by the widget.
        const weatherLocationEl = document.getElementById('weather-location');
        const weatherTempCurrentEl = document.getElementById('weather-temp-current');
        const weatherConditionEl = document.getElementById('weather-condition');
        const weatherIconCurrentEl = document.getElementById('weather-icon-current');
        const weatherTempFeelsLikeEl = document.getElementById('weather-temp-feels-like');
        const weatherHumidityEl = document.getElementById('weather-humidity');
        const weatherWindEl = document.getElementById('weather-wind');
        const weatherLastUpdatedEl = document.getElementById('weather-last-updated');
        const weatherForecastDailyEl = document.getElementById('weather-forecast-daily');
        const weatherLocationSearchEl = document.getElementById('weather-location-search');
        const weatherRefreshButtonEl = document.getElementById('weather-refresh-button');

        // --- Application State Variables ---
        let currentLatitude = null;     // Stores the latitude of the current active location.
        let currentLongitude = null;    // Stores the longitude of the current active location.
        let currentCityName = null;     // Stores the name of the current active city if searched manually.
        let currentWeatherIntervalId = null; // ID for the current weather refresh timer.
        let forecastIntervalId = null;     // ID for the forecast refresh timer.
        let initialLoadComplete = false; // Flag to track if the first weather display (cache or API) has happened.

        /**
         * Converts wind degrees to a cardinal direction string.
         * @param {number} degrees - Wind direction in degrees.
         * @returns {string} Cardinal direction (e.g., N, NE, E).
         */
        function convertWindDirection(degrees) {
            if (typeof degrees !== 'number' || isNaN(degrees)) return '---';
            const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            return directions[Math.round(degrees / 22.5) % 16];
        }

        /**
         * Applies a weather-influenced theme to the dashboard body.
         * Determines the theme based on current weather conditions (main condition and icon for night).
         * Reads a flag from localStorage to allow disabling this feature.
         * @param {object} weatherData - Current weather data from the API.
         */
        function applyWeatherTheme(weatherData) {
            // Check if theming is enabled in localStorage (defaults to true).
            const themingEnabled = localStorage.getItem('weatherThemingEnabled') === null ? true : localStorage.getItem('weatherThemingEnabled') === 'true';
            const bodyEl = document.body;

            // Always remove any existing theme classes first to reset to default.
            bodyEl.classList.remove('theme-sunny', 'theme-rainy', 'theme-snowy', 'theme-cloudy', 'theme-night');

            if (!themingEnabled || !weatherData || !weatherData.weather || !weatherData.weather[0]) {
                console.log('Weather theming disabled or data missing, removing themes.');
                return; // Exit if theming is disabled or essential data is missing.
            }

            const mainCondition = weatherData.weather[0].main.toLowerCase();
            const iconCode = weatherData.weather[0].icon; // e.g., "01d", "01n"
            let selectedThemeClass = '';

            // Night theme takes precedence if the icon code indicates night time.
            if (iconCode.endsWith('n')) {
                selectedThemeClass = 'theme-night';
            } else {
                // Determine theme based on the main weather condition for daytime.
                switch (mainCondition) {
                    case 'clear': selectedThemeClass = 'theme-sunny'; break;
                    case 'rain': case 'drizzle': case 'thunderstorm': selectedThemeClass = 'theme-rainy'; break;
                    case 'snow': selectedThemeClass = 'theme-snowy'; break;
                    case 'clouds': case 'mist': case 'smoke': case 'haze': case 'dust': case 'fog': case 'sand': case 'ash': case 'squall': case 'tornado':
                        selectedThemeClass = 'theme-cloudy'; break;
                    default:
                        selectedThemeClass = 'theme-cloudy'; // Default to a neutral theme for unknown conditions.
                        console.log(`Unknown weather condition for theming: ${mainCondition}, defaulting to cloudy.`);
                }
            }

            if (selectedThemeClass) {
                bodyEl.classList.add(selectedThemeClass);
                console.log(`Applied theme: ${selectedThemeClass}`);
            }
        }

        /**
         * Updates the UI elements with current weather data.
         * @param {object} data - The current weather data object from the API.
         * @param {boolean} [isCached=false] - Flag indicating if the data is from localStorage.
         * @param {number} [cachedTimestamp=null] - Timestamp of when the cached data was saved.
         */
        function updateCurrentWeatherUI(data, isCached = false, cachedTimestamp = null) {
            if (!data || !data.name || !data.sys || !data.main || !data.weather || !data.wind) {
                console.error('Current weather data is incomplete:', data);
                weatherConditionEl.textContent = 'Weather data unavailable.';
                initialLoadComplete = true; // Mark load as complete even on error to prevent repeated "Fetching location..."
                return;
            }
            const iconCode = data.weather[0].icon;
            const iconFilename = weatherIconMap[iconCode] || weatherIconMap['default'];
            const weatherDescription = data.weather[0].description;

            // Update DOM elements with current weather information.
            weatherLocationEl.textContent = `${data.name}, ${data.sys.country}`;
            weatherTempCurrentEl.innerHTML = `${Math.round(data.main.temp)}&deg;C`;
            weatherConditionEl.textContent = weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1);
            weatherIconCurrentEl.innerHTML = `<img src="${iconBasePath}${iconFilename}" alt="${weatherDescription}" class="weather-icon">`;
            weatherTempFeelsLikeEl.textContent = `Feels like: ${Math.round(data.main.feels_like)}°C`;
            weatherHumidityEl.textContent = `Humidity: ${data.main.humidity}%`;
            weatherWindEl.textContent = `Wind: ${data.wind.speed.toFixed(1)} m/s ${convertWindDirection(data.wind.deg)}`;
            const updatedTime = isCached && cachedTimestamp ? new Date(cachedTimestamp) : new Date();
            weatherLastUpdatedEl.textContent = `Updated: ${isCached ? '(cached) ' : ''}${updatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            applyWeatherTheme(data); // Apply weather-based theme.
            initialLoadComplete = true; // Mark that the initial UI update has occurred.
        }

        /**
         * Processes the raw 3-hourly forecast data from OpenWeatherMap into a daily summary.
         * It calculates min/max temperatures and determines a representative condition/icon for each day.
         * @param {Array} forecastList - The 'list' array from the OpenWeatherMap forecast API response.
         * @returns {Array} An array of objects, each representing a day's forecast summary.
         */
        function processForecastData(forecastList) {
            if (!forecastList || forecastList.length === 0) return [];
            const dailyData = {}; // Object to hold aggregated data for each day.

            // Group forecast items by day.
            forecastList.forEach(item => {
                const date = new Date(item.dt * 1000); // Convert UNIX timestamp to JS Date.
                const dayKey = date.toISOString().split('T')[0]; // Use YYYY-MM-DD as a key.

                if (!dailyData[dayKey]) {
                    // Initialize structure for a new day.
                    dailyData[dayKey] = {
                        date: date, temps: [], conditions: {}, icons: {},
                        dt: item.dt, lowTemp: item.main.temp_min, highTemp: item.main.temp_max,
                        weatherObjects: [] // Store all weather objects for the day for more detailed analysis if needed.
                    };
                } else {
                    // Update daily min/max temperatures.
                    if (item.main.temp_min < dailyData[dayKey].lowTemp) dailyData[dayKey].lowTemp = item.main.temp_min;
                    if (item.main.temp_max > dailyData[dayKey].highTemp) dailyData[dayKey].highTemp = item.main.temp_max;
                }
                dailyData[dayKey].temps.push(item.main.temp); // Collect all temperatures for potential averaging.
                dailyData[dayKey].weatherObjects.push(item.weather[0]); // Store weather condition object.

                // Count occurrences of main weather conditions and icons to find the most frequent.
                const mainCondition = item.weather[0].main;
                dailyData[dayKey].conditions[mainCondition] = (dailyData[dayKey].conditions[mainCondition] || 0) + 1;
                const icon = item.weather[0].icon;
                dailyData[dayKey].icons[icon] = (dailyData[dayKey].icons[icon] || 0) + 1;
            });

            // Map aggregated daily data to a simpler format for UI display.
            return Object.values(dailyData).map(day => {
                const mostFrequentConditionText = Object.keys(day.conditions).reduce((a, b) => day.conditions[a] > day.conditions[b] ? a : b, 'N/A');
                const mostFrequentIconCode = Object.keys(day.icons).reduce((a, b) => day.icons[a] > day.icons[b] ? a : b, 'default'); // Fallback to 'default' icon code.

                // Use the description from the first weather entry of the day as a representative description.
                let representativeDescription = mostFrequentConditionText;
                if (day.weatherObjects.length > 0) representativeDescription = day.weatherObjects[0].description;

                return {
                    dayName: day.date.toLocaleDateString('en-US', { weekday: 'short' }), // e.g., "Mon"
                    dt: day.dt, // Keep one timestamp for sorting.
                    highTemp: day.highTemp,
                    lowTemp: day.lowTemp,
                    condition: representativeDescription.charAt(0).toUpperCase() + representativeDescription.slice(1), // Capitalized condition for alt text.
                    iconCode: mostFrequentIconCode // Use the most frequent icon for the day.
                };
            }).sort((a, b) => a.dt - b.dt).slice(0, 5); // Sort by date and take the first 5 days.
        }

        /**
         * Updates the UI with the 5-day weather forecast.
         * @param {object} data - The forecast data object from the API (expects a 'list' property).
         */
        function updateForecastUI(data) {
            if (!data || !data.list) {
                weatherForecastDailyEl.innerHTML = '<span>Forecast data unavailable.</span>'; return;
            }
            const processedForecast = processForecastData(data.list);
            weatherForecastDailyEl.innerHTML = ''; // Clear previous forecast.
            const todayDateString = new Date().toISOString().split('T')[0];

            processedForecast.forEach((dayData, index) => {
                const dayDiv = document.createElement('div');
                dayDiv.classList.add('forecast-day');
                // Highlight today's forecast if it's the first item and matches current date.
                if (index === 0 && new Date(dayData.dt * 1000).toISOString().split('T')[0] === todayDateString) dayDiv.classList.add('today');

                const forecastIconFilename = weatherIconMap[dayData.iconCode] || weatherIconMap['default'];
                dayDiv.innerHTML = `
                    <span class="day-name">${dayData.dayName}</span>
                    <img src="${iconBasePath}${forecastIconFilename}" alt="${dayData.condition}" class="weather-icon-small">
                    <span class="temps">${Math.round(dayData.highTemp)}&deg;/${Math.round(dayData.lowTemp)}&deg;</span>`;
                weatherForecastDailyEl.appendChild(dayDiv);
            });
        }

        /**
         * Saves weather data (current and forecast) to localStorage for caching.
         * @param {object} currentData - Current weather data.
         * @param {object} forecastData - Forecast weather data.
         */
        function saveWeatherDataToCache(currentData, forecastData) {
            const cache = { current: currentData, forecast: forecastData, timestamp: new Date().getTime() };
            localStorage.setItem('cachedWeatherData', JSON.stringify(cache));
        }

        /**
         * Loads and displays weather data from localStorage if available.
         * @returns {boolean} True if cached data was loaded and displayed, false otherwise.
         */
        function loadCachedData() {
            const cachedJSON = localStorage.getItem('cachedWeatherData');
            if (cachedJSON) {
                try {
                    const cached = JSON.parse(cachedJSON);
                    if (cached.current && cached.forecast && cached.timestamp) {
                        updateCurrentWeatherUI(cached.current, true, cached.timestamp);
                        updateForecastUI(cached.forecast);
                        console.log('Displayed cached weather data.');
                        return true; // Cached data loaded successfully.
                    }
                } catch (e) {
                    console.error('Error parsing cached weather data:', e);
                    localStorage.removeItem('cachedWeatherData'); // Clear corrupted cache.
                }
            }
            return false; // No valid cached data found.
        }

        /**
         * Adds a successfully fetched location to a list of recent locations in localStorage.
         * Keeps the list size limited to MAX_RECENT_LOCATIONS.
         * @param {object} location - Location object (name, type, lat/lon or query).
         */
        function addRecentLocation(location) {
            if (!location || !location.name) return;
            let recentLocations = JSON.parse(localStorage.getItem('recentLocations')) || [];
            // Remove location if it already exists to move it to the front (most recent).
            recentLocations = recentLocations.filter(loc => loc.name.toLowerCase() !== location.name.toLowerCase());
            recentLocations.unshift(location); // Add to the beginning.
            if (recentLocations.length > MAX_RECENT_LOCATIONS) recentLocations.pop(); // Remove the oldest if list exceeds max size.
            localStorage.setItem('recentLocations', JSON.stringify(recentLocations));
        }

        /**
         * Generic helper to fetch data from an API URL.
         * @param {string} url - The API endpoint URL.
         * @param {string} type - Type of data being fetched (e.g., 'current', 'forecast') for error logging.
         * @returns {Promise<object|null>} A promise that resolves with the JSON data or null if not critical and not found.
         * @throws {Error} If the fetch response is not OK and is critical.
         */
        async function fetchApiData(url, type) {
            const response = await fetch(url);
            if (!response.ok) {
                // Handle critical "city not found" for current weather.
                if (response.status === 404 && type === 'current') throw new Error(`City not found (404).`);
                // For forecast, 404 might be acceptable if current weather is found.
                if (response.status === 404 && type === 'forecast') { console.warn(`${type} data not found (404).`); return null; }
                throw new Error(`HTTP error for ${type}! Status: ${response.status}`);
            }
            return response.json();
        }

        /**
         * Fetches current weather and forecast data using latitude and longitude.
         * Updates UI, caches data, and manages location state.
         * @param {number} latitude - User's latitude.
         * @param {number} longitude - User's longitude.
         * @param {string|null} [fetchOnly=null] - If 'current' or 'forecast', fetches only that part. Otherwise, fetches both.
         */
        async function fetchWeatherData(latitude, longitude, fetchOnly = null) {
            if (API_KEY === 'YOUR_API_KEY' || !API_KEY) { console.error("API Key not set."); weatherLocationEl.textContent = 'API Key Missing'; initialLoadComplete = true; return; }

            // Display loading messages based on the type of fetch.
            if (!fetchOnly) { // Full refresh
                weatherConditionEl.textContent = 'Loading weather...';
                weatherIconCurrentEl.innerHTML = '';
                weatherForecastDailyEl.innerHTML = '';
            } else if (fetchOnly === 'current') { // Current weather only
                weatherConditionEl.textContent = 'Updating current weather...';
            }
            // No specific message for forecast-only, as current weather part is usually more prominent.

            // Update current location state.
            currentLatitude = latitude; currentLongitude = longitude; currentCityName = null;

            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;

            try {
                let currentData, forecastData;
                const cached = JSON.parse(localStorage.getItem('cachedWeatherData'));

                // Fetch current weather if needed or not specified as 'forecast' only.
                if (fetchOnly === 'current' || !fetchOnly) currentData = await fetchApiData(currentWeatherUrl, 'current');
                else if (cached && cached.current) currentData = cached.current; // Use cache if only fetching forecast.

                // Fetch forecast if needed or not specified as 'current' only.
                if (fetchOnly === 'forecast' || !fetchOnly) forecastData = await fetchApiData(forecastUrl, 'forecast');
                else if (cached && cached.forecast) forecastData = cached.forecast; // Use cache if only fetching current.

                if (currentData) {
                    updateCurrentWeatherUI(currentData); // This also calls applyWeatherTheme.
                    const locName = `${currentData.name}, ${currentData.sys.country}`;
                    const locObj = { name: locName, type: 'coords', lat: latitude, lon: longitude };
                    localStorage.setItem('lastActiveLocation', JSON.stringify(locObj)); addRecentLocation(locObj);
                }
                if (forecastData) updateForecastUI(forecastData);

                // Update cache based on what was fetched and what might have been in cache.
                if (currentData && forecastData) saveWeatherDataToCache(currentData, forecastData);
                else if (currentData && fetchOnly === 'current' && cached && cached.forecast) saveWeatherDataToCache(currentData, cached.forecast);
                else if (forecastData && fetchOnly === 'forecast' && cached && cached.current) saveWeatherDataToCache(cached.current, forecastData);

                resetRefreshTimers(); // Reset automatic refresh timers after successful fetch.
            } catch (error) {
                console.error('Error fetching weather data by coords:', error);
                weatherConditionEl.textContent = error.message.includes("404") ? 'Location not found.' : 'Could not fetch weather.';
                if (!loadCachedData()) applyWeatherTheme(null); // Attempt to load cache; if fails, clear theme.
                initialLoadComplete = true; // Mark load as complete to prevent re-showing "Fetching location..."
            }
        }

        /**
         * Fetches current weather and forecast data using a city name.
         * Similar to fetchWeatherData but uses city name for API query.
         * @param {string} cityName - Name of the city to search for.
         * @param {string|null} [fetchOnly=null] - If 'current' or 'forecast', fetches only that part.
         */
        async function fetchWeatherByCityName(cityName, fetchOnly = null) {
            if (API_KEY === 'YOUR_API_KEY' || !API_KEY) { console.error("API Key not set."); weatherLocationEl.textContent = 'API Key Missing'; initialLoadComplete = true; return; }
            if (!cityName) { weatherLocationEl.textContent = 'Please enter a city name.'; initialLoadComplete = true; return; }

            // Display loading messages.
            if (!fetchOnly) {
                weatherConditionEl.textContent = 'Loading weather...';
                weatherIconCurrentEl.innerHTML = '';
                weatherForecastDailyEl.innerHTML = '';
            } else if (fetchOnly === 'current') {
                weatherConditionEl.textContent = 'Updating current weather...';
            }

            // Update current location state.
            currentCityName = cityName; currentLatitude = null; currentLongitude = null;
            weatherLocationEl.textContent = `Loading ${cityName}...`; // Specific loading message for city search.

            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`;

            try {
                let currentData, forecastData;
                const cached = JSON.parse(localStorage.getItem('cachedWeatherData'));

                if (fetchOnly === 'current' || !fetchOnly) currentData = await fetchApiData(currentWeatherUrl, 'current');
                else if (cached && cached.current) currentData = cached.current;

                if (fetchOnly === 'forecast' || !fetchOnly) {
                    if (currentData) forecastData = await fetchApiData(forecastUrl, 'forecast'); // Only fetch forecast if current data was successful.
                    else if (!fetchOnly) throw new Error(`City "${cityName}" not found, cannot fetch forecast.`); // If full fetch and current failed.
                } else if (cached && cached.forecast) forecastData = cached.forecast;

                if (currentData) {
                    updateCurrentWeatherUI(currentData); // Also calls applyWeatherTheme.
                    const locName = `${currentData.name}, ${currentData.sys.country}`;
                    const locObj = { name: locName, type: 'city', query: cityName };
                    localStorage.setItem('lastActiveLocation', JSON.stringify(locObj)); addRecentLocation(locObj);
                }
                if (forecastData) updateForecastUI(forecastData);

                // Cache update logic.
                if (currentData && forecastData) saveWeatherDataToCache(currentData, forecastData);
                else if (currentData && fetchOnly === 'current' && cached && cached.forecast) saveWeatherDataToCache(currentData, cached.forecast);
                else if (forecastData && fetchOnly === 'forecast' && cached && cached.current) saveWeatherDataToCache(cached.current, forecastData);

                resetRefreshTimers();
            } catch (error) {
                console.error('Error fetching weather data by city:', error);
                weatherLocationEl.textContent = `Error for ${cityName}.`;
                weatherConditionEl.textContent = error.message.includes("404") || error.message.includes("not found") ? `City "${cityName}" not found.` : 'Could not fetch data.';
                if (!loadCachedData()) applyWeatherTheme(null); // Attempt cache, then clear theme on failure.
                initialLoadComplete = true;
            }
        }

        /**
         * Refreshes only the current weather data using the last known location context.
         */
        function refreshCurrentWeather() {
            console.log("Refreshing current weather...");
            if (currentLatitude && currentLongitude) fetchWeatherData(currentLatitude, currentLongitude, 'current');
            else if (currentCityName) fetchWeatherByCityName(currentCityName, 'current');
            else console.log("No active location to refresh current weather.");
        }

        /**
         * Refreshes only the forecast data using the last known location context.
         */
        function refreshForecast() {
            console.log("Refreshing forecast...");
            if (currentLatitude && currentLongitude) fetchWeatherData(currentLatitude, currentLongitude, 'forecast');
            else if (currentCityName) fetchWeatherByCityName(currentCityName, 'forecast');
            else console.log("No active location to refresh forecast.");
        }

        /**
         * Clears existing automatic refresh timers for current weather and forecast.
         */
        function clearRefreshTimers() {
            if (currentWeatherIntervalId) clearInterval(currentWeatherIntervalId);
            if (forecastIntervalId) clearInterval(forecastIntervalId);
        }

        /**
         * Resets (or starts) the automatic refresh timers for current weather and forecast.
         * Clears any existing timers before setting new ones.
         */
        function resetRefreshTimers() {
            clearRefreshTimers();
            currentWeatherIntervalId = setInterval(refreshCurrentWeather, CURRENT_WEATHER_REFRESH_INTERVAL);
            forecastIntervalId = setInterval(refreshForecast, FORECAST_REFRESH_INTERVAL);
            console.log("Weather refresh timers reset.");
        }

        /**
         * Handles a manual refresh request triggered by the user.
         * Clears existing timers, fetches fresh data for the current location context,
         * and then relies on the successful fetch to reset the timers.
         */
        function forceRefreshData() {
            console.log("Manual refresh triggered.");
            // Set loading messages for full refresh
            weatherConditionEl.textContent = 'Refreshing weather data...';
            weatherIconCurrentEl.innerHTML = '';
            weatherForecastDailyEl.innerHTML = '';

            clearRefreshTimers();
            if (currentLatitude && currentLongitude) fetchWeatherData(currentLatitude, currentLongitude);
            else if (currentCityName) fetchWeatherByCityName(currentCityName);
            else getUserLocation(); // Fallback to full geolocation attempt if no context.
        }

        /**
         * Attempts to get the user's current location using browser geolocation.
         * On success, fetches weather data. On failure, tries to use the last known location
         * or prompts the user for manual input.
         */
        function getUserLocation() {
            // Show "Fetching location..." only if no cache was loaded and it's the very first attempt.
            if (!initialLoadComplete && !localStorage.getItem('cachedWeatherData')) {
                 weatherConditionEl.textContent = 'Fetching location...';
            }
            weatherLocationEl.textContent = 'Loading location...'; // General status for location display.

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => fetchWeatherData(position.coords.latitude, position.coords.longitude),
                    (error) => { // Geolocation failed or was denied.
                        console.error('Error getting user location:', error);
                        weatherLocationEl.textContent = 'Location denied.';
                        weatherConditionEl.textContent = 'Using last known or default.';
                        // Try to use the last successfully used location from localStorage.
                        const lastLocation = JSON.parse(localStorage.getItem('lastActiveLocation'));
                        if (lastLocation) {
                            if (lastLocation.type === 'coords') fetchWeatherData(lastLocation.lat, lastLocation.lon);
                            else if (lastLocation.type === 'city') fetchWeatherByCityName(lastLocation.query);
                        } else { // No last location, prompt for manual input.
                            weatherLocationEl.textContent = 'Location needed.';
                            weatherConditionEl.textContent = 'Enter city or allow location.';
                            applyWeatherTheme(null); // Clear theme if no location is available.
                            initialLoadComplete = true;
                        }
                    }
                );
            } else { // Geolocation is not supported by the browser.
                console.error('Geolocation is not supported.');
                weatherLocationEl.textContent = 'Geolocation not supported.';
                const lastLocation = JSON.parse(localStorage.getItem('lastActiveLocation'));
                if (lastLocation) { // Try last active location.
                    if (lastLocation.type === 'coords') fetchWeatherData(lastLocation.lat, lastLocation.lon);
                    else if (lastLocation.type === 'city') fetchWeatherByCityName(lastLocation.query);
                } else { // No support, no last location, prompt for manual input.
                   weatherConditionEl.textContent = 'Enter city manually.';
                   applyWeatherTheme(null); // Clear theme.
                   initialLoadComplete = true;
                }
            }
        }

        /**
         * Handles the location search input.
         * Triggers a weather data fetch by city name when Enter is pressed or input changes.
         */
        function handleLocationSearch() {
            const searchTerm = weatherLocationSearchEl.value.trim();
            if (searchTerm) {
                clearRefreshTimers(); // Stop automatic refreshes during manual search.
                fetchWeatherByCityName(searchTerm); // Loading messages are set within this function.
                weatherLocationSearchEl.value = ''; // Clear input field after search.
            }
        }

        // --- Event Listeners ---
        // Attach event listener to the refresh button.
        if (weatherRefreshButtonEl) weatherRefreshButtonEl.addEventListener('click', forceRefreshData);
        // Attach event listener to the location search input field (for Enter key).
        if (weatherLocationSearchEl) weatherLocationSearchEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLocationSearch(); });

        // --- Initialization Logic ---
        // On script load:
        // 1. Attempt to load and display data from cache for a quick initial UI update.
        initialLoadComplete = loadCachedData();
        // 2. If no cached data was displayed, ensure no theme is applied (or a default one if desired).
        if (!initialLoadComplete) {
            applyWeatherTheme(null);
        }
        // 3. Attempt to get the user's current location and fetch fresh weather data.
        //    Automatic refresh timers will be started/reset after a successful data fetch.
        getUserLocation();
    });
})();
