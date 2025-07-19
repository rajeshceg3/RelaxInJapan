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
        { name: "Ambient Relaxation", artist: "Fesliyan Studios", path: "audio/fesliyan-track-1.mp3" }
    ];

    let audioContext;
    let primaryAudioElement;
    let gainNode;
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isMuted = false;
    let lastVolume = 0.5;

    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
            primaryAudioElement = new Audio();
            primaryAudioElement.crossOrigin = "anonymous";
            const sourcePrimary = audioContext.createMediaElementSource(primaryAudioElement);
            sourcePrimary.connect(gainNode);

            primaryAudioElement.addEventListener('loadedmetadata', updateDurationDisplay);
            primaryAudioElement.addEventListener('timeupdate', updateProgress);
            primaryAudioElement.addEventListener('ended', handleTrackEnd);
            primaryAudioElement.addEventListener('error', handleAudioError);

            if (audioPlayerContainer) {
                audioPlayerContainer.classList.remove('player-initially-hidden');
            }
        }
    }

    function loadTrack(index) {
        const track = playlist[index];
        primaryAudioElement.src = track.path;
        primaryAudioElement.load();

        trackNameEl.textContent = track.name;
        trackArtistEl.textContent = track.artist;
        if (isPlaying) {
            primaryAudioElement.play().catch(e => console.warn("Play interrupted or failed:", e));
        }
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
            if (!primaryAudioElement.src) {
                loadTrack(currentTrackIndex);
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
        primaryAudioElement.currentTime = 0;
        primaryAudioElement.play().catch(e => console.warn("Replay failed:", e));
        if (isPlaying) {
             playPauseBtn.innerHTML = '&#10074;&#10074;'; // Pause icon
             playPauseBtn.setAttribute('aria-label', 'Pause');
        }
    }

    function setVolume() {
        if (!audioContext) initAudioContext();
        lastVolume = parseFloat(volumeSlider.value);
        if (gainNode) gainNode.gain.value = lastVolume;
        isMuted = false;
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
            muteBtn.setAttribute('aria-label', 'Unmute');
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
        const trackName = playlist[0].name;
        trackNameEl.textContent = `Error loading: ${trackName}`;
        trackArtistEl.textContent = "Please check console for details.";
    }

    playPauseBtn.addEventListener('click', playPause);
    volumeSlider.addEventListener('input', setVolume);
    muteBtn.addEventListener('click', toggleMute);
    progressBar.addEventListener('input', () => {
        if (primaryAudioElement) primaryAudioElement.currentTime = progressBar.value;
    });

    if (audioPlayerContainer) audioPlayerContainer.style.display = 'block';
    setVolume();

    let inactivityTimeout;
    const INACTIVITY_DELAY = 10000;

    function showControlPanel() {
        if (audioPlayerContainer.classList.contains('hidden-by-inactive')) {
            audioPlayerContainer.classList.remove('hidden-by-inactive');
        }
        resetInactivityTimer();
    }

    function hideControlPanel() {
        if (isPlaying) {
             audioPlayerContainer.classList.add('hidden-by-inactive');
        }
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimeout);
        if (isPlaying) {
            inactivityTimeout = setTimeout(hideControlPanel, INACTIVITY_DELAY);
        }
    }

    if (audioPlayerContainer) {
        if (isPlaying) {
            resetInactivityTimer();
        } else {
             audioPlayerContainer.classList.remove('hidden-by-inactive');
        }

        audioPlayerContainer.addEventListener('mousemove', showControlPanel);
        audioPlayerContainer.addEventListener('mouseenter', showControlPanel);
        [playPauseBtn, volumeSlider, progressBar].forEach(el => {
            if (el) {
                el.addEventListener('focus', showControlPanel);
                el.addEventListener('mousedown', showControlPanel);
                el.addEventListener('touchstart', showControlPanel, {passive: true});
            }
        });
    }

    const originalPlayPause = playPause;
    playPause = function() {
        originalPlayPause.apply(this, arguments);
        if (isPlaying) {
            resetInactivityTimer();
        } else {
            clearTimeout(inactivityTimeout);
            audioPlayerContainer.classList.remove('hidden-by-inactive');
        }
    }
    if(playPauseBtn) {
        playPauseBtn.removeEventListener('click', originalPlayPause);
        playPauseBtn.addEventListener('click', playPause);
    }

    function attemptInitialAutoplay() {
        if (!audioContext) initAudioContext();

        if (audioPlayerContainer) {
            audioPlayerContainer.classList.remove('hidden-by-inactive');
        }

        loadTrack(currentTrackIndex);

        console.log("Attempting initial autoplay...");
        playPause();
    }

    setTimeout(attemptInitialAutoplay, 100);

    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';

    console.log("Main Audio Player initialized for single track loop and hidden navigation.");
});
