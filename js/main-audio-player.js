document.addEventListener('DOMContentLoaded', () => {
    const audioPlayerContainer = document.getElementById('main-audio-player-container');
    const trackNameEl = document.getElementById('current-track-name');
    const trackArtistEl = document.getElementById('current-track-artist');
    const currentTimeEl = document.getElementById('current-track-time');
    const durationEl = document.getElementById('current-track-duration');
    const progressBar = document.getElementById('track-progress-bar');
    const prevBtn = document.getElementById('audio-prev-btn');
    const playPauseBtn = document.getElementById('audio-play-pause-btn');
    const nextBtn = document.getElementById('audio-next-btn');
    const volumeSlider = document.getElementById('audio-volume-slider');
    const muteBtn = document.getElementById('audio-mute-btn');

    const playlist = [
        { name: "Zen Garden Serenity", artist: "Aiko Kimura", path: "audio/sample_track_1.mp3", duration: 185 }, // Placeholder duration
        { name: "Kyoto Whispers", artist: "Kenji Tanaka", path: "audio/sample_track_2.mp3", duration: 220 },
        { name: "Sakura Dreams", artist: "Yuki Sato", path: "audio/sample_track_3.mp3", duration: 200 },
        { name: "Forest Bathing", artist: "Haru Nakamura", path: "audio/sample_track_4.mp3", duration: 240 },
        { name: "Moonlit Pagoda", artist: "Ren Ito", path: "audio/sample_track_5.mp3", duration: 190 },
        { name: "Silent Reflection", artist: "Mei Suzuki", path: "audio/sample_track_6.mp3", duration: 210 },
        { name: "River Flow", artist: "Kaito Takahashi", path: "audio/sample_track_7.mp3", duration: 230 },
        { name: "Ancient Echoes", artist: "Sora Yamada", path: "audio/sample_track_8.mp3", duration: 205 },
        { name: "Morning Mist", artist: "Rin Kobayashi", path: "audio/sample_track_9.mp3", duration: 195 },
        { name: "Evening Calm", artist: "Daiki Watanabe", path: "audio/sample_track_10.mp3", duration: 215 }
    ];

    let audioContext;
    let primaryAudioElement; // Main audio element for playback
    let nextAudioElement; // For preloading next track
    let gainNode;
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isMuted = false;
    let lastVolume = 0.5;
    let crossfadeTimeout;

    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
            primaryAudioElement = new Audio();
            primaryAudioElement.crossOrigin = "anonymous"; // If loading from different origin
            const sourcePrimary = audioContext.createMediaElementSource(primaryAudioElement);
            sourcePrimary.connect(gainNode);

            nextAudioElement = new Audio();
            nextAudioElement.crossOrigin = "anonymous";
            // We don't connect nextAudioElement to graph until it's swapped

            primaryAudioElement.addEventListener('loadedmetadata', updateDurationDisplay);
            primaryAudioElement.addEventListener('timeupdate', updateProgress);
            primaryAudioElement.addEventListener('ended', handleTrackEnd);
            primaryAudioElement.addEventListener('error', handleAudioError);
            nextAudioElement.addEventListener('error', handleAudioError);

            // Show the player once initialized by removing the initially hidden class
            if (audioPlayerContainer) {
                audioPlayerContainer.classList.remove('player-initially-hidden');
                // No need to add 'player-visible' if the default state is visible
                // and transitions are on opacity/visibility.
            }
        }
    }

    function loadTrack(index, isPreload = false) {
        const track = playlist[index];
        const targetAudioElement = isPreload ? nextAudioElement : primaryAudioElement;

        targetAudioElement.src = track.path;
        targetAudioElement.load(); // Important to actually load it

        if (!isPreload) {
            trackNameEl.textContent = track.name;
            trackArtistEl.textContent = track.artist;
            // Duration will be updated by 'loadedmetadata' event
            if (isPlaying) {
                primaryAudioElement.play().catch(e => console.warn("Play interrupted or failed:", e));
            }
            // Preload the *next* track after the current one is loaded
            preloadNextTrack((index + 1) % playlist.length);
        }
    }

    function preloadNextTrack(nextIndex) {
        if (!nextAudioElement) return;
        const trackToPreload = playlist[nextIndex];
        nextAudioElement.src = trackToPreload.path;
        nextAudioElement.load(); // Start loading
        console.log(`Preloading: ${trackToPreload.name}`);
    }


    function playPause() {
        if (!audioContext) initAudioContext();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (isPlaying) {
            primaryAudioElement.pause();
            isPlaying = false;
            playPauseBtn.innerHTML = '&#9654;'; // Play icon
            playPauseBtn.setAttribute('aria-label', 'Play');
        } else {
            if (!primaryAudioElement.src) { // If no track is loaded yet (e.g., first play)
                loadTrack(currentTrackIndex);
            }
            primaryAudioElement.play().then(() => {
                isPlaying = true;
                playPauseBtn.innerHTML = '&#10074;&#10074;'; // Pause icon
                playPauseBtn.setAttribute('aria-label', 'Pause');
            }).catch(e => {
                console.error("Error playing audio:", e);
                // Attempt to play with user gesture if autoplay fails
                if (e.name === 'NotAllowedError') {
                    requestUserInteractionForPlayback();
                }
            });
        }
    }

    function requestUserInteractionForPlayback() {
        // Simple alert, could be a more integrated UI element
        alert("Audio playback requires user interaction. Click Play to start.");
        // Ensure play button is in "Play" state
        isPlaying = false;
        playPauseBtn.innerHTML = '&#9654;';
        playPauseBtn.setAttribute('aria-label', 'Play');
    }

    function handleTrackEnd() {
        console.log("Track ended, starting crossfade to next.");
        // Smooth transition: Fade out current, fade in next
        // For simplicity here, we'll do a quick switch. PRD requests crossfading.

        if (gainNode && audioContext) {
            // Fade out current track
            gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.5); // Fade out over 0.5s

            clearTimeout(crossfadeTimeout);
            crossfadeTimeout = setTimeout(() => {
                currentTrackIndex = (currentTrackIndex + 1) % playlist.length;

                // Swap audio elements
                let temp = primaryAudioElement;
                primaryAudioElement = nextAudioElement;
                nextAudioElement = temp;

                // Reconnect the new primaryAudioElement to the audio graph
                // Important: Disconnect old source if it exists, create and connect new one.
                // This part is tricky with MediaElementSourceNode as it can only be connected once.
                // A more robust solution would involve creating a new MediaElementSourceNode each time.
                // For now, we assume the initial connection holds or re-establish.
                // This might require re-creating the source node if errors occur.
                // Let's try reloading the track into the (now) primary element
                // and then ensuring it's connected.

                // Minimal approach: just load and play. If issues, need to recreate MediaElementSource
                loadTrack(currentTrackIndex);
                primaryAudioElement.play().catch(e => console.warn("Play after swap failed:", e));

                // Fade in new track
                gainNode.gain.setTargetAtTime(parseFloat(volumeSlider.value), audioContext.currentTime, 0.5); // Fade in over 0.5s

                if (!isPlaying) { // If player was paused, then track ended naturally, keep it paused on new track
                    primaryAudioElement.pause();
                } else { // If it was playing, ensure new track plays and UI is correct
                    isPlaying = true;
                    playPauseBtn.innerHTML = '&#10074;&#10074;';
                    playPauseBtn.setAttribute('aria-label', 'Pause');
                }

                preloadNextTrack((currentTrackIndex + 1) % playlist.length);

            }, 1000); // Start switch after 1 second (allows fade out)
        } else { // Fallback if no Web Audio API for crossfade
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
            loadTrack(currentTrackIndex);
            if (isPlaying) primaryAudioElement.play().catch(e => console.warn("Fallback play failed:", e));
        }
    }

    function prevTrack() {
        currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        loadTrack(currentTrackIndex);
    }

    function nextTrack() {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
    }

    function setVolume() {
        if (!audioContext) initAudioContext();
        lastVolume = parseFloat(volumeSlider.value);
        if (gainNode) gainNode.gain.value = lastVolume;
        isMuted = false; // Unmute if volume is changed manually
        muteBtn.innerHTML = '&#128266;'; // Speaker icon
        muteBtn.setAttribute('aria-label', 'Mute');

    }

    function toggleMute() {
        if (!audioContext) initAudioContext();
        if (isMuted) {
            gainNode.gain.value = lastVolume;
            volumeSlider.value = lastVolume;
            isMuted = false;
            muteBtn.innerHTML = '&#128266;'; // Speaker icon
            muteBtn.setAttribute('aria-label', 'Mute');
        } else {
            lastVolume = gainNode.gain.value; // Store current volume before muting
            gainNode.gain.value = 0;
            // volumeSlider.value = 0; // Optionally reflect mute on slider
            isMuted = true;
            muteBtn.innerHTML = '&#128263;'; // Muted Speaker icon
            muteBtn.setAttribute('aria-label', 'Unmute');
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    function updateDurationDisplay() {
        if (primaryAudioElement && primaryAudioElement.duration) {
            durationEl.textContent = formatTime(primaryAudioElement.duration);
            progressBar.max = primaryAudioElement.duration; // Set progress bar max
        }
    }

    function updateProgress() {
        if (primaryAudioElement && primaryAudioElement.currentTime) {
            currentTimeEl.textContent = formatTime(primaryAudioElement.currentTime);
            progressBar.value = primaryAudioElement.currentTime;
        }
    }

    function handleAudioError(e) {
        console.error("Audio Error:", e);
        const targetElement = e.target; // primaryAudioElement or nextAudioElement
        let trackName = "Unknown Track";
        if (targetElement === primaryAudioElement && playlist[currentTrackIndex]) {
            trackName = playlist[currentTrackIndex].name;
        } else {
            // Attempt to find which track it might be if it's nextAudioElement
            // This is a bit more complex as we don't store its index directly
        }
        trackNameEl.textContent = `Error loading: ${trackName}`;
        trackArtistEl.textContent = "Please check console for details.";
        // Potentially try to skip to next track or offer a retry mechanism
    }


    // Event Listeners
    playPauseBtn.addEventListener('click', playPause);
    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);
    volumeSlider.addEventListener('input', setVolume);
    muteBtn.addEventListener('click', toggleMute);
    progressBar.addEventListener('input', () => { // Allow seeking
        if (primaryAudioElement) primaryAudioElement.currentTime = progressBar.value;
    });


    // Initial setup
    // Do not auto-play by default, wait for user interaction or specific instruction
    // loadTrack(currentTrackIndex); // Load first track but don't play
    // Instead, let the first playPause() call load it.
    if (audioPlayerContainer) audioPlayerContainer.style.display = 'block'; // Show player
    setVolume(); // Set initial volume from slider

    // PRD: "Initial Visit: Page loads with soft background music auto-playing (where permitted)"
    // This is often blocked by browsers. We can try, but catch errors.
    // For now, let's ensure user must click play first.
    // If autoplay is desired:
    // initAudioContext();
    // loadTrack(currentTrackIndex);
    // playPause(); // This will attempt to play and handle errors if blocked

    // To fulfill the "auto-hide after 10 seconds of inactivity" (from PRD 3.3.1 for Main Control Panel)
    let inactivityTimeout;
    const INACTIVITY_DELAY = 10000; // 10 seconds

    function showControlPanel() {
        if (audioPlayerContainer.classList.contains('hidden-by-inactive')) {
            audioPlayerContainer.classList.remove('hidden-by-inactive');
        }
        resetInactivityTimer();
    }

    function hideControlPanel() {
        // Don't hide if audio is paused and panel is expected to be visible
        // Or if a modal related to the player is open, etc. (more complex scenarios)
        if (isPlaying) { // Only hide if playing, user might want to see controls if paused.
             audioPlayerContainer.classList.add('hidden-by-inactive');
        }
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimeout);
        // Only start the timer if audio is playing. If paused, panel should remain.
        if (isPlaying) {
            inactivityTimeout = setTimeout(hideControlPanel, INACTIVITY_DELAY);
        }
    }

    if (audioPlayerContainer) {
        // Initial state: visible if not playing, or if playing start timer.
        if (isPlaying) {
            resetInactivityTimer();
        } else {
             audioPlayerContainer.classList.remove('hidden-by-inactive'); // Ensure visible if paused
        }

        audioPlayerContainer.addEventListener('mousemove', showControlPanel);
        audioPlayerContainer.addEventListener('mouseenter', showControlPanel);
        // For touch devices, a tap on the container could show it,
        // but then it relies on the timeout to hide again.
        // Or, a specific "show/hide controls" button might be better for touch.
        // For now, mouse interaction covers hover.

        // Reset timer on critical actions within the player
        [playPauseBtn, prevBtn, nextBtn, volumeSlider, progressBar].forEach(el => {
            if (el) {
                el.addEventListener('focus', showControlPanel); // Show on focus
                el.addEventListener('mousedown', showControlPanel); // Show on click/drag start
                el.addEventListener('touchstart', showControlPanel, {passive: true}); // Show on touch
            }
        });
    }

    // Modify playPause to manage panel visibility based on playing state
    const originalPlayPause = playPause; // Save original
    playPause = function() {
        originalPlayPause.apply(this, arguments); // Call original
        if (isPlaying) {
            resetInactivityTimer(); // Start timer if playing
        } else {
            clearTimeout(inactivityTimeout); // Clear timer if paused
            audioPlayerContainer.classList.remove('hidden-by-inactive'); // Ensure panel is visible
        }
    }
    // Re-assign event listener for playPauseBtn if it was set before this modification
    // This is a bit of a hack due to order of execution. Ideally, structure functions so this isn't needed.
    // Or, ensure playPauseBtn's listener is added *after* playPause is wrapped.
    // For now, assuming the event listener will pick up the new wrapped function correctly if added last.
    // If issues, explicitly remove old listener and add new one.

    // Attempt initial autoplay as per PRD 5.1
    function attemptInitialAutoplay() {
        if (!audioContext) initAudioContext(); // Ensure context is ready

        // Ensure the container is visible before trying to play
        // because playPause() might try to hide it if isPlaying becomes true
        if (audioPlayerContainer) {
            audioPlayerContainer.classList.remove('hidden-by-inactive');
        }

        loadTrack(currentTrackIndex); // Load the first track metadata

        // Try to play. The playPause function will handle UI and errors.
        // We call playPause directly which will attempt to play if not already playing.
        // The play() promise rejection is handled inside playPause.
        console.log("Attempting initial autoplay...");
        playPause();
        // If autoplay fails, playPause would have set isPlaying to false,
        // shown play icon, and potentially called requestUserInteractionForPlayback.
        // The control panel visibility logic in the wrapped playPause should also correctly
        // leave the panel visible if autoplay fails and isPlaying is false.
    }

    // Call this after a brief delay to ensure everything is set up
    // and to give the browser a moment.
    setTimeout(attemptInitialAutoplay, 100); // 100ms delay


    console.log("Main Audio Player initialized with auto-hide and autoplay attempt.");
});
