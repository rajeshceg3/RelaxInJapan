document.addEventListener('DOMContentLoaded', () => {
    // Select DOM Elements
    const quickLinksPanel = document.getElementById('quick-links-panel');
    const addLinkBtn = document.getElementById('add-link-btn');
    const addLinkEmptyStateBtn = document.getElementById('add-link-empty-state-btn');
    const quickLinksList = document.getElementById('quick-links-list');
    const quickLinksEmptyState = document.getElementById('quick-links-empty-state');
    const quickLinkModal = document.getElementById('quick-link-modal');
    const quickLinkForm = document.getElementById('quick-link-form');
    const modalTitle = document.getElementById('quick-link-modal-title');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelLinkBtn = document.getElementById('cancel-link-btn');
    const linkNameInput = document.getElementById('link-name');
    const linkUrlInput = document.getElementById('link-url');
    const linkIconInput = document.getElementById('link-icon');
    const linkCategoryInput = document.getElementById('link-category');
    const linkIdInput = document.getElementById('link-id');
    // New DOM elements for import/export
    const exportLinksBtn = document.getElementById('export-links-btn');
    const importLinksFile = document.getElementById('import-links-file');
    const importLinksBtn = document.getElementById('import-links-btn');


    let links = [];
    let collapsedCategories = {}; // In-memory store for collapsed states

    // TODO: Implement functions to load/save collapsedCategories from localStorage if persistence is desired
    // function loadCollapsedStates() { const s = localStorage.getItem('qlCollapsedCategories'); if(s) collapsedCategories = JSON.parse(s); }
    // function saveCollapsedStates() { localStorage.setItem('qlCollapsedCategories', JSON.stringify(collapsedCategories)); }

    function loadLinks() {
        const storedLinks = localStorage.getItem('quickLinks');
        if (storedLinks) {
            links = JSON.parse(storedLinks);
        }
    }

    function saveLinks() {
        localStorage.setItem('quickLinks', JSON.stringify(links));
    }

    function renderLinks() {
        quickLinksList.innerHTML = '';

        if (links.length === 0) {
            quickLinksEmptyState.style.display = 'flex';
            quickLinksList.style.display = 'none';
        } else {
            quickLinksEmptyState.style.display = 'none';
            quickLinksList.style.display = 'block'; // #quickLinksList is now a block container for headers & sections

            const groupedLinks = links.reduce((acc, link) => {
                const category = link.category || 'Uncategorized';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(link);
                return acc;
            }, {});

            Object.keys(groupedLinks).sort().forEach(categoryName => {
                const categoryHeader = document.createElement('h5');
                categoryHeader.className = 'quick-link-category-header';
                categoryHeader.dataset.category = categoryName;

                const categoryNameSpan = document.createElement('span');
                categoryNameSpan.textContent = categoryName;
                categoryHeader.appendChild(categoryNameSpan);

                const toggleIcon = document.createElement('span');
                toggleIcon.className = 'toggle-icon';
                toggleIcon.textContent = collapsedCategories[categoryName] ? '▶' : '▼';
                categoryHeader.appendChild(toggleIcon);

                quickLinksList.appendChild(categoryHeader);

                const section = document.createElement('div');
                section.className = 'quick-link-category-section';
                section.dataset.categorySection = categoryName;
                if (collapsedCategories[categoryName]) {
                    section.classList.add('collapsed');
                }
                quickLinksList.appendChild(section);

                categoryHeader.addEventListener('click', () => {
                    section.classList.toggle('collapsed');
                    collapsedCategories[categoryName] = section.classList.contains('collapsed');
                    toggleIcon.textContent = collapsedCategories[categoryName] ? '▶' : '▼';
                    // saveCollapsedStates(); // TODO: Save to localStorage
                });

                groupedLinks[categoryName].forEach(link => {
                    const item = document.createElement('div');
                    item.className = 'quick-link-item';
                    item.dataset.id = link.id;
                    item.setAttribute('draggable', true);

                    item.addEventListener('dragstart', (event) => {
                        event.dataTransfer.setData('text/plain', item.dataset.id);
                        event.dataTransfer.effectAllowed = 'move';
                        setTimeout(() => { item.classList.add('dragging'); }, 0);
                    });

                    item.addEventListener('dragend', () => {
                        item.classList.remove('dragging');
                    });

                    const anchor = document.createElement('a');
                    anchor.href = link.url;
                    anchor.target = '_blank';
                    anchor.rel = 'noopener noreferrer';

                    const iconPlaceholder = document.createElement('span');
                    iconPlaceholder.className = 'quick-link-item-icon';
                    if (link.icon && link.icon.trim() !== '') {
                        iconPlaceholder.textContent = link.icon.substring(0, 3);
                    } else {
                        iconPlaceholder.textContent = link.name.charAt(0).toUpperCase();
                    }
                    anchor.appendChild(iconPlaceholder);

                    const nameEl = document.createElement('p');
                    nameEl.className = 'quick-link-item-name';
                    nameEl.textContent = link.name;
                    anchor.appendChild(nameEl);

                    if (link.category && link.category !== "" && link.category !== "Uncategorized") { // Don't show "Uncategorized" text
                        const categoryEl = document.createElement('small');
                        categoryEl.className = 'quick-link-item-category';
                        categoryEl.textContent = link.category;
                        anchor.appendChild(categoryEl);
                    }
                    item.appendChild(anchor);

                    const controlsDiv = document.createElement('div');
                    controlsDiv.className = 'quick-link-item-controls';

                    const editBtn = document.createElement('button');
                    editBtn.textContent = 'Edit';
                    editBtn.className = 'btn btn-secondary btn-small';
                    editBtn.style.marginRight = '4px';
                    editBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const linkToEdit = links.find(l => l.id === link.id);
                        if (linkToEdit) openModal('edit', linkToEdit);
                    });
                    controlsDiv.appendChild(editBtn);

                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.className = 'btn btn-secondary btn-small';
                    deleteBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (confirm('Are you sure you want to remove this link?')) {
                            links = links.filter(l => l.id !== link.id);
                            saveLinks();
                            renderLinks();
                        }
                    });
                    controlsDiv.appendChild(deleteBtn);
                    item.appendChild(controlsDiv);
                    section.appendChild(item);
                });
            });
        }
    }

    function openModal(mode = 'add', linkToEdit = null) {
        quickLinkForm.reset();
        linkIdInput.value = '';
        if (mode === 'edit' && linkToEdit) {
            modalTitle.textContent = 'Edit Link';
            linkNameInput.value = linkToEdit.name;
            linkUrlInput.value = linkToEdit.url;
            linkIconInput.value = linkToEdit.icon || '';
            linkCategoryInput.value = linkToEdit.category || '';
            linkIdInput.value = linkToEdit.id;
        } else {
            modalTitle.textContent = 'Add New Link';
        }
        quickLinkModal.classList.add('visible');
    }

    function closeModal() {
        quickLinkForm.reset();
        quickLinkModal.classList.remove('visible');
    }

    if(addLinkBtn) addLinkBtn.addEventListener('click', () => openModal('add'));
    if(addLinkEmptyStateBtn) addLinkEmptyStateBtn.addEventListener('click', () => openModal('add'));
    if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if(cancelLinkBtn) cancelLinkBtn.addEventListener('click', closeModal);
    if(quickLinkModal) quickLinkModal.addEventListener('click', (e) => {
        if (e.target === quickLinkModal) closeModal();
    });

    if(quickLinkForm) quickLinkForm.addEventListener('submit', function(event) {
        event.preventDefault();
        let name = linkNameInput.value.trim();
        let url = linkUrlInput.value.trim();
        let icon = linkIconInput.value.trim();
        let category = linkCategoryInput.value;
        const idToEdit = linkIdInput.value;

        if (name === '' || name.length > 25) {
            alert('Website Name is required and must be 25 characters or less.');
            linkNameInput.focus();
            return;
        }
        if (url === '') {
            alert('URL is required.');
            linkUrlInput.focus();
            return;
        }
        if (!url.match(/^https?:\/\//i) && !url.match(/^ftps?:\/\//i) && !url.match(/^\/\//i)) {
            url = 'https://' + url;
        }
        try { new URL(url); } catch (e) {
            alert('Invalid URL. Please enter a valid URL (e.g., https://example.com).');
            linkUrlInput.focus();
            return;
        }

        if (idToEdit) {
            links = links.map(link => link.id === idToEdit ? { ...link, name, url, icon, category } : link);
        } else {
            if (links.length >= 20) {
                alert('You have reached the maximum of 20 links.');
                return;
            }
            const newLink = { id: Date.now().toString(), name, url, icon, category };
            links.push(newLink);
        }
        saveLinks();
        renderLinks();
        closeModal();
    });

    // loadCollapsedStates(); // TODO: Call before loadLinks and renderLinks if persisting
    loadLinks();
    renderLinks();

    // Export Links Functionality
    if (exportLinksBtn) {
        exportLinksBtn.addEventListener('click', () => {
            if (links.length === 0) {
                alert('No links to export.');
                return;
            }
            const jsonString = JSON.stringify(links, null, 2); // Pretty print JSON
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'quick-links-backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // Import Links Functionality
    if (importLinksBtn && importLinksFile) {
        importLinksBtn.addEventListener('click', () => {
            importLinksFile.click(); // Trigger hidden file input
        });

        importLinksFile.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedLinks = JSON.parse(e.target.result);
                    if (!Array.isArray(importedLinks)) {
                        throw new Error('Invalid format: File content is not an array.');
                    }

                    // Basic validation of link structure (check first item if array is not empty)
                    if (importedLinks.length > 0) {
                        const firstLink = importedLinks[0];
                        if (typeof firstLink.name === 'undefined' || typeof firstLink.url === 'undefined' || typeof firstLink.id === 'undefined') {
                            // Allow missing icon and category, but id, name, url must be somewhat present
                            throw new Error('Invalid link structure: Each link must have at least id, name, and url properties.');
                        }
                    }

                    if (confirm('This will replace all your current links with the imported ones. Are you sure?')) {
                        // Sanitize and map imported links, ensuring unique IDs and essential fields.
                        // Cap at 20 links.
                        const sanitizedLinks = importedLinks.slice(0, 20).map((link, index) => ({
                            id: String(link.id || (Date.now().toString() + index)), // Ensure ID is a string, generate if missing
                            name: String(link.name || 'Untitled Link'),
                            url: String(link.url || '#'), // Default URL if missing
                            icon: String(link.icon || ''),
                            category: String(link.category || 'Uncategorized')
                        }));

                        links = sanitizedLinks;
                        saveLinks();
                        renderLinks(); // Re-render with new links
                        alert('Links imported successfully!');
                    }
                } catch (error) {
                    alert('Failed to import links: ' + error.message);
                } finally {
                    // Reset file input to allow importing the same file again if needed
                    event.target.value = null;
                }
            };
            reader.onerror = () => {
                alert('Error reading file.');
                event.target.value = null; // Reset file input on error
            };
            reader.readAsText(file);
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.quick-link-category-section:not(.collapsed) .quick-link-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    if (quickLinksList) {
        quickLinksList.addEventListener('dragover', event => {
            event.preventDefault();
            const draggingItem = document.querySelector('.dragging');
            if (!draggingItem) return;

            const afterElement = getDragAfterElement(quickLinksList, event.clientY);
            if (afterElement == null) {
                const lastVisibleSection = quickLinksList.querySelector('.quick-link-category-section:not(.collapsed):last-of-type');
                if (lastVisibleSection) {
                    lastVisibleSection.appendChild(draggingItem);
                } else {
                    // If no sections or all collapsed, this might need a fallback.
                    // For now, let it be, or append to quickLinksList directly if that's desired.
                }
            } else {
                afterElement.parentNode.insertBefore(draggingItem, afterElement);
            }
        });

        quickLinksList.addEventListener('drop', event => {
            event.preventDefault();
            const draggingItem = document.querySelector('.dragging'); // get it before it's potentially removed
            if (draggingItem) {
                 draggingItem.classList.remove('dragging');
            }

            const newLinksOrder = [];
            const allItemsInDom = quickLinksList.querySelectorAll('.quick-link-item');
            allItemsInDom.forEach(domItem => {
                const linkId = domItem.dataset.id;
                const originalLink = links.find(l => l.id === linkId);
                if (originalLink) {
                    // Category is NOT changed by D&D in this version
                    newLinksOrder.push(originalLink);
                }
            });
            links = newLinksOrder;
            saveLinks();
            renderLinks(); // Re-render to ensure correct structure and listeners
        });
    }
});
