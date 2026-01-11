const imageGalleryState = {
  currentImageIndex: -1, // -1 indicates no image loaded initially
  isPlaying: true,
  selectedCategory: 'all',
  imageHistory: [], // To track recently shown images
  transitionInProgress: false,
  userPreferences: {
    autoRotate: true,
    transitionDuration: 2000, // ms
    rotationInterval: 300000, // 5 minutes in ms
    preferredCategories: ['all']
  },
  wasPlayingBeforeHidden: false,
  wasPlayingBeforeLightbox: false // Added for lightbox
};

const galleryImages = [
  // Seasons (6 images)
  { id: 's01', title: 'Sakura Bloom', location: 'Kyoto', photographer: 'Photographer A', category: 'seasons', path: 'images/seasons/season_01.jpg' },
  { id: 's02', title: 'Autumn Leaves', location: 'Nikko', photographer: 'Photographer B', category: 'seasons', path: 'images/seasons/season_02.jpg' },
  { id: 's03', title: 'Winter Snowscape', location: 'Hokkaido', photographer: 'Photographer C', category: 'seasons', path: 'images/seasons/season_03.jpg' },
  { id: 's04', title: 'Summer Festival', location: 'Tokyo', photographer: 'Photographer D', category: 'seasons', path: 'images/seasons/season_04.jpg' },
  { id: 's05', title: 'Early Spring Greens', location: 'Kamakura', photographer: 'Photographer E', category: 'seasons', path: 'images/seasons/season_05.jpg' },
  { id: 's06', title: 'Late Autumn Sunset', location: 'Hakone', photographer: 'Photographer F', category: 'seasons', path: 'images/seasons/season_06.jpg' },

  // Architecture (6 images)
  { id: 'a01', title: 'Kinkaku-ji Temple', location: 'Kyoto', photographer: 'Photographer G', category: 'architecture', path: 'images/architecture/architecture_01.jpg' },
  { id: 'a02', title: 'Modern Shrine Design', location: 'Osaka', photographer: 'Photographer H', category: 'architecture', path: 'images/architecture/architecture_02.jpg' },
  { id: 'a03', title: 'Traditional Garden Bridge', location: 'Kanazawa', photographer: 'Photographer I', category: 'architecture', path: 'images/architecture/architecture_03.jpg' },
  { id: 'a04', title: 'Tokyo Skytree', location: 'Tokyo', photographer: 'Photographer J', category: 'architecture', path: 'images/architecture/architecture_04.jpg' },
  { id: 'a05', title: 'Himeji Castle', location: 'Himeji', photographer: 'Photographer K', category: 'architecture', path: 'images/architecture/architecture_05.jpg' },
  { id: 'a06', title: 'Rural Farmhouse', location: 'Shirakawa-go', photographer: 'Photographer L', category: 'architecture', path: 'images/architecture/architecture_06.jpg' },

  // Nature (6 images)
  { id: 'n01', title: 'Mount Fuji View', location: 'Yamanashi', photographer: 'Photographer M', category: 'nature', path: 'images/nature/nature_01.jpg' },
  { id: 'n02', title: 'Bamboo Forest', location: 'Arashiyama', photographer: 'Photographer N', category: 'nature', path: 'images/nature/nature_02.jpg' },
  { id: 'n03', title: 'Okinawa Coastline', location: 'Okinawa', photographer: 'Photographer O', category: 'nature', path: 'images/nature/nature_03.jpg' },
  { id: 'n04', title: 'Aokigahara Forest', location: 'Fuji-Hakone-Izu National Park', photographer: 'Photographer P', category: 'nature', path: 'images/nature/nature_04.jpg' },
  { id: 'n05', title: 'Nachi Falls', location: 'Wakayama', photographer: 'Photographer Q', category: 'nature', path: 'images/nature/nature_05.jpg' },
  { id: 'n06', title: 'Shiretoko Peninsula', location: 'Hokkaido', photographer: 'Photographer R', category: 'nature', path: 'images/nature/nature_06.jpg' },

  // Culture (6 images)
  { id: 'c01', title: 'Tea Ceremony Still Life', location: 'Uji', photographer: 'Photographer S', category: 'culture', path: 'images/culture/culture_01.jpg' },
  { id: 'c02', title: 'Zen Garden Raked Sand', location: 'Kyoto', photographer: 'Photographer T', category: 'culture', path: 'images/culture/culture_02.jpg' },
  { id: 'c03', title: 'Traditional Pottery Kiln', location: 'Mashiko', photographer: 'Photographer U', category: 'culture', path: 'images/culture/culture_03.jpg' },
  { id: 'c04', title: 'Calligraphy Tools', location: 'Nara', photographer: 'Photographer V', category: 'culture', path: 'images/culture/culture_04.jpg' },
  { id: 'c05', title: 'Ikebana Flower Arrangement', location: 'Tokyo', photographer: 'Photographer W', category: 'culture', path: 'images/culture/culture_05.jpg' },
  { id: 'c06', title: 'Taiko Drummers', location: 'Sado Island', photographer: 'Photographer X', category: 'culture', path: 'images/culture/culture_06.jpg' }
];

// DOM Elements
let backgroundGalleryElement;
let bgImageContainer1, bgImageContainer2;
let categoryFilterElement;
let toggleRotationBtn, nextImageBtn, prevImageBtn, imageInfoOverlayElement, galleryControlsElement;
let controlsHideTimeout = null;

// Lightbox DOM Elements
let lightboxOverlayElement, lightboxContainerElement, lightboxImageElement, lightboxCloseBtnElement, lightboxInfoElement;
let lightboxPrevBtnElement, lightboxNextBtnElement;
let currentLightboxImageIndexInFilteredList = -1; // For lightbox navigation

let currentVisibleContainer;
let rotationIntervalId = null;

// --- Initialization ---
function initializeGallery() {
    try {
        // Cache DOM elements
        backgroundGalleryElement = document.getElementById('background-gallery');
        categoryFilterElement = document.getElementById('category-filter');
        toggleRotationBtn = document.getElementById('toggle-rotation');
        nextImageBtn = document.getElementById('next-image');
        prevImageBtn = document.getElementById('prev-image');
        imageInfoOverlayElement = document.getElementById('image-info-overlay');
        galleryControlsElement = document.getElementById('gallery-controls');

        if (!backgroundGalleryElement || !categoryFilterElement || !toggleRotationBtn || !nextImageBtn || !prevImageBtn || !imageInfoOverlayElement || !galleryControlsElement) {
            console.log('Init Check Failed:', {
                bg: !!backgroundGalleryElement,
                filter: !!categoryFilterElement,
                toggle: !!toggleRotationBtn,
                next: !!nextImageBtn,
                prev: !!prevImageBtn,
                info: !!imageInfoOverlayElement,
                controls: !!galleryControlsElement
            });
            console.error("One or more gallery DOM elements are missing. Initialization aborted.");
            return;
        }

        imageInfoOverlayElement.setAttribute('aria-live', 'polite');

        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            console.log("Reduced motion is preferred. CSS handles transition disabling.");
        }

        bgImageContainer1 = document.createElement('div');
        bgImageContainer1.className = 'bg-image-container';
        bgImageContainer2 = document.createElement('div');
        bgImageContainer2.className = 'bg-image-container';
        backgroundGalleryElement.appendChild(bgImageContainer1);
        backgroundGalleryElement.appendChild(bgImageContainer2);
        currentVisibleContainer = bgImageContainer1;

        populateCategoryFilter();
        loadUserPreferences();
        loadInitialImage();

        if (imageGalleryState.userPreferences.autoRotate && imageGalleryState.isPlaying) {
            startRotation();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        toggleRotationBtn.addEventListener('click', handleToggleRotation);
        nextImageBtn.addEventListener('click', handleNextImage);
        prevImageBtn.addEventListener('click', handlePreviousImage);
        categoryFilterElement.addEventListener('change', handleCategoryChange);
        document.addEventListener('mousemove', handleControlsVisibility);
        resetControlsHideTimer();

        // Cache Lightbox DOM Elements
        lightboxOverlayElement = document.getElementById('lightbox-overlay');
        lightboxContainerElement = document.getElementById('lightbox-container');
        lightboxImageElement = document.getElementById('lightbox-image');
        lightboxCloseBtnElement = document.getElementById('lightbox-close-btn');
        lightboxInfoElement = document.getElementById('lightbox-info');
        lightboxPrevBtnElement = document.getElementById('lightbox-prev-btn');
        lightboxNextBtnElement = document.getElementById('lightbox-next-btn');

        if (!lightboxOverlayElement || !lightboxContainerElement || !lightboxImageElement || !lightboxCloseBtnElement) {
            console.error("Essential lightbox DOM elements are missing. Lightbox functionality will be disabled.");
        } else {
            lightboxCloseBtnElement.addEventListener('click', closeLightbox);
            if (imageInfoOverlayElement) {
                imageInfoOverlayElement.addEventListener('click', () => {
                    if (imageGalleryState.currentImageIndex !== -1 && galleryImages[imageGalleryState.currentImageIndex]) {
                        openLightbox(galleryImages[imageGalleryState.currentImageIndex]);
                    }
                });
                imageInfoOverlayElement.style.cursor = 'pointer';
            } else {
                console.warn("Image info overlay element not found. Cannot attach lightbox trigger.");
            }

            if (lightboxPrevBtnElement && lightboxNextBtnElement) {
                lightboxPrevBtnElement.addEventListener('click', showPreviousImageInLightbox);
                lightboxNextBtnElement.addEventListener('click', showNextImageInLightbox);
            } else {
                console.warn("Lightbox navigation buttons not found. Navigation will be disabled.");
            }
        }
    } catch (error) {
        console.error("Error during gallery initialization:", error);
        if (galleryControlsElement) galleryControlsElement.classList.add('hidden');
        if (imageInfoOverlayElement) imageInfoOverlayElement.classList.remove('visible');
    }
}

function populateCategoryFilter() {
    const categories = ['all', ...new Set(galleryImages.map(img => img.category))];
    categoryFilterElement.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        if (category === imageGalleryState.selectedCategory) {
            option.selected = true;
        }
        categoryFilterElement.appendChild(option);
    });
}

async function loadInitialImage() {
    const initialImageObject = getNextImageObject();
    if (initialImageObject) {
        await loadImage(initialImageObject, currentVisibleContainer, false);
        imageGalleryState.currentImageIndex = galleryImages.indexOf(initialImageObject);
        preloadNextImage();
    } else {
        console.error("No images available to load initially.");
    }
}

async function loadImage(imageObject, containerElement, isPreload) {
    if (!imageObject || !imageObject.path) {
        console.error("Invalid image object or path:", imageObject);
        if (!isPreload && containerElement) handleImageLoadError(containerElement);
        else if (!isPreload) handleImageLoadError(null);
        return null;
    }
    imageGalleryState.transitionInProgress = !isPreload;
    const img = new Image();
    img.src = imageObject.path;
    try {
        await img.decode();
        if (!isPreload) {
            containerElement.style.backgroundImage = `url('${imageObject.path}')`;
            containerElement.style.backgroundColor = '';
            if (imageObject && imageObject.title && imageObject.location) {
                imageInfoOverlayElement.innerHTML = `<p><strong>${imageObject.title}</strong><br>${imageObject.location}</p>`;
                imageInfoOverlayElement.classList.add('visible');
            } else {
                imageInfoOverlayElement.classList.remove('visible');
            }
        } else {
            console.log(`Preloaded: ${imageObject.title} from ${imageObject.path}`);
        }
        imageGalleryState.transitionInProgress = false;
        return img;
    } catch (error) {
        console.error("Error loading image:", imageObject.path, error);
        if (!isPreload) handleImageLoadError(containerElement);
        imageGalleryState.transitionInProgress = false;
        return null;
    }
}

function handleImageLoadError(containerElement) {
    console.warn("Failed to load image. Displaying fallback and attempting to skip.");
    if (containerElement) {
        containerElement.style.backgroundImage = 'none';
        containerElement.style.backgroundColor = '#E0E0E0';
    }
    imageInfoOverlayElement.classList.remove('visible');
    if (imageGalleryState.isPlaying && imageGalleryState.userPreferences.autoRotate) {
        console.log("Attempting to load next image after error...");
        stopRotation();
        setTimeout(() => {
            crossfadeToNextImage().then(() => {
                if (imageGalleryState.isPlaying && imageGalleryState.userPreferences.autoRotate) {
                    startRotation();
                }
            });
        }, 1000);
    }
}

async function crossfadeToNextImage() {
    if (imageGalleryState.transitionInProgress) return;
    const nextImageObject = getNextImageObject();
    if (!nextImageObject) {
        console.warn("No suitable next image found for crossfade.");
        return;
    }
    imageGalleryState.transitionInProgress = true;
    const newVisibleContainer = (currentVisibleContainer === bgImageContainer1) ? bgImageContainer2 : bgImageContainer1;
    const oldVisibleContainer = currentVisibleContainer;
    const loadedImage = await loadImage(nextImageObject, newVisibleContainer, false);
    if (loadedImage) {
        newVisibleContainer.classList.add('visible');
        oldVisibleContainer.classList.remove('visible');
        currentVisibleContainer = newVisibleContainer;
        imageGalleryState.currentImageIndex = galleryImages.indexOf(nextImageObject);
        updateImageHistory(nextImageObject);
        preloadNextImage();
    } else {
        console.error("Crossfade aborted due to image load failure.");
    }
    imageGalleryState.transitionInProgress = false;
}

function getNextImageObject() {
    const availableImages = galleryImages.filter(img => {
        const categoryMatch = imageGalleryState.selectedCategory === 'all' || img.category === imageGalleryState.selectedCategory;
        if (!categoryMatch) return false;
        return !imageGalleryState.imageHistory.slice(-(12 - 1)).some(historicImg => historicImg.id === img.id);
    });
    if (availableImages.length === 0) {
        const fallbackImages = galleryImages.filter(img =>
            imageGalleryState.selectedCategory === 'all' || img.category === imageGalleryState.selectedCategory
        );
        if (fallbackImages.length === 0) return null;
        return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    }
    return availableImages[Math.floor(Math.random() * availableImages.length)];
}

function updateImageHistory(imageObject) {
    imageGalleryState.imageHistory.push(imageObject);
    if (imageGalleryState.imageHistory.length > 12) {
        imageGalleryState.imageHistory.shift();
    }
}

let preloadedImage = null;
async function preloadNextImage() {
    const potentialNext = getNextImageObject();
    if (potentialNext && potentialNext.id !== (galleryImages[imageGalleryState.currentImageIndex] && galleryImages[imageGalleryState.currentImageIndex].id)) {
        preloadedImage = await loadImage(potentialNext, null, true);
    } else {
        preloadedImage = null;
    }
}

function startRotation() {
    if (rotationIntervalId) clearInterval(rotationIntervalId);
    if (imageGalleryState.userPreferences.autoRotate && imageGalleryState.isPlaying) {
        rotationIntervalId = setInterval(() => {
            if (document.visibilityState === 'visible' && !imageGalleryState.transitionInProgress) {
                crossfadeToNextImage();
            }
        }, imageGalleryState.userPreferences.rotationInterval);
        console.log("Image rotation started.");
    }
}

function stopRotation() {
    clearInterval(rotationIntervalId);
    rotationIntervalId = null;
    console.log("Image rotation stopped.");
}

function rotateToNextImage(forceSkip = false) {
    if (!imageGalleryState.transitionInProgress || forceSkip) {
        crossfadeToNextImage();
    }
}

function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        if (imageGalleryState.isPlaying && imageGalleryState.userPreferences.autoRotate) {
            imageGalleryState.wasPlayingBeforeHidden = true;
            stopRotation();
        }
    } else if (document.visibilityState === 'visible') {
        if (imageGalleryState.wasPlayingBeforeHidden) {
            startRotation();
            preloadNextImage();
        }
        imageGalleryState.wasPlayingBeforeHidden = false;
    }
}

document.addEventListener('DOMContentLoaded', initializeGallery);

function handleToggleRotation() {
    if (imageGalleryState.isPlaying) {
        stopRotation();
        imageGalleryState.isPlaying = false;
        if (toggleRotationBtn) {
            toggleRotationBtn.textContent = 'Resume';
            toggleRotationBtn.setAttribute('aria-label', 'Resume image rotation');
        }
    } else {
        imageGalleryState.isPlaying = true;
        crossfadeToNextImage().then(() => {
            if (imageGalleryState.isPlaying) startRotation();
        });
        if (toggleRotationBtn) {
            toggleRotationBtn.textContent = 'Pause';
            toggleRotationBtn.setAttribute('aria-label', 'Pause image rotation');
        }
    }
    saveUserPreferences();
}

function handleNextImage() {
    if (imageGalleryState.transitionInProgress) return;
    stopRotation();
    crossfadeToNextImage().then(() => {
        if (imageGalleryState.isPlaying) {
            startRotation();
        }
    });
}

function handlePreviousImage() {
    if (imageGalleryState.transitionInProgress) return;
    if (imageGalleryState.imageHistory.length < 2) {
        console.log("No previous image in history.");
        return;
    }
    stopRotation();
    const previousImageObject = imageGalleryState.imageHistory[imageGalleryState.imageHistory.length - 2];
    const currentImg = imageGalleryState.imageHistory.pop();
    imageGalleryState.transitionInProgress = true;
    const newVisibleContainer = (currentVisibleContainer === bgImageContainer1) ? bgImageContainer2 : bgImageContainer1;
    const oldVisibleContainer = currentVisibleContainer;
    loadImage(previousImageObject, newVisibleContainer, false).then(loadedImage => {
        if (loadedImage) {
            newVisibleContainer.classList.add('visible');
            oldVisibleContainer.classList.remove('visible');
            currentVisibleContainer = newVisibleContainer;
            imageGalleryState.currentImageIndex = galleryImages.indexOf(previousImageObject);
            if (currentImg) imageGalleryState.imageHistory.push(currentImg);
            imageGalleryState.imageHistory.pop();
            preloadNextImage();
        } else {
            if (currentImg) imageGalleryState.imageHistory.push(currentImg);
        }
        imageGalleryState.transitionInProgress = false;
        if (imageGalleryState.isPlaying) {
            startRotation();
        }
    });
}

function handleCategoryChange(event) {
    imageGalleryState.selectedCategory = event.target.value;
    saveUserPreferences();
    imageGalleryState.imageHistory = [];
    imageGalleryState.currentImageIndex = -1;
    console.log(`Category changed to: ${imageGalleryState.selectedCategory}`);
    stopRotation();
    crossfadeToNextImage().then(() => {
        if (imageGalleryState.isPlaying) {
            startRotation();
        }
    });
}

function handleControlsVisibility() {
    if (galleryControlsElement.classList.contains('hidden')) {
        galleryControlsElement.classList.remove('hidden');
    }
    resetControlsHideTimer();
}

function setSeasonalCategoryFilter(season) {
    console.log(`Setting seasonal category filter for season: ${season}`);
    const validSeasons = ['spring', 'summer', 'autumn', 'winter'];
    if (validSeasons.includes(season.toLowerCase())) {
        imageGalleryState.selectedCategory = 'seasons';
        console.log(`Gallery category set to 'seasons' for ${season}.`);
        if (categoryFilterElement) {
            populateCategoryFilter();
        } else {
            console.warn("categoryFilterElement not found, cannot update UI for seasonal filter.");
        }
        saveUserPreferences();
        imageGalleryState.imageHistory = [];
        imageGalleryState.currentImageIndex = -1;
        stopRotation();
        crossfadeToNextImage().then(() => {
            if (imageGalleryState.isPlaying && imageGalleryState.userPreferences.autoRotate) {
                startRotation();
            }
        });
    } else {
        console.warn(`Invalid season provided to setSeasonalCategoryFilter: ${season}`);
    }
}

// --- Lightbox Functions ---
function getFilteredImages() {
    if (imageGalleryState.selectedCategory === 'all') {
        return [...galleryImages];
    }
    return galleryImages.filter(img => img.category === imageGalleryState.selectedCategory);
}

function openLightbox(imageObject) {
    if (!imageObject || !imageObject.path || !lightboxOverlayElement) {
        console.log('openLightbox aborted:', { imageObject, hasPath: imageObject?.path, hasOverlay: !!lightboxOverlayElement });
        return;
    }

    document.removeEventListener('keydown', handleLightboxEscape); // Remove existing, if any

    lightboxImageElement.src = imageObject.path;
    lightboxImageElement.alt = imageObject.title || 'Enlarged image';

    if (lightboxInfoElement) {
        lightboxInfoElement.innerHTML = `<p><strong>${imageObject.title}</strong><br>${imageObject.location}</p>`;
    }

    const filteredImages = getFilteredImages();
    currentLightboxImageIndexInFilteredList = filteredImages.findIndex(img => img.id === imageObject.id);

    if (!document.body.classList.contains('lightbox-active-body')) {
        if (imageGalleryState.isPlaying) {
            imageGalleryState.wasPlayingBeforeLightbox = true;
            stopRotation();
            imageGalleryState.isPlaying = false;
        } else {
            imageGalleryState.wasPlayingBeforeLightbox = false;
        }
        document.body.classList.add('lightbox-active-body');
    }

    lightboxOverlayElement.classList.remove('lightbox-hidden');
    lightboxOverlayElement.classList.add('lightbox-visible');
    document.addEventListener('keydown', handleLightboxEscape);

    if (lightboxPrevBtnElement && lightboxNextBtnElement) {
        if (filteredImages.length > 1) {
            lightboxPrevBtnElement.style.display = 'block';
            lightboxNextBtnElement.style.display = 'block';
        } else {
            lightboxPrevBtnElement.style.display = 'none';
            lightboxNextBtnElement.style.display = 'none';
        }
    }
}

function closeLightbox() {
    if (!lightboxOverlayElement) return;

    lightboxOverlayElement.classList.add('lightbox-hidden');
    lightboxOverlayElement.classList.remove('lightbox-visible');
    document.body.classList.remove('lightbox-active-body');
    currentLightboxImageIndexInFilteredList = -1;

    document.removeEventListener('keydown', handleLightboxEscape);

    if (imageGalleryState.wasPlayingBeforeLightbox) {
        imageGalleryState.isPlaying = true;
        if (toggleRotationBtn) {
             toggleRotationBtn.textContent = 'Pause';
             toggleRotationBtn.setAttribute('aria-label', 'Pause image rotation');
        }
        startRotation();
    }
    imageGalleryState.wasPlayingBeforeLightbox = false;
}

function handleLightboxEscape(event) {
    if (event.key === 'Escape') {
        closeLightbox();
    }
}

function showNextImageInLightbox() {
    const filteredImages = getFilteredImages();
    if (filteredImages.length === 0 || currentLightboxImageIndexInFilteredList === -1) return;

    currentLightboxImageIndexInFilteredList = (currentLightboxImageIndexInFilteredList + 1) % filteredImages.length;
    const nextImageObject = filteredImages[currentLightboxImageIndexInFilteredList];

    if (nextImageObject && nextImageObject.path && lightboxImageElement) {
         lightboxImageElement.src = nextImageObject.path;
         lightboxImageElement.alt = nextImageObject.title || 'Enlarged image';
         if (lightboxInfoElement) {
             lightboxInfoElement.innerHTML = `<p><strong>${nextImageObject.title}</strong><br>${nextImageObject.location}</p>`;
         }
     } else {
         console.error("Could not display next lightbox image.");
     }
}

function showPreviousImageInLightbox() {
    const filteredImages = getFilteredImages();
    if (filteredImages.length === 0 || currentLightboxImageIndexInFilteredList === -1) return;

    currentLightboxImageIndexInFilteredList = (currentLightboxImageIndexInFilteredList - 1 + filteredImages.length) % filteredImages.length;
    const prevImageObject = filteredImages[currentLightboxImageIndexInFilteredList];

    if (prevImageObject && prevImageObject.path && lightboxImageElement) {
         lightboxImageElement.src = prevImageObject.path;
         lightboxImageElement.alt = prevImageObject.title || 'Enlarged image';
         if (lightboxInfoElement) {
             lightboxInfoElement.innerHTML = `<p><strong>${prevImageObject.title}</strong><br>${prevImageObject.location}</p>`;
         }
     } else {
         console.error("Could not display previous lightbox image.");
     }
}

// --- User Preferences ---
function saveUserPreferences() {
    try {
        localStorage.setItem('sereneDashboard_selectedCategory', imageGalleryState.selectedCategory);
        localStorage.setItem('sereneDashboard_rotationState', imageGalleryState.isPlaying ? 'resumed' : 'paused');
    } catch (error) {
        console.error("Error saving user preferences to localStorage:", error);
    }
}

function loadUserPreferences() {
    try {
        const savedCategory = localStorage.getItem('sereneDashboard_selectedCategory');
        if (savedCategory) {
            imageGalleryState.selectedCategory = savedCategory;
            if (categoryFilterElement) categoryFilterElement.value = savedCategory;
        }
        const savedRotationState = localStorage.getItem('sereneDashboard_rotationState');
        if (savedRotationState) {
            if (typeof savedRotationState === 'string') {
                 imageGalleryState.isPlaying = savedRotationState === 'resumed';
            } else {
                imageGalleryState.isPlaying = true;
            }
            if (toggleRotationBtn) {
                toggleRotationBtn.textContent = imageGalleryState.isPlaying ? 'Pause' : 'Resume';
                toggleRotationBtn.setAttribute('aria-label', imageGalleryState.isPlaying ? 'Pause image rotation' : 'Resume image rotation');
            }
        }
    } catch (error) {
        console.error("Error loading user preferences from localStorage:", error);
    }
}

function resetControlsHideTimer() {
    if (controlsHideTimeout) clearTimeout(controlsHideTimeout);
    if (galleryControlsElement) {
        controlsHideTimeout = setTimeout(() => {
            galleryControlsElement.classList.add('hidden');
        }, 3000);
    }
}

// Conditional export for Node.js/Jest environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    imageGalleryState,
    galleryImages,
    initializeGallery,
    loadImage,
    handleNextImage,
    handlePreviousImage,
    handleToggleRotation,
    handleCategoryChange,
    getNextImageObject,
    crossfadeToNextImage,
    startRotation,
    stopRotation,
    saveUserPreferences,
    loadUserPreferences,
    setSeasonalCategoryFilter,
    populateCategoryFilter,
    loadInitialImage,
    resetControlsHideTimer,
    handleVisibilityChange,
    handleControlsVisibility,
    preloadNextImage,
    handleImageLoadError,
    // Lightbox functions
    openLightbox,
    closeLightbox,
    handleLightboxEscape,
    getFilteredImages,
    showNextImageInLightbox,
    showPreviousImageInLightbox
  };
}
