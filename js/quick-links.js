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


    const data = window.QuickLinkData;
    const status = document.getElementById('quick-links-status');
    const tell = text => { status.textContent = text; document.getElementById('quick-link-form-status').textContent=text; };
    let expected = null, blocked = false, staged = null, readGeneration = 0;
    const jump=document.querySelector('a.links-jump'),exit=document.getElementById('links-exit-reading');
    jump.addEventListener('click',event=>{event.preventDefault();document.getElementById('journal-exit-reading').click();document.body.classList.add('links-reading');exit.hidden=false;jump.hidden=true;document.getElementById('quick-links-panel').scrollIntoView({block:'start'});document.getElementById('quick-links-title').focus({preventScroll:true});});
    exit.addEventListener('click',()=>{document.body.classList.remove('links-reading');exit.hidden=true;jump.hidden=false;window.scrollTo(0,0);jump.focus();});
    document.querySelector('a.journal-jump').addEventListener('click',()=>{document.body.classList.remove('links-reading');exit.hidden=true;jump.hidden=false;});
    document.addEventListener('keydown',event=>{
      if(quickLinkModal.classList.contains('hidden'))return;
      if(event.key==='Escape')closeModal();
      if(event.key==='Tab'){const fields=[...quickLinkModal.querySelectorAll('button,input:not([type=hidden])')].filter(e=>!e.disabled);const first=fields[0],last=fields[fields.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
    });
    let links = [];
    let collapsedCategories = Object.create(null); // In-memory store for collapsed states

    // TODO: Implement functions to load/save collapsedCategories from localStorage if persistence is desired
    // function loadCollapsedStates() { const s = localStorage.getItem('qlCollapsedCategories'); if(s) collapsedCategories = JSON.parse(s); }
    // function saveCollapsedStates() { localStorage.setItem('qlCollapsedCategories', JSON.stringify(collapsedCategories)); }

    function loadLinks() {
        try { expected=localStorage.getItem(data.KEY);links=data.local(expected); }
        catch(e) { blocked=true;tell('Links could not be loaded: '+e.message+' Original data is unchanged. Download the raw copy before repair.'); }
        addLinkBtn.disabled=blocked;addLinkEmptyStateBtn.disabled=blocked;
    }
    function saveLinks(next) {
        if(blocked){tell('Saving is paused to keep original link data unchanged.');return false;}
        try { expected=data.commit(localStorage,expected,next);links=next;tell('Links saved in this browser only. Download a file to keep a private copy.');return true; }
        catch(e){tell('Not saved: '+e.message+' Your previous links and open form are still here.');return false;}
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
            }, Object.create(null));

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
                        iconPlaceholder.textContent = Array.from(link.icon).slice(0,3).join('');
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
                            if(saveLinks(links.filter(l => l.id !== link.id))) renderLinks();
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
        if(blocked)return;
        document.getElementById('quick-link-form-status').textContent='';
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
        quickLinkModal.classList.remove('hidden');
        document.body.classList.add('links-modal-open');linkNameInput.focus();
    }

    function closeModal() {
        quickLinkForm.reset();
        quickLinkModal.classList.add('hidden');
        document.body.classList.remove('links-modal-open');addLinkBtn.focus();
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
        try { data.safeURL(url); } catch (e) {
            alert('Invalid URL. Please enter a valid URL (e.g., https://example.com).');
            linkUrlInput.focus();
            return;
        }

        let next;
        if (idToEdit) {
            next = links.map(link => link.id === idToEdit ? { ...link, name, url, icon, category } : link);
        } else {
            if (links.length >= 20) {
                alert('You have reached the maximum of 20 links.');
                return;
            }
            const newLink = { id: crypto.randomUUID(), name, url, icon, category };
            next=[...links,newLink];
        }
        if(saveLinks(next)){renderLinks();closeModal();}
    });

    // loadCollapsedStates(); // TODO: Call before loadLinks and renderLinks if persisting
    loadLinks();
    renderLinks();

    function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    exportLinksBtn.addEventListener('click',()=>{try{download(data.encode(data.local(localStorage.getItem(data.KEY))),'relax-links-'+Date.now()+'.json');tell('Link file download requested. This is not cloud saving.');}catch(e){tell('Backup stopped: '+e.message+' Use the raw copy.');}});
    document.getElementById('quick-links-raw').addEventListener('click',()=>{try{download(data.raw(localStorage.getItem(data.KEY)),'relax-links-original-'+Date.now()+'.json');tell('Raw-copy download requested. Exact stored text is inside its raw field; it may need repair before restore.');}catch(e){tell(e.message);}});
    const preview=document.getElementById('links-restore-preview'),approve=document.getElementById('links-replace-approve'),replace=document.getElementById('links-replace-confirm');
    function resetPreview(){staged=null;preview.hidden=true;approve.checked=false;replace.disabled=true;}
    importLinksBtn.addEventListener('click',()=>importLinksFile.click());
    importLinksFile.addEventListener('change',async()=>{
      const generation=++readGeneration;resetPreview();const file=importLinksFile.files[0];if(!file){tell('No file selected. Nothing changed.');return;}
      try{
       if(file.size>data.LIMIT)throw Error('Choose a file smaller than 1 MB.');
       const entries=data.parse(await file.text());if(generation!==readGeneration)return;
       const raw=localStorage.getItem(data.KEY);const current=data.local(raw);if(blocked)throw Error('Reload after repairing the original link data.');
       staged={entries,raw};document.getElementById('links-preview-summary').textContent=`${entries.length} links in this file replace all ${current.length} links in this browser. An empty file clears all links. Nothing has changed yet.`;
       const items=document.getElementById('links-preview-items');items.replaceChildren();for(const l of entries){const item=document.createElement('li');item.textContent=l.name+' · '+l.url;items.append(item);}
       preview.hidden=false;tell('Preview ready. Download your current links first. A previous raw copy will be retained before replacement.');
      }catch(e){tell('File refused: '+e.message+' Nothing changed.');}
      finally{if(generation===readGeneration)importLinksFile.value='';}
    });
    approve.addEventListener('change',()=>replace.disabled=!staged||!approve.checked);
    document.getElementById('links-restore-cancel').addEventListener('click',()=>{++readGeneration;resetPreview();importLinksFile.value='';tell('Restore cancelled. Nothing changed.');});
    replace.addEventListener('click',()=>{
      if(!staged||!approve.checked)return;
      try{data.replace(localStorage,staged.raw,staged.entries,Date.now()+'-'+crypto.randomUUID());expected=localStorage.getItem(data.KEY);links=staged.entries;renderLinks();resetPreview();importLinksFile.value='';showPrevious();tell('Links replaced in this browser only. Previous raw copy retained and available below.');}
      catch(e){resetPreview();tell('Restore stopped: '+e.message+' Original links remain unchanged.');}
    });
    const previous=document.getElementById('quick-links-previous');
    function showPrevious(){try{previous.hidden=!Object.keys(localStorage).some(k=>k.startsWith('quickLinksRecoveryPrior:'));}catch{previous.hidden=true;}}
    showPrevious();previous.addEventListener('click',()=>{try{const k=Object.keys(localStorage).filter(k=>k.startsWith('quickLinksRecoveryPrior:')).sort().pop();download(localStorage.getItem(k),'relax-links-previous-raw-'+Date.now()+'.json');tell('Previous raw-copy download requested. Its raw field keeps the earlier stored text. It may need repair before restore.');}catch(e){tell(e.message);}});

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
            saveLinks(newLinksOrder);
            renderLinks(); // Re-render to ensure correct structure and listeners
        });
    }
});
