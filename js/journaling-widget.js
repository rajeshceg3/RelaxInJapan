document.addEventListener('DOMContentLoaded', () => {
    const journalWidget = {
        elements: {
            widgetContainer: document.getElementById('journaling-widget'),
            textInput: document.getElementById('journal-text-input'),
            moodSelector: document.getElementById('journal-mood-selector'),
            moodButtons: document.querySelectorAll('.mood-btn'),
            saveButton: document.getElementById('journal-save-btn'),
            historyArea: document.getElementById('journal-history-area'),
            currentEntryDateDisplay: document.getElementById('journal-entry-date-display'),
            currentEntryMoodDisplay: document.getElementById('journal-entry-mood-display'),
            currentEntryTextDisplay: document.getElementById('journal-entry-text-display'),
            prevEntryButton: document.getElementById('journal-prev-entry-btn'),
            nextEntryButton: document.getElementById('journal-next-entry-btn'),
            datePicker: document.getElementById('journal-date-picker'),
            emptyStateDisplay: document.getElementById('journal-empty-state'),
            currentEntryDisplayContainer: document.getElementById('journal-current-entry-display'),
        },
        entries: [],
        currentEntryIndex: -1,
        selectedMood: null,

        init() {
            if (!this.elements.widgetContainer) {
                console.warn('Journaling widget elements not found. Aborting initialization.');
                return;
            }

            this.loadEntries();
            this.attachEventListeners();

            if (this.entries.length > 0) {
                this.currentEntryIndex = this.entries.length - 1; // Show the latest entry first
                this.displayEntry(this.currentEntryIndex);
                this.elements.emptyStateDisplay.style.display = 'none';
                this.elements.currentEntryDisplayContainer.style.display = 'block';
            } else {
                this.showEmptyState();
            }
            this.updateNavigationButtons();
            this.populateDatePickerWithEntryDates();
        },

        attachEventListeners() {
            this.elements.saveButton.addEventListener('click', () => this.saveCurrentEntry());

            this.elements.moodButtons.forEach(button => {
                button.addEventListener('click', (e) => this.selectMood(e.currentTarget));
            });

            this.elements.prevEntryButton.addEventListener('click', () => this.navigateToPreviousEntry());
            this.elements.nextEntryButton.addEventListener('click', () => this.navigateToNextEntry());
            this.elements.datePicker.addEventListener('change', (e) => this.loadEntryByDate(e.target.value));

            // Optional: Clear mood when textarea is focused to encourage fresh mood selection
            this.elements.textInput.addEventListener('focus', () => {
                // this.clearSelectedMood(); // Decided against this for now to allow mood selection before writing
            });
        },

        loadEntries() {
            try {
                this.expectedRaw = localStorage.getItem('journalEntries');
                this.entries = window.JournalRecovery.local(this.expectedRaw);
                this.entries.sort((a, b) => a.date.localeCompare(b.date));
                this.elements.saveButton.disabled = false;
            } catch (error) {
                this.entries = [];
                this.elements.saveButton.disabled = true;
                document.getElementById('journal-save-status').textContent = 'Journal could not be read. Its original data was not changed. Use Original data copy below before any repair.';
            }
        },

        saveEntriesToLocalStorage() {
            if (localStorage.getItem('journalEntries') !== this.expectedRaw) throw Error('Journal changed in another tab.');
            window.JournalRecovery.validate(this.entries);
            // Sort before saving to maintain order
            this.entries.sort((a, b) => new Date(a.date) - new Date(b.date));
            const nextRaw = JSON.stringify(this.entries);
            localStorage.setItem('journalEntries', nextRaw);
            this.expectedRaw = nextRaw;
        },

        getCurrentFormattedDate() {
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
            const day = today.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        selectMood(moodButton) {
            this.elements.moodButtons.forEach(btn => btn.classList.remove('selected'));
            moodButton.classList.add('selected');
            this.selectedMood = moodButton.dataset.mood;
        },

        clearSelectedMood() {
            this.elements.moodButtons.forEach(btn => btn.classList.remove('selected'));
            this.selectedMood = null;
        },

        saveCurrentEntry() {
            const text = this.elements.textInput.value.trim();
            const todayDate = this.getCurrentFormattedDate();

            if (!text) {
                alert('Please write something in your journal entry.');
                return;
            }

            const priorEntries = JSON.parse(JSON.stringify(this.entries));
            // Check if an entry for today already exists
            const existingEntryIndex = this.entries.findIndex(entry => entry.date === todayDate);

            if (existingEntryIndex > -1) {
                // Update existing entry for today
                this.entries[existingEntryIndex].text = text;
                if (this.selectedMood) {
                    this.entries[existingEntryIndex].mood = this.selectedMood;
                } else if (!this.entries[existingEntryIndex].mood) {
                     // If no mood was previously set and none is selected now, don't add an empty mood
                }
            } else {
                // Add new entry for today
                const newEntry = {
                    date: todayDate,
                    text: text,
                    mood: this.selectedMood || null // Store null if no mood selected
                };
                this.entries.push(newEntry);
            }

            try { this.saveEntriesToLocalStorage(); }
            catch (error) {
                this.entries = priorEntries;
                document.getElementById('journal-save-status').textContent = 'Could not save: ' + error.message + ' Your draft is still here. Download a backup before clearing browser storage or reload.';
                return;
            }
            this.elements.textInput.value = ''; // Clear textarea
            this.clearSelectedMood();

            // After saving, display the newly saved/updated entry for today
            this.currentEntryIndex = this.entries.findIndex(entry => entry.date === todayDate);
            this.displayEntry(this.currentEntryIndex);

            this.elements.emptyStateDisplay.style.display = 'none';
            this.elements.currentEntryDisplayContainer.style.display = 'block';
            this.updateNavigationButtons();
            this.populateDatePickerWithEntryDates(); // Update date picker options

            document.getElementById('journal-save-status').textContent = 'Entry saved in this browser only.';
        },

        displayEntry(index) {
            if (index < 0 || index >= this.entries.length) {
                this.showEmptyState(true); // true indicates it's for current display, not initial load
                return;
            }

            const entry = this.entries[index];
            this.elements.currentEntryDateDisplay.textContent = `Date: ${this.formatDisplayDate(entry.date)}`;
            this.elements.currentEntryMoodDisplay.textContent = `Mood: ${entry.mood || 'Not set'}`;
            this.elements.currentEntryTextDisplay.innerHTML = ''; // Clear previous content

            // Sanitize and display text (simple version, consider a more robust sanitizer if HTML input is ever allowed)
            const paragraphs = entry.text.split('\n'); // Handle manual newlines if any, or just display as is
            paragraphs.forEach(pText => {
                const pElement = document.createElement('p');
                pElement.textContent = pText;
                this.elements.currentEntryTextDisplay.appendChild(pElement);
            });

            this.elements.datePicker.value = entry.date; // Sync date picker
            this.elements.emptyStateDisplay.style.display = 'none';
            this.elements.currentEntryDisplayContainer.style.display = 'block';
        },

        formatDisplayDate(dateString) { // YYYY-MM-DD to a more readable format
            const date = new Date(dateString + 'T00:00:00'); // Ensure correct parsing by providing time
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        },

        showEmptyState(isCurrentDisplayEmpty = false) {
            this.elements.currentEntryDateDisplay.textContent = 'Date: ---';
            this.elements.currentEntryMoodDisplay.textContent = 'Mood: ---';
            this.elements.currentEntryTextDisplay.innerHTML = '<p>No entry selected or available.</p>';
            if (!isCurrentDisplayEmpty) { // Only hide container if it's an initial empty state
                 this.elements.currentEntryDisplayContainer.style.display = 'none';
                 this.elements.emptyStateDisplay.style.display = 'block';
            }
            this.elements.datePicker.value = '';
        },

        updateNavigationButtons() {
            this.elements.prevEntryButton.disabled = this.currentEntryIndex <= 0;
            this.elements.nextEntryButton.disabled = this.currentEntryIndex >= this.entries.length - 1 || this.entries.length === 0;
        },

        navigateToPreviousEntry() {
            if (this.currentEntryIndex > 0) {
                this.currentEntryIndex--;
                this.displayEntry(this.currentEntryIndex);
                this.updateNavigationButtons();
            }
        },

        navigateToNextEntry() {
            if (this.currentEntryIndex < this.entries.length - 1) {
                this.currentEntryIndex++;
                this.displayEntry(this.currentEntryIndex);
                this.updateNavigationButtons();
            }
        },

        loadEntryByDate(dateString) {
            const entryIndex = this.entries.findIndex(entry => entry.date === dateString);
            if (entryIndex > -1) {
                this.currentEntryIndex = entryIndex;
                this.displayEntry(this.currentEntryIndex);
            } else {
                // If no entry for selected date, show a message or the closest entry
                this.elements.currentEntryDateDisplay.textContent = `Date: ${this.formatDisplayDate(dateString)}`;
                this.elements.currentEntryMoodDisplay.textContent = 'Mood: ---';
                this.elements.currentEntryTextDisplay.innerHTML = '<p>No entry found for this date.</p>';
                // Optionally, disable nav buttons or adjust index if needed
            }
            this.updateNavigationButtons();
        },

        populateDatePickerWithEntryDates() {
            // This is simplified. A true <datalist> approach or custom dropdown might be better for many entries.
            // For now, the date picker itself allows navigation to any date.
            // We can set min/max if desired based on entry dates.
            if (this.entries.length > 0) {
                this.elements.datePicker.min = this.entries[0].date;
                this.elements.datePicker.max = this.entries[this.entries.length - 1].date;
            } else {
                this.elements.datePicker.min = '';
                this.elements.datePicker.max = '';
            }
        }
    };

    journalWidget.init();
    window.journalWidget = journalWidget; // Optional: Expose for debugging or integration
});
