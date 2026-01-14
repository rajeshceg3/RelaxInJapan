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
        { name: "Ambient Relaxation (Preview)", artist: "Nature Sounds", path: "audio/fesliyan-track-1.mp3" }
    ];

    let audioContext;
    let primaryAudioElement; // Main audio element for playback
    // let nextAudioElement; // Removed as per requirements
    let gainNode;
    let currentTrackIndex = 0; // Should always remain 0
    let isPlaying = false;
    let isMuted = false;
    let lastVolume = 0.5;
    // let crossfadeTimeout; // Removed as crossfading is removed

    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
            primaryAudioElement = new Audio();
            primaryAudioElement.crossOrigin = "anonymous"; // If loading from different origin
            const sourcePrimary = audioContext.createMediaElementSource(primaryAudioElement);
            sourcePrimary.connect(gainNode);

            // nextAudioElement related lines removed
            // nextAudioElement = new Audio();
            // nextAudioElement.crossOrigin = "anonymous";
            // const sourceNext = audioContext.createMediaElementSource(nextAudioElement); // This would error if nextAudioElement is not used
            // We don't connect nextAudioElement to graph until it's swapped

            primaryAudioElement.addEventListener('loadedmetadata', updateDurationDisplay);
            primaryAudioElement.addEventListener('timeupdate', updateProgress);
            primaryAudioElement.addEventListener('ended', handleTrackEnd);
            primaryAudioElement.addEventListener('error', handleAudioError);
            // nextAudioElement.addEventListener('error', handleAudioError); // Removed

            // Show the player once initialized by removing the initially hidden class
            if (audioPlayerContainer) {
                audioPlayerContainer.classList.remove('player-initially-hidden');
            }
        }
    }

    function loadTrack(index) { // Removed isPreload parameter
        const track = playlist[index];
        // const targetAudioElement = isPreload ? nextAudioElement : primaryAudioElement; // Simplified
        primaryAudioElement.src = track.path;
        primaryAudioElement.load(); // Important to actually load it

        // if (!isPreload) { // Simplified, as isPreload is always false now
        trackNameEl.textContent = track.name;
        trackArtistEl.textContent = track.artist;
        // Duration will be updated by 'loadedmetadata' event
        if (isPlaying) {
            primaryAudioElement.play().catch(e => console.warn("Play interrupted or failed:", e));
        }
        // preloadNextTrack((index + 1) % playlist.length); // Removed call to preloadNextTrack
        // }
    }

    function preloadNextTrack(nextIndex) { /* No action */ }


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
                loadTrack(currentTrackIndex); // currentTrackIndex will always be 0
            }
            primaryAudioElement.play().then(() => {
                isPlaying = true;
                playPauseBtn.innerHTML = '&#10074;&#10074;'; // Pause icon
                playPauseBtn.setAttribute('aria-label', 'Pause');
            }).catch(e => {
                console.error("Error playing audio:", e);
                if (e.name === 'NotAllowedError') {
                    requestUserInteractionForPlayback();
                }
            });
        }
    }

    function requestUserInteractionForPlayback() {
        alert("Audio playback requires user interaction. Click Play to start.");
        isPlaying = false;
        playPauseBtn.innerHTML = '&#9654;';
        playPauseBtn.setAttribute('aria-label', 'Play');
    }

    function handleTrackEnd() {
        console.log("Track ended, replaying.");
        // Simply reset current time and play again for looping
        primaryAudioElement.currentTime = 0;
        primaryAudioElement.play().catch(e => console.warn("Replay failed:", e));
        // No need to update isPlaying or button, as 'play' event should handle it,
        // or if it was already true, it remains true.
        // If it was paused and ended, it should remain paused (play() won't proceed).
        // However, 'ended' usually implies it was playing.
        // To be safe, if it was playing, ensure it continues to be marked as playing.
        if (isPlaying) {
             playPauseBtn.innerHTML = '&#10074;&#10074;'; // Pause icon
             playPauseBtn.setAttribute('aria-label', 'Pause');
        }
    }

    function prevTrack() { /* No action */ }

    function nextTrack() { /* No action */ }

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
            lastVolume = gainNode.gain.value;
            gainNode.gain.value = 0;
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
            progressBar.max = primaryAudioElement.duration;
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
        // Since there's only one track, currentTrackIndex is always 0
        const trackName = playlist[0].name;
        // Keep the aesthetic intact even if loading fails (World Class UX hides internal errors)
        trackNameEl.textContent = trackName;
        // trackArtistEl.textContent = "Stream Offline"; // Removed to maintain visual polish
        // playPauseBtn.style.opacity = '0.5'; // Removed to maintain visual polish
        // playPauseBtn.style.pointerEvents = 'none'; // Removed
    }


    // Event Listeners
    playPauseBtn.addEventListener('click', playPause);
    // prevBtn.addEventListener('click', prevTrack); // Listener removed as button will be hidden
    // nextBtn.addEventListener('click', nextTrack); // Listener removed as button will be hidden
    volumeSlider.addEventListener('input', setVolume);
    muteBtn.addEventListener('click', toggleMute);
    progressBar.addEventListener('input', () => {
        if (primaryAudioElement) primaryAudioElement.currentTime = progressBar.value;
    });

    if (audioPlayerContainer) audioPlayerContainer.style.display = 'block';
    setVolume();

    let inactivityTimeout;
    const INACTIVITY_DELAY = 5000; // Shorter delay for better UX

    function showControlPanel() {
        if (audioPlayerContainer.classList.contains('player-hidden')) {
            audioPlayerContainer.classList.remove('player-hidden');
        }
        resetInactivityTimer();
    }

    function hideControlPanel() {
        if (isPlaying) {
             audioPlayerContainer.classList.add('player-hidden');
        }
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimeout);
        if (isPlaying) {
            inactivityTimeout = setTimeout(hideControlPanel, INACTIVITY_DELAY);
        }
    }

    if (audioPlayerContainer) {
        // Initialize state
        if (isPlaying) {
            resetInactivityTimer();
        } else {
             audioPlayerContainer.classList.remove('player-hidden');
        }

        audioPlayerContainer.addEventListener('mousemove', showControlPanel);
        audioPlayerContainer.addEventListener('mouseenter', showControlPanel);
        // Removed prevBtn and nextBtn from this array as they are hidden
        [playPauseBtn, volumeSlider, progressBar].forEach(el => {
            if (el) {
                el.addEventListener('focus', showControlPanel);
                el.addEventListener('mousedown', showControlPanel);
                el.addEventListener('touchstart', showControlPanel, {passive: true});
            }
        });
    }

    const originalPlayPause = playPause;
    playPause = function() { // This re-declaration should be fine if originalPlayPause is captured correctly.
        originalPlayPause.apply(this, arguments);
        if (isPlaying) {
            resetInactivityTimer();
        } else {
            clearTimeout(inactivityTimeout);
            audioPlayerContainer.classList.remove('player-hidden');
        }
    }
    // Re-assign playPauseBtn listener to the new wrapped function
    if(playPauseBtn) { // Check if button exists before re-assigning
        playPauseBtn.removeEventListener('click', originalPlayPause); // Remove old if it was somehow assigned
        playPauseBtn.addEventListener('click', playPause);
    }


    function attemptInitialAutoplay() {
        if (!audioContext) initAudioContext();

        if (audioPlayerContainer) {
            audioPlayerContainer.classList.remove('player-hidden');
        }

        loadTrack(currentTrackIndex); // Load the single track (index 0)

        console.log("Attempting initial autoplay...");
        playPause(); // This will correctly use the (potentially wrapped) playPause
    }

    setTimeout(attemptInitialAutoplay, 100);

    // Disable/Hide UI Buttons
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';

    console.log("Main Audio Player initialized for single track loop and hidden navigation.");
});
