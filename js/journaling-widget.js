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
            const storedEntries = localStorage.getItem('journalEntries');
            if (storedEntries) {
                this.entries = JSON.parse(storedEntries);
                // Ensure entries are sorted by date, just in case they were manually edited or saved out of order
                this.entries.sort((a, b) => new Date(a.date) - new Date(b.date));
            } else {
                this.entries = [];
            }
        },

        saveEntriesToLocalStorage() {
            // Sort before saving to maintain order
            this.entries.sort((a, b) => new Date(a.date) - new Date(b.date));
            localStorage.setItem('journalEntries', JSON.stringify(this.entries));
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

            this.saveEntriesToLocalStorage();
            this.elements.textInput.value = ''; // Clear textarea
            this.clearSelectedMood();

            // After saving, display the newly saved/updated entry for today
            this.currentEntryIndex = this.entries.findIndex(entry => entry.date === todayDate);
            this.displayEntry(this.currentEntryIndex);

            this.elements.emptyStateDisplay.style.display = 'none';
            this.elements.currentEntryDisplayContainer.style.display = 'block';
            this.updateNavigationButtons();
            this.populateDatePickerWithEntryDates(); // Update date picker options

            // Provide feedback (could be a more subtle notification)
            // For now, a simple alert. Consider replacing with a less obtrusive notification.
            const tempFeedback = document.createElement('p');
            tempFeedback.textContent = 'Entry saved!';
            tempFeedback.style.color = 'green';
            tempFeedback.style.fontSize = 'var(--font-size-sm)';
            tempFeedback.style.textAlign = 'center';
            this.elements.saveButton.insertAdjacentElement('afterend', tempFeedback);
            setTimeout(() => tempFeedback.remove(), 2000);
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
