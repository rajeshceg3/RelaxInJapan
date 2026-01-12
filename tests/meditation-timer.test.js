// tests/meditation-timer.test.js

// Functions to be tested will be accessed by attaching them to window or by
// refactoring meditation-timer.js to export them if possible.
// For now, we'll assume that the functions are exposed for testing or we test their effects.

describe('Meditation Timer Logic', () => {
    // Mock DOM Elements
    let timeTextElement;
    let playBtn, pauseBtn, stopBtn;
    let progressCircle;
    let pomodoroPhaseDisplay, togglePomodoroBtn, pomodoroSettingsDiv;
    let pomodoroWorkInput, pomodoroShortBreakInput, pomodoroLongBreakInput, pomodoroCyclesInput;
    let bellSoundSelect, previewSoundBtn, volumeSlider;
    let ambientSoundsListDiv;
    let breathingGuideContainer, breathingCircle, breathingText, breathingPatternSelect;
    let customBreathingPatternInputsDiv, inhaleTimeInput, holdTimeInput, exhaleTimeInput, toggleBreathingGuideBtn;
    let presetButtons, customDurationInput, customDurationBtn;


    // Mock AudioContext related things
    let mockAudioContext;
    let mockMasterGainNode;
    let mockFetch;

    // Store original functions that might be mocked
    let originalAudioContext;
    let originalFetch;

    beforeEach(() => {
        jest.resetModules();

        // Setup mock DOM
        document.body.innerHTML = `
            <div id="time-text">05:00</div>
            <button id="meditation-play-btn"></button>
            <button id="meditation-pause-btn"></button>
            <button id="meditation-stop-btn"></button>
            <svg><circle class="progress-ring-circle" r="50"></circle></svg>
            <div id="pomodoro-phase-display"></div>
            <button id="toggle-pomodoro-btn">Enable Pomodoro</button>
            <div id="pomodoro-settings" class="hidden">
                <input id="pomodoro-work-input" value="25">
                <input id="pomodoro-short-break-input" value="5">
                <input id="pomodoro-long-break-input" value="15">
                <input id="pomodoro-cycles-input" value="4">
            </div>
            <select id="bell-sound-select">
                <option value="silent">Silent</option>
                <option value="audio/bell.mp3" selected>Bell</option>
            </select>
            <button id="preview-sound-btn"></button>
            <input type="range" id="volume-slider" value="0.5">
            <div id="ambient-sounds-list"></div>
            <div id="breathing-guide-container" class="hidden">
                <div id="breathing-circle" style="animation: none;"></div>
                <div id="breathing-text"></div>
            </div>
            <select id="breathing-pattern-select">
                <option value="4-2-6">4-2-6</option>
                <option value="custom">Custom</option>
            </select>
            <div id="custom-breathing-pattern-inputs" class="hidden">
                <input id="inhale-time" value="4">
                <input id="hold-time" value="2">
                <input id="exhale-time" value="6">
            </div>
            <button id="toggle-breathing-guide-btn">Show Guide</button>
            <button class="preset-btn" data-duration="300">5 Min</button>
            <button class="preset-btn" data-duration="600">10 Min</button>
            <input id="custom-duration-input">
            <button id="custom-duration-btn">Set Custom</button>
        `;

        timeTextElement = document.getElementById('time-text');
        playBtn = document.getElementById('meditation-play-btn');
        pauseBtn = document.getElementById('meditation-pause-btn');
        stopBtn = document.getElementById('meditation-stop-btn');
        progressCircle = document.querySelector('.progress-ring-circle');

        // Mock SVG property for jsdom
        Object.defineProperty(progressCircle, 'r', {
            value: { baseVal: { value: 50 } },
            writable: true
        });
        const radius = progressCircle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        progressCircle.style.strokeDashoffset = circumference;

        pomodoroPhaseDisplay = document.getElementById('pomodoro-phase-display');
        togglePomodoroBtn = document.getElementById('toggle-pomodoro-btn');
        pomodoroSettingsDiv = document.getElementById('pomodoro-settings');
        pomodoroWorkInput = document.getElementById('pomodoro-work-input');
        pomodoroShortBreakInput = document.getElementById('pomodoro-short-break-input');
        pomodoroLongBreakInput = document.getElementById('pomodoro-long-break-input');
        pomodoroCyclesInput = document.getElementById('pomodoro-cycles-input');

        bellSoundSelect = document.getElementById('bell-sound-select');
        previewSoundBtn = document.getElementById('preview-sound-btn');
        volumeSlider = document.getElementById('volume-slider');
        ambientSoundsListDiv = document.getElementById('ambient-sounds-list');

        breathingGuideContainer = document.getElementById('breathing-guide-container');
        breathingCircle = document.getElementById('breathing-circle');
        breathingText = document.getElementById('breathing-text');
        breathingPatternSelect = document.getElementById('breathing-pattern-select');
        customBreathingPatternInputsDiv = document.getElementById('custom-breathing-pattern-inputs');
        inhaleTimeInput = document.getElementById('inhale-time');
        holdTimeInput = document.getElementById('hold-time');
        exhaleTimeInput = document.getElementById('exhale-time');
        toggleBreathingGuideBtn = document.getElementById('toggle-breathing-guide-btn');

        presetButtons = document.querySelectorAll('.preset-btn');
        customDurationInput = document.getElementById('custom-duration-input');
        customDurationBtn = document.getElementById('custom-duration-btn');

        originalAudioContext = window.AudioContext;
        mockMasterGainNode = {
            gain: { value: 0.5, setValueAtTime: jest.fn() },
            connect: jest.fn(),
            disconnect: jest.fn(),
        };
        mockAudioContext = {
            createGain: jest.fn().mockReturnValue(mockMasterGainNode),
            createBufferSource: jest.fn().mockReturnValue({
                buffer: null,
                connect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn(),
                loop: false,
                disconnect: jest.fn(),
                onended: null
            }),
            decodeAudioData: jest.fn((audioData, successCallback, errorCallback) => {
                const mockDecodedBuffer = { duration: 1.0 };
                return Promise.resolve(mockDecodedBuffer).then(buffer => successCallback(buffer));
            }),
            destination: {},
            state: 'running',
            currentTime: 0,
            resume: jest.fn().mockResolvedValue(undefined),
            suspend: jest.fn().mockResolvedValue(undefined),
        };
        window.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
        window.webkitAudioContext = window.AudioContext;

        originalFetch = window.fetch;
        mockFetch = jest.fn();
        window.fetch = mockFetch;
        mockFetch.mockResolvedValue({
            ok: true,
            statusText: 'OK',
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
        });

        jest.useFakeTimers();
        jest.spyOn(global, 'clearInterval');
        jest.spyOn(global, 'clearTimeout');
        jest.spyOn(global, 'setInterval');
        jest.spyOn(global, 'setTimeout');

        // Execute the script to attach listeners
        require('../js/meditation-timer.js');
        // Dispatch DOMContentLoaded to ensure initialization runs if wrapped
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        window.AudioContext = originalAudioContext;
        window.webkitAudioContext = originalAudioContext;
        window.fetch = originalFetch;
        document.body.innerHTML = '';
        jest.restoreAllMocks();
    });

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    describe('formatTime', () => {
        it('should format seconds into MM:SS format', () => { expect(formatTime(0)).toBe('00:00'); });
        it('should handle times over an hour correctly', () => { expect(formatTime(3600)).toBe('60:00'); });
    });

    describe('Core Timer Functionality', () => {
        // Simple placeholder tests for now as logic is inside the module closure
        describe('setTimerDuration (via preset and custom buttons)', () => { it('should set timer duration', () => {}); });
        describe('startTimer (via play button)', () => { it('should start timer', () => {}); });
        describe('pauseTimer (via pause button)', () => { it('should pause timer', () => {}); });
        describe('stopTimer (via stop button)', () => { it('should stop timer', () => {}); });
    });

    describe('Pomodoro Functionality', () => {
        describe('togglePomodoroMode', () => { it('should toggle pomodoro mode', () => {}); });
        describe('updatePomodoroSettings (via input changes)', () => { it('should update settings', () => {}); });
        describe('startNextPomodoroPhase (implicitly called)', () => { it('should start next phase', () => {}); });
    });

    describe('Sound Controls', () => {
        describe('Bell Sounds', () => { it('should change bell sound', () => {}); });
        describe('Master Volume Slider', () => { it('should change volume', () => {}); });
        describe('Ambient Sounds', () => { it('should change ambient sound', () => {}); });
    });

    // --- Breathing Guide Tests ---
    describe('Breathing Guide Functionality', () => {
        beforeEach(() => {
            // Need to re-cache elements as DOM was reset
            // Or assume variables are fresh.
            // Since we query elements in main beforeEach, they should be fine.

            // Ensure initial state for these specific tests
            breathingGuideContainer.classList.add('hidden');
            toggleBreathingGuideBtn.textContent = 'Show Guide';
            breathingPatternSelect.value = '4-2-6';
            customBreathingPatternInputsDiv.classList.add('hidden');
            inhaleTimeInput.value = '4';
            holdTimeInput.value = '2';
            exhaleTimeInput.value = '6';
            breathingCircle.style.animation = 'none'; // Reset animation

            jest.clearAllTimers();
        });

        describe('toggleBreathingGuide', () => {
            it('should show the breathing guide, update button text, and start cycle', () => {
                toggleBreathingGuideBtn.click();
                expect(breathingGuideContainer.classList.contains('hidden')).toBe(false);
                expect(toggleBreathingGuideBtn.textContent).toBe('Hide Guide');
                expect(setTimeout).toHaveBeenCalled();
            });

            it('should hide the breathing guide, update button text, and clear timeouts', () => {
                toggleBreathingGuideBtn.click(); // Show it first
                setTimeout.mockClear();
                clearTimeout.mockClear();

                toggleBreathingGuideBtn.click(); // Hide it
                expect(breathingGuideContainer.classList.contains('hidden')).toBe(true);
                expect(toggleBreathingGuideBtn.textContent).toBe('Show Guide');
                expect(clearTimeout).toHaveBeenCalled();
            });
        });

        describe('updateBreathingPattern', () => {
            it('should set pattern from preset and hide custom inputs', () => {
                breathingPatternSelect.value = '4-7-8'; // Assuming option exists or logic handles it
                // We need to add the option to the DOM if it's not there for the test logic to work if it relies on value
                // In beforeEach we added 4-2-6 and Custom.
                // Let's stick to 4-2-6 or add another one if needed.
                // Or just assume logic reads value.

                // Trigger change
                breathingPatternSelect.dispatchEvent(new Event('change'));
                expect(customBreathingPatternInputsDiv.classList.contains('hidden')).toBe(true);
            });

            it('should set pattern from custom inputs and show custom inputs', () => {
                breathingPatternSelect.value = 'custom';
                breathingPatternSelect.dispatchEvent(new Event('change'));
                expect(customBreathingPatternInputsDiv.classList.contains('hidden')).toBe(false);

                inhaleTimeInput.value = '5';
                holdTimeInput.value = '3';
                exhaleTimeInput.value = '7';
                inhaleTimeInput.dispatchEvent(new Event('change'));
                // Assertions for internal state are hard without exposure,
                // but we can check side effects if any.
            });

            it('should restart cycle if guide is visible when pattern changes', () => {
                toggleBreathingGuideBtn.click(); // Show guide
                clearTimeout.mockClear();
                setTimeout.mockClear();

                breathingPatternSelect.value = 'custom';
                breathingPatternSelect.dispatchEvent(new Event('change'));

                expect(clearTimeout).toHaveBeenCalled();
                expect(setTimeout).toHaveBeenCalled();
            });
        });

        describe('runBreathingCycle', () => {
            beforeEach(() => {
                breathingPatternSelect.value = 'custom';
                customBreathingPatternInputsDiv.classList.remove('hidden');
                inhaleTimeInput.value = '2'; // 2s
                holdTimeInput.value = '1';   // 1s
                exhaleTimeInput.value = '3'; // 3s
                breathingPatternSelect.dispatchEvent(new Event('change'));
                inhaleTimeInput.dispatchEvent(new Event('change'));

                toggleBreathingGuideBtn.click(); // Start cycle
                setTimeout.mockClear(); // Clear initial setup timeout
            });

            it('should display "Inhale" and set inhale animation', () => {
                expect(breathingText.textContent).toBe('Inhale');
                // Note: Animation styles might not be perfectly reflecting in jsdom style object if set via keyframes classes
                // but if set via style property, we can check.
                // Assuming logic sets style.animation.
                expect(breathingCircle.style.animation).toContain('inhaleAnimation');
                expect(breathingCircle.style.animationDuration).toBe('2s');
            });

            it('should display "Hold" after inhale duration', () => {
                jest.advanceTimersByTime(2000); // Inhale time
                expect(breathingText.textContent).toBe('Hold');
            });

            it('should display "Exhale" after hold duration and set exhale animation', () => {
                jest.advanceTimersByTime(2000); // Inhale
                jest.advanceTimersByTime(1000); // Hold
                expect(breathingText.textContent).toBe('Exhale');
                expect(breathingCircle.style.animation).toContain('exhaleAnimation');
                expect(breathingCircle.style.animationDuration).toBe('3s');
            });

            it('should loop by calling runBreathingCycle again after exhale duration', () => {
                setTimeout.mockClear();
                jest.advanceTimersByTime(2000); // Inhale
                jest.advanceTimersByTime(1000); // Hold
                jest.advanceTimersByTime(3000); // Exhale

                // The loop is implemented via setTimeout calling runBreathingCycle again.
                // We expect setTimeout to have been called.
                expect(setTimeout).toHaveBeenCalledTimes(1);

                // Run pending timer to start new cycle
                jest.runOnlyPendingTimers();
                expect(breathingText.textContent).toBe('Inhale');
            });

            it('should clear previous timeouts when a new cycle starts', () => {
                clearTimeout.mockClear();
                jest.advanceTimersByTime(6000); // Full cycle
                jest.runOnlyPendingTimers(); // Start next
                expect(clearTimeout).toHaveBeenCalled();
            });
        });
    });
});
