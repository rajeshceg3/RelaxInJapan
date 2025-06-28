document.addEventListener('DOMContentLoaded', () => {
    // Existing Timer Elements
    const timeTextElement = document.getElementById('time-text');
    const playBtn = document.getElementById('meditation-play-btn');
    const pauseBtn = document.getElementById('meditation-pause-btn');
    const stopBtn = document.getElementById('meditation-stop-btn');
    const progressCircle = document.querySelector('.progress-ring-circle');

    const radius = progressCircle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;

    let totalSeconds = 5 * 60;
    let initialSetTime = 5 * 60;
    let intervalId = null;
    let isRunning = false;
    let wasRunningBeforePause = false;

    // Preset and Custom Duration Elements
    const presetButtons = document.querySelectorAll('.preset-btn');
    const customDurationInput = document.getElementById('custom-duration-input');
    const customDurationBtn = document.getElementById('custom-duration-btn');

    // Pomodoro Elements
    const pomodoroPhaseDisplay = document.getElementById('pomodoro-phase-display');
    const togglePomodoroBtn = document.getElementById('toggle-pomodoro-btn');
    const pomodoroSettingsDiv = document.getElementById('pomodoro-settings');
    const pomodoroWorkInput = document.getElementById('pomodoro-work-input');
    const pomodoroShortBreakInput = document.getElementById('pomodoro-short-break-input');
    const pomodoroLongBreakInput = document.getElementById('pomodoro-long-break-input');
    const pomodoroCyclesInput = document.getElementById('pomodoro-cycles-input');

    let isPomodoroMode = false;
    let currentPhase = 'work';
    let pomodoroCyclesCompleted = 0;
    let pomodoroSettings = {
        work: (parseInt(pomodoroWorkInput.value) || 25) * 60,
        shortBreak: (parseInt(pomodoroShortBreakInput.value) || 5) * 60,
        longBreak: (parseInt(pomodoroLongBreakInput.value) || 15) * 60,
        cyclesBeforeLong: parseInt(pomodoroCyclesInput.value) || 4
    };

    // Sound Elements and Audio Context (Bell sounds)
    const bellSoundSelect = document.getElementById('bell-sound-select');
    const previewSoundBtn = document.getElementById('preview-sound-btn');
    const volumeSlider = document.getElementById('volume-slider');
    let audioContext;
    let masterGainNode;
    let currentBellSound = 'silent';
    let currentMasterVolume = 0.5;

    // Ambient Sound Elements
    const ambientSoundsListDiv = document.getElementById('ambient-sounds-list');
    const ambientSoundFiles = [
        { id: 'rain', name: 'Rain on Bamboo', path: 'audio/rain_sample.mp3' },
        { id: 'stream', name: 'Mountain Stream', path: 'audio/stream_sample.mp3' },
        { id: 'wind', name: 'Wind through Pines', path: 'audio/wind_sample.mp3' },
        { id: 'ocean', name: 'Gentle Ocean Waves', path: 'audio/ocean_sample.mp3' },
        { id: 'birds', name: 'Forest Birds Chirping', path: 'audio/birds_sample.mp3' },
    ];
    let activeAmbientSounds = {};

    // Breathing Guide Elements
    const breathingGuideContainer = document.getElementById('breathing-guide-container');
    const breathingCircle = document.getElementById('breathing-circle');
    const breathingText = document.getElementById('breathing-text');
    const breathingPatternSelect = document.getElementById('breathing-pattern-select');
    const customBreathingPatternInputsDiv = document.getElementById('custom-breathing-pattern-inputs');
    const inhaleTimeInput = document.getElementById('inhale-time');
    const holdTimeInput = document.getElementById('hold-time');
    const exhaleTimeInput = document.getElementById('exhale-time');
    const toggleBreathingGuideBtn = document.getElementById('toggle-breathing-guide-btn');

    let isBreathingGuideVisible = false;
    let currentBreathingPattern = { inhale: 4, hold: 2, exhale: 6 }; // Default
    let breathingTimeoutIds = [];


    function initAudio() { /* ... (no change) ... */
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGainNode = audioContext.createGain();
            masterGainNode.gain.value = currentMasterVolume;
            masterGainNode.connect(audioContext.destination);
        }
    }
    async function playBellSound(url) { /* ... (no change) ... */
        if (!url || url === 'silent' || !audioContext || !masterGainNode) {
            return;
        }
        if (audioContext.state === 'suspended') await audioContext.resume();
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Sound file not found: ${url} (${response.statusText})`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(masterGainNode);
            source.start(0);
        } catch (error) { console.error("Error playing bell sound:", url, error); }
    }
    function populateAmbientSoundsList() { /* ... (no change) ... */
        if (!ambientSoundsListDiv) return;
        ambientSoundsListDiv.innerHTML = '';

        ambientSoundFiles.forEach(soundData => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('ambient-sound-item');
            itemDiv.dataset.soundId = soundData.id;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `ambient-checkbox-${soundData.id}`;
            checkbox.dataset.soundId = soundData.id;

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = soundData.name;

            const individualVolumeSlider = document.createElement('input');
            individualVolumeSlider.type = 'range';
            individualVolumeSlider.min = '0';
            individualVolumeSlider.max = '1';
            individualVolumeSlider.step = '0.01';
            individualVolumeSlider.value = '0.5';

            activeAmbientSounds[soundData.id] = {
                source: null, gainNode: null, path: soundData.path, name: soundData.name,
                desiredVolume: parseFloat(individualVolumeSlider.value),
                isPlaying: checkbox.checked
            };

            checkbox.addEventListener('change', (event) => {
                const soundId = event.target.dataset.soundId;
                activeAmbientSounds[soundId].isPlaying = event.target.checked;
                if (event.target.checked) playAmbientSound(soundId);
                else stopAmbientSound(soundId);
            });

            individualVolumeSlider.addEventListener('input', (event) => {
                const soundId = event.target.dataset.soundId;
                const newVolume = parseFloat(event.target.value);
                activeAmbientSounds[soundId].desiredVolume = newVolume;
                if (activeAmbientSounds[soundId].gainNode) {
                    activeAmbientSounds[soundId].gainNode.gain.value = newVolume * currentMasterVolume;
                }
            });

            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(label);
            itemDiv.appendChild(individualVolumeSlider);
            ambientSoundsListDiv.appendChild(itemDiv);
        });
    }
    async function playAmbientSound(soundId) { /* ... (no change) ... */
        initAudio();
        const soundInfo = activeAmbientSounds[soundId];
        if (!soundInfo || soundInfo.source) return;

        if (audioContext.state === 'suspended') await audioContext.resume();

        try {
            const response = await fetch(soundInfo.path);
            if (!response.ok) throw new Error(`Ambient sound fetch failed: ${soundInfo.path} (${response.statusText})`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            soundInfo.source = audioContext.createBufferSource();
            soundInfo.source.buffer = audioBuffer;
            soundInfo.source.loop = true;

            soundInfo.gainNode = audioContext.createGain();
            soundInfo.gainNode.gain.value = soundInfo.desiredVolume * currentMasterVolume;

            soundInfo.source.connect(soundInfo.gainNode);
            soundInfo.gainNode.connect(masterGainNode);

            soundInfo.source.start(0);
            soundInfo.isPlaying = true;
        } catch (error) {
            console.error(`Error playing ambient sound ${soundInfo.name}:`, error);
            const checkbox = document.getElementById(`ambient-checkbox-${soundId}`);
            if (checkbox) checkbox.checked = false;
            activeAmbientSounds[soundId].isPlaying = false;
        }
    }
    function stopAmbientSound(soundId) { /* ... (no change) ... */
        const soundInfo = activeAmbientSounds[soundId];
        if (soundInfo && soundInfo.source) {
            soundInfo.source.stop(0);
            soundInfo.source.disconnect();
            if (soundInfo.gainNode) soundInfo.gainNode.disconnect();
            soundInfo.source = null;
            soundInfo.gainNode = null;
            soundInfo.isPlaying = false;
        }
    }

    // --- Core Timer Functions ---
    function formatTime(seconds) { /* ... (no change) ... */
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    function setProgress(percent) { /* ... (no change) ... */
        const offset = circumference - (percent * circumference);
        progressCircle.style.strokeDashoffset = offset;
    }
    function updatePomodoroPhaseDisplay() { /* ... (no change) ... */
        if (!pomodoroPhaseDisplay) return;
        if (isPomodoroMode && initialSetTime > 0) {
            let phaseText = currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1);
            if (currentPhase === 'shortBreak') phaseText = 'Short Break';
            if (currentPhase === 'longBreak') phaseText = 'Long Break';
            pomodoroPhaseDisplay.textContent = `Phase: ${phaseText}`;
            pomodoroPhaseDisplay.style.display = 'block';
        } else {
            pomodoroPhaseDisplay.textContent = '';
            pomodoroPhaseDisplay.style.display = 'none';
        }
    }
    function updateDisplay() { /* ... (no change) ... */
        if (timeTextElement) {
            timeTextElement.textContent = formatTime(totalSeconds);
        }
        if (initialSetTime > 0) {
            const percentElapsed = (initialSetTime - totalSeconds) / initialSetTime;
            setProgress(percentElapsed);
        } else {
            setProgress(0);
        }
        if (isPomodoroMode) {
            updatePomodoroPhaseDisplay();
        }
    }
    function setTimerDuration(newSeconds, isAutoPomodoroSwitch = false) { /* ... (no change) ... */
        if (isRunning) {
            stopTimer(isAutoPomodoroSwitch);
        }
        totalSeconds = newSeconds;
        initialSetTime = newSeconds;
        updateDisplay();
        if (playBtn) playBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
    }
    function startTimer() { /* ... (no change from ambient sound integration) ... */
        wasRunningBeforePause = isRunning;
        if (initialSetTime <= 0 && totalSeconds <= 0) return;
        if (totalSeconds <= 0) {
            totalSeconds = initialSetTime;
            if (totalSeconds <= 0) return;
            updateDisplay();
        }
        if (isRunning) return;
        if (totalSeconds === initialSetTime && initialSetTime > 0) {
            initAudio();
            playBellSound(currentBellSound);
        }
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
        isRunning = true;
        if (playBtn) playBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        intervalId = setInterval(() => {
            totalSeconds--;
            updateDisplay();
            if (totalSeconds < 0) {
                clearInterval(intervalId);
                isRunning = false;
                totalSeconds = 0;
                updateDisplay();
                if (playBtn) playBtn.disabled = false;
                if (pauseBtn) pauseBtn.disabled = true;
                initAudio();
                playBellSound(currentBellSound);
                if (isPomodoroMode) startNextPomodoroPhase();
            }
        }, 1000);
    }
    function pauseTimer() { /* ... (no change from ambient sound integration) ... */
        if (!isRunning) return;
        wasRunningBeforePause = true;
        clearInterval(intervalId);
        isRunning = false;
        if (audioContext) audioContext.suspend();
        if (playBtn) playBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
    }
    function stopTimer(isAutoPomodoroSwitch = false) { /* ... (no change from ambient sound integration) ... */
        clearInterval(intervalId);
        isRunning = false;
        wasRunningBeforePause = false;
        if (isPomodoroMode && !isAutoPomodoroSwitch) {
            currentPhase = 'work';
            pomodoroCyclesCompleted = 0;
            totalSeconds = pomodoroSettings.work;
            initialSetTime = pomodoroSettings.work;
        } else if (!isPomodoroMode) {
            totalSeconds = initialSetTime;
        }
        updateDisplay();
        if (playBtn) playBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
    }

    // --- Pomodoro Specific Functions ---
    function updatePomodoroSettings() { /* ... (no change) ... */
        const workVal = parseInt(pomodoroWorkInput.value);
        const shortBreakVal = parseInt(pomodoroShortBreakInput.value);
        const longBreakVal = parseInt(pomodoroLongBreakInput.value);
        const cyclesVal = parseInt(pomodoroCyclesInput.value);
        pomodoroSettings.work = (workVal || 25) * 60;
        pomodoroSettings.shortBreak = (shortBreakVal || 5) * 60;
        pomodoroSettings.longBreak = (longBreakVal || 15) * 60;
        pomodoroSettings.cyclesBeforeLong = cyclesVal || 4;
        if (isPomodoroMode && !isRunning && totalSeconds > 0) {
            if (currentPhase === 'work' && initialSetTime !== pomodoroSettings.work) setTimerDuration(pomodoroSettings.work);
            else if (currentPhase === 'shortBreak' && initialSetTime !== pomodoroSettings.shortBreak) setTimerDuration(pomodoroSettings.shortBreak);
            else if (currentPhase === 'longBreak' && initialSetTime !== pomodoroSettings.longBreak) setTimerDuration(pomodoroSettings.longBreak);
        }
    }
    [pomodoroWorkInput, pomodoroShortBreakInput, pomodoroLongBreakInput, pomodoroCyclesInput].forEach(input => {
        if (input) input.addEventListener('change', updatePomodoroSettings);
    });
    function startNextPomodoroPhase() { /* ... (no change) ... */
        if (currentPhase === 'work') {
            pomodoroCyclesCompleted++;
            if (pomodoroCyclesCompleted >= pomodoroSettings.cyclesBeforeLong) {
                currentPhase = 'longBreak'; pomodoroCyclesCompleted = 0;
            } else currentPhase = 'shortBreak';
        } else currentPhase = 'work';
        setTimerDuration(pomodoroSettings[currentPhase], true);
        startTimer();
    }
    function togglePomodoroMode() { /* ... (no change) ... */
        isPomodoroMode = !isPomodoroMode;
        if (isRunning) stopTimer();
        if (isPomodoroMode) {
            initAudio(); updatePomodoroSettings(); currentPhase = 'work'; pomodoroCyclesCompleted = 0;
            setTimerDuration(pomodoroSettings.work);
            if (togglePomodoroBtn) togglePomodoroBtn.textContent = 'Disable Pomodoro';
            if (pomodoroSettingsDiv) pomodoroSettingsDiv.classList.remove('hidden');
            presetButtons.forEach(b => b.disabled = true);
            if (customDurationBtn) customDurationBtn.disabled = true;
            if (customDurationInput) customDurationInput.disabled = true;
        } else {
            setTimerDuration(5 * 60);
            if (togglePomodoroBtn) togglePomodoroBtn.textContent = 'Enable Pomodoro';
            if (pomodoroSettingsDiv) pomodoroSettingsDiv.classList.add('hidden');
            presetButtons.forEach(b => b.disabled = false);
            if (customDurationBtn) customDurationBtn.disabled = false;
            if (customDurationInput) customDurationInput.disabled = false;
        }
        updatePomodoroPhaseDisplay();
    }
    if (togglePomodoroBtn) togglePomodoroBtn.addEventListener('click', togglePomodoroMode);

    // --- Sound Control Event Listeners (Bell sound + Master Volume) ---
    if (bellSoundSelect) { /* ... (no change) ... */
        currentBellSound = bellSoundSelect.value;
        bellSoundSelect.addEventListener('change', (event) => currentBellSound = event.target.value);
    }
    if (previewSoundBtn) { /* ... (no change) ... */
        previewSoundBtn.addEventListener('click', () => {
            if (currentBellSound !== 'silent') { initAudio(); playBellSound(currentBellSound); }
        });
    }
    if (volumeSlider) { /* ... (no change from ambient sound integration) ... */
        currentMasterVolume = parseFloat(volumeSlider.value);
        volumeSlider.addEventListener('input', (event) => {
            currentMasterVolume = parseFloat(event.target.value);
            if (masterGainNode) masterGainNode.gain.value = currentMasterVolume;
            Object.values(activeAmbientSounds).forEach(soundInfo => {
                if (soundInfo.gainNode) soundInfo.gainNode.gain.value = soundInfo.desiredVolume * currentMasterVolume;
            });
        });
    }

    // --- Breathing Guide Functions & Event Listeners ---
    function clearBreathingTimeouts() {
        breathingTimeoutIds.forEach(clearTimeout);
        breathingTimeoutIds = [];
        if (breathingCircle) {
            breathingCircle.style.animation = '';
            breathingCircle.style.transform = 'scale(1)';
        }
        if (breathingText) breathingText.textContent = '';
    }

    function runBreathingCycle() {
        if (!isBreathingGuideVisible || !breathingCircle || !breathingText) return;
        clearBreathingTimeouts();

        const { inhale, hold, exhale } = currentBreathingPattern;

        breathingText.textContent = 'Inhale';
        breathingCircle.style.animation = `inhaleAnimation ${inhale}s ease-in-out forwards`;

        let timeoutId1 = setTimeout(() => {
            if (!isBreathingGuideVisible) return;
            breathingText.textContent = 'Hold';
            // CSS animation 'forwards' keeps circle expanded. No new animation needed for hold.
            // To make it explicit or if 'forwards' is not used:
            // breathingCircle.style.transform = `scale(${inhaleEndScaleFactor})`; // Assuming inhaleEndScaleFactor is defined e.g. 3
            // breathingCircle.style.animation = ''; // Clear previous animation

            let timeoutId2 = setTimeout(() => {
                if (!isBreathingGuideVisible) return;
                breathingText.textContent = 'Exhale';
                breathingCircle.style.animation = `exhaleAnimation ${exhale}s ease-in-out forwards`;

                let timeoutId3 = setTimeout(() => {
                    if (!isBreathingGuideVisible) return;
                    runBreathingCycle(); // Loop
                }, exhale * 1000);
                breathingTimeoutIds.push(timeoutId3);
            }, hold * 1000);
            breathingTimeoutIds.push(timeoutId2);
        }, inhale * 1000);
        breathingTimeoutIds.push(timeoutId1);
    }

    function updateBreathingPattern() {
        const selected = breathingPatternSelect.value;
        if (selected === 'custom') {
            customBreathingPatternInputsDiv.classList.remove('hidden');
            const inh = parseInt(inhaleTimeInput.value) || 4;
            const hld = parseInt(holdTimeInput.value) || 0;
            const exh = parseInt(exhaleTimeInput.value) || 6;
            currentBreathingPattern = { inhale: inh, hold: hld, exhale: exh };
        } else {
            customBreathingPatternInputsDiv.classList.add('hidden');
            const parts = selected.split('-').map(Number);
            currentBreathingPattern = { inhale: parts[0], hold: parts[1], exhale: parts[2] };
        }
        if (isBreathingGuideVisible) {
            clearBreathingTimeouts();
            runBreathingCycle();
        }
    }

    function toggleBreathingGuide() {
        isBreathingGuideVisible = !isBreathingGuideVisible;
        if (isBreathingGuideVisible) {
            if (breathingGuideContainer) breathingGuideContainer.classList.remove('hidden');
            if (toggleBreathingGuideBtn) toggleBreathingGuideBtn.textContent = 'Hide Guide';
            updateBreathingPattern(); // This will also start the cycle via runBreathingCycle
        } else {
            if (breathingGuideContainer) breathingGuideContainer.classList.add('hidden');
            if (toggleBreathingGuideBtn) toggleBreathingGuideBtn.textContent = 'Show Guide';
            clearBreathingTimeouts();
        }
    }

    if (toggleBreathingGuideBtn) toggleBreathingGuideBtn.addEventListener('click', toggleBreathingGuide);
    if (breathingPatternSelect) {
        breathingPatternSelect.addEventListener('change', updateBreathingPattern);
        if (breathingPatternSelect.value === 'custom') customBreathingPatternInputsDiv.classList.remove('hidden');
        else customBreathingPatternInputsDiv.classList.add('hidden');
    }
    [inhaleTimeInput, holdTimeInput, exhaleTimeInput].forEach(input => {
        if (input) input.addEventListener('change', () => {
            if (breathingPatternSelect.value === 'custom') updateBreathingPattern();
        });
    });

    // Initialize default breathing pattern values in custom fields
    if (inhaleTimeInput) inhaleTimeInput.value = currentBreathingPattern.inhale;
    if (holdTimeInput) holdTimeInput.value = currentBreathingPattern.hold;
    if (exhaleTimeInput) exhaleTimeInput.value = currentBreathingPattern.exhale;


    // --- Event Listeners for Meditation Controls ---
    presetButtons.forEach(button => { /* ... (no change) ... */
        button.addEventListener('click', () => {
            if (isPomodoroMode) togglePomodoroMode();
            const duration = parseInt(button.dataset.duration, 10);
            setTimerDuration(duration);
        });
    });
    if (customDurationBtn) { /* ... (no change) ... */
        customDurationBtn.addEventListener('click', () => {
            if (isPomodoroMode) togglePomodoroMode();
            const minutes = parseInt(customDurationInput.value, 10);
            if (isNaN(minutes) || minutes < 1 || minutes > 60) {
                alert("Please enter a valid duration between 1 and 60 minutes.");
                customDurationInput.value = ""; return;
            }
            setTimerDuration(minutes * 60);
            customDurationInput.value = "";
        });
    }
    if (playBtn) playBtn.addEventListener('click', startTimer);
    if (pauseBtn) {
        pauseBtn.addEventListener('click', pauseTimer);
        pauseBtn.disabled = true;
    }
    if (stopBtn) stopBtn.addEventListener('click', () => stopTimer(false));

    // --- Initial Page Setup ---
    if (pomodoroSettingsDiv) pomodoroSettingsDiv.classList.add('hidden');
    if (breathingGuideContainer) breathingGuideContainer.classList.add('hidden'); // Ensure guide is hidden initially
    updatePomodoroSettings();
    updatePomodoroPhaseDisplay();
    populateAmbientSoundsList();
    updateDisplay();
});
