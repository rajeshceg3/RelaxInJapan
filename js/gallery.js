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
  }
};

const galleryImages = [
  // Seasons (6 images)
  { id: 's01', title: 'Sakura Bloom', location: 'Kyoto', photographer: 'Photographer A', category: 'seasons', path: 'images/seasons/season_01.txt' },
  { id: 's02', title: 'Autumn Leaves', location: 'Nikko', photographer: 'Photographer B', category: 'seasons', path: 'images/seasons/season_02.txt' },
  { id: 's03', title: 'Winter Snowscape', location: 'Hokkaido', photographer: 'Photographer C', category: 'seasons', path: 'images/seasons/season_03.txt' },
  { id: 's04', title: 'Summer Festival', location: 'Tokyo', photographer: 'Photographer D', category: 'seasons', path: 'images/seasons/season_04.txt' },
  { id: 's05', title: 'Early Spring Greens', location: 'Kamakura', photographer: 'Photographer E', category: 'seasons', path: 'images/seasons/season_05.txt' },
  { id: 's06', title: 'Late Autumn Sunset', location: 'Hakone', photographer: 'Photographer F', category: 'seasons', path: 'images/seasons/season_06.txt' },

  // Architecture (6 images)
  { id: 'a01', title: 'Kinkaku-ji Temple', location: 'Kyoto', photographer: 'Photographer G', category: 'architecture', path: 'images/architecture/architecture_01.txt' },
  { id: 'a02', title: 'Modern Shrine Design', location: 'Osaka', photographer: 'Photographer H', category: 'architecture', path: 'images/architecture/architecture_02.txt' },
  { id: 'a03', title: 'Traditional Garden Bridge', location: 'Kanazawa', photographer: 'Photographer I', category: 'architecture', path: 'images/architecture/architecture_03.txt' },
  { id: 'a04', title: 'Tokyo Skytree', location: 'Tokyo', photographer: 'Photographer J', category: 'architecture', path: 'images/architecture/architecture_04.txt' },
  { id: 'a05', title: 'Himeji Castle', location: 'Himeji', photographer: 'Photographer K', category: 'architecture', path: 'images/architecture/architecture_05.txt' },
  { id: 'a06', title: 'Rural Farmhouse', location: 'Shirakawa-go', photographer: 'Photographer L', category: 'architecture', path: 'images/architecture/architecture_06.txt' },

  // Nature (6 images)
  { id: 'n01', title: 'Mount Fuji View', location: 'Yamanashi', photographer: 'Photographer M', category: 'nature', path: 'images/nature/nature_01.txt' },
  { id: 'n02', title: 'Bamboo Forest', location: 'Arashiyama', photographer: 'Photographer N', category: 'nature', path: 'images/nature/nature_02.txt' },
  { id: 'n03', title: 'Okinawa Coastline', location: 'Okinawa', photographer: 'Photographer O', category: 'nature', path: 'images/nature/nature_03.txt' },
  { id: 'n04', title: 'Aokigahara Forest', location: 'Fuji-Hakone-Izu National Park', photographer: 'Photographer P', category: 'nature', path: 'images/nature/nature_04.txt' },
  { id: 'n05', title: 'Nachi Falls', location: 'Wakayama', photographer: 'Photographer Q', category: 'nature', path: 'images/nature/nature_05.txt' },
  { id: 'n06', title: 'Shiretoko Peninsula', location: 'Hokkaido', photographer: 'Photographer R', category: 'nature', path: 'images/nature/nature_06.txt' },

  // Culture (6 images)
  { id: 'c01', title: 'Tea Ceremony Still Life', location: 'Uji', photographer: 'Photographer S', category: 'culture', path: 'images/culture/culture_01.txt' },
  { id: 'c02', title: 'Zen Garden Raked Sand', location: 'Kyoto', photographer: 'Photographer T', category: 'culture', path: 'images/culture/culture_02.txt' },
  { id: 'c03', title: 'Traditional Pottery Kiln', location: 'Mashiko', photographer: 'Photographer U', category: 'culture', path: 'images/culture/culture_03.txt' },
  { id: 'c04', title: 'Calligraphy Tools', location: 'Nara', photographer: 'Photographer V', category: 'culture', path: 'images/culture/culture_04.txt' },
  { id: 'c05', title: 'Ikebana Flower Arrangement', location: 'Tokyo', photographer: 'Photographer W', category: 'culture', path: 'images/culture/culture_05.txt' },
  { id: 'c06', title: 'Taiko Drummers', location: 'Sado Island', photographer: 'Photographer X', category: 'culture', path: 'images/culture/culture_06.txt' }
];

// Export if using modules later, for now they are global or encapsulated in IIFE
// export { imageGalleryState, galleryImages };

// DOM Elements (cache them once)
let backgroundGalleryElement;
let bgImageContainer1, bgImageContainer2; // The two divs for cross-fading
let categoryFilterElement;
let toggleRotationBtn, nextImageBtn, prevImageBtn, imageInfoOverlayElement, galleryControlsElement;
let controlsHideTimeout = null; // For auto-hide

// To keep track of which container is currently visible
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

    imageInfoOverlayElement.setAttribute('aria-live', 'polite');

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log("Reduced motion is preferred. CSS handles transition disabling.");
        // Optionally, JS could alter animation behavior here too.
        // For example, set imageGalleryState.userPreferences.transitionDuration = 10;
    }

    // Create the two image containers for cross-fading
    bgImageContainer1 = document.createElement('div');
    bgImageContainer1.className = 'bg-image-container';
    bgImageContainer2 = document.createElement('div');
    bgImageContainer2.className = 'bg-image-container';
    backgroundGalleryElement.appendChild(bgImageContainer1);
    backgroundGalleryElement.appendChild(bgImageContainer2);

    currentVisibleContainer = bgImageContainer1; // Start with container 1

    populateCategoryFilter();
    loadInitialImage();

    if (imageGalleryState.userPreferences.autoRotate && imageGalleryState.isPlaying) {
        startRotation();
    }

    // Add event listener for visibility change (e.g., tab hidden)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // --- Event Listeners ---
    toggleRotationBtn.addEventListener('click', handleToggleRotation);
    nextImageBtn.addEventListener('click', handleNextImage);
    prevImageBtn.addEventListener('click', handlePreviousImage);
    categoryFilterElement.addEventListener('change', handleCategoryChange);

    document.addEventListener('mousemove', handleControlsVisibility);
    // Initial call to start the hide timer for controls
    resetControlsHideTimer();
    } catch (error) {
        console.error("Error during gallery initialization:", error);
        // Hide gallery controls and info if initialization fails
        if (galleryControlsElement) galleryControlsElement.classList.add('hidden');
        if (imageInfoOverlayElement) imageInfoOverlayElement.classList.remove('visible');
        // Potentially display a user-facing error message in the UI
    }
}

function populateCategoryFilter() {
    const categories = ['all', ...new Set(galleryImages.map(img => img.category))];
    categoryFilterElement.innerHTML = ''; // Clear existing options if any

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
        // Display fallback (CSS should handle solid color)
    }
}

// --- Image Loading and Display ---
async function loadImage(imageObject, containerElement, isPreload) {
    if (!imageObject || !imageObject.path) {
        console.error("Invalid image object or path:", imageObject);
        if (!isPreload && containerElement) handleImageLoadError(containerElement); // Pass container
        else if (!isPreload) handleImageLoadError(null); // Still call if no container (e.g. initial load issue)
        return null; // Important to return null
    }

    imageGalleryState.transitionInProgress = !isPreload;

    // For actual images, preloading would be more complex:
    // const img = new Image();
    // img.src = imageObject.path;
    // try {
    //    await img.decode(); // Ensures image is downloaded and decoded
    //    if (!isPreload) {
    //        containerElement.style.backgroundImage = `url('${imageObject.path}')`;
    //        // Update image info overlay (Step 5)
    //    }
    //    imageGalleryState.transitionInProgress = false;
    //    return img; // Return the loaded image element
    // } catch (error) {
    //    console.error("Error loading image:", imageObject.path, error);
    //    if (!isPreload) handleImageLoadError(containerElement);
    //    imageGalleryState.transitionInProgress = false;
    //    return null;
    // }

    // SIMPLIFIED for placeholder .txt files:
    if (!isPreload) {
        // In a real scenario, this would be `url('path/to/image.webp')`
        // For placeholders, we just acknowledge it.
        console.log(`Displaying: ${imageObject.title} from ${imageObject.path}`);
        containerElement.style.backgroundImage = 'none'; // Clear previous
        // To simulate content, you could put text, but for background, it's about the URL
        // For now, we'll just use a distinct background color per container to see the fade.
        // This will be replaced by actual image URLs.
        if (containerElement === bgImageContainer1) {
             containerElement.style.backgroundColor = 'rgba(100, 100, 255, 0.5)'; // Blueish
        } else {
             containerElement.style.backgroundColor = 'rgba(100, 255, 100, 0.5)'; // Greenish
        }
        // Update image info overlay
        if (imageObject && imageObject.title && imageObject.location) {
            imageInfoOverlayElement.innerHTML = `<p><strong>${imageObject.title}</strong><br>${imageObject.location}</p>`;
            imageInfoOverlayElement.classList.add('visible');
        } else {
            imageInfoOverlayElement.classList.remove('visible');
        }
    } else {
        console.log(`Preloading: ${imageObject.title} from ${imageObject.path}`);
    }
    // Simulate load time for preloader
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network
    imageGalleryState.transitionInProgress = false;
    return { path: imageObject.path }; // Return a mock image object
}


function handleImageLoadError(containerElement) {
    console.warn("Failed to load image. Displaying fallback and attempting to skip.");
    if (containerElement) { // Check if containerElement is provided
        containerElement.style.backgroundImage = 'none'; // Clear broken image
        // Ensure the container itself doesn't obscure the body's fallback color
        containerElement.style.backgroundColor = 'transparent';
    }
    imageInfoOverlayElement.classList.remove('visible'); // Hide info for broken image

    // If rotation is on, try to advance to the next image after a short delay
    // to avoid rapid error loops.
    if (imageGalleryState.isPlaying && imageGalleryState.userPreferences.autoRotate) {
        console.log("Attempting to load next image after error...");
        stopRotation(); // Stop current rotation to prevent immediate re-trigger on same error
        setTimeout(() => {
            crossfadeToNextImage().then(() => {
                if (imageGalleryState.isPlaying) startRotation(); // Restart if still supposed to be playing
            });
        }, 1000); // Wait 1 second before trying next
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

    // Load the new image into the container that's currently hidden
    const loadedImage = await loadImage(nextImageObject, newVisibleContainer, false);

    if (loadedImage) {
        newVisibleContainer.classList.add('visible');
        oldVisibleContainer.classList.remove('visible');
        currentVisibleContainer = newVisibleContainer;
        imageGalleryState.currentImageIndex = galleryImages.indexOf(nextImageObject);
        updateImageHistory(nextImageObject);
        preloadNextImage(); // Preload for the *next* transition
    } else {
        // Image failed to load, don't change visibility, error already handled by loadImage
        console.error("Crossfade aborted due to image load failure.");
    }
    imageGalleryState.transitionInProgress = false;
}

// --- Image Selection Logic ---
function getNextImageObject() {
    const availableImages = galleryImages.filter(img => {
        const categoryMatch = imageGalleryState.selectedCategory === 'all' || img.category === imageGalleryState.selectedCategory;
        if (!categoryMatch) return false;
        // AC2: No duplicate images within a 12-image cycle
        // Check if the image ID is in the recent history (excluding the oldest if history is full)
        return !imageGalleryState.imageHistory.slice(-(12 -1)).some(historicImg => historicImg.id === img.id);
    });

    if (availableImages.length === 0) {
        // If all images in the current filter have been shown recently,
        // reset history for this filter to allow repeats, or show a message.
        // For now, let's try to pick any from the category if strict non-repeat fails.
        const fallbackImages = galleryImages.filter(img =>
            imageGalleryState.selectedCategory === 'all' || img.category === imageGalleryState.selectedCategory
        );
        if (fallbackImages.length === 0) return null; // No images in this category at all
        return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    }

    return availableImages[Math.floor(Math.random() * availableImages.length)];
}

function updateImageHistory(imageObject) {
    imageGalleryState.imageHistory.push(imageObject);
    if (imageGalleryState.imageHistory.length > 12) { // Keep history size limited
        imageGalleryState.imageHistory.shift(); // Remove the oldest
    }
}

let preloadedImage = null; // Store the preloaded Image object or its data

async function preloadNextImage() {
    // Determine what the *next* image would be without advancing state yet
    // This is tricky because getNextImageObject() is random.
    // For a simpler preload, let's just pick *a* potential next image.
    // A more robust preloader might look at the current index and try to load index+1,
    // or maintain a specific queue. Given random selection, "next" is less deterministic.

    // For now, just get *a* valid next image and "preload" it.
    const potentialNext = getNextImageObject();
    if (potentialNext && potentialNext.id !== (galleryImages[imageGalleryState.currentImageIndex] && galleryImages[imageGalleryState.currentImageIndex].id)) {
        preloadedImage = await loadImage(potentialNext, null, true); // Pass null container for preload
    } else {
        preloadedImage = null;
    }
}


// --- Rotation Control ---
function startRotation() {
    if (rotationIntervalId) clearInterval(rotationIntervalId); // Clear existing interval
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

function rotateToNextImage(forceSkip = false) { // forceSkip can be used by error handlers
    if (!imageGalleryState.transitionInProgress || forceSkip) {
        crossfadeToNextImage();
    }
}

// --- Utility ---
function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        // Option: Could pause rotation or stop preloading
        // stopRotation(); // Example: Pause when tab is not active
    } else {
        // Option: Resume rotation if it was paused
        // if (imageGalleryState.isPlaying && imageGalleryState.userPreferences.autoRotate) {
        //    startRotation();
        // }
        // Ensure current image is still valid or refresh
        // preloadNextImage(); // Refresh preload when tab becomes visible
    }
}

// --- Global Invocation ---
// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeGallery);


function handleToggleRotation() {
    if (imageGalleryState.isPlaying) {
        stopRotation();
        imageGalleryState.isPlaying = false;
        toggleRotationBtn.textContent = 'Resume';
        toggleRotationBtn.setAttribute('aria-label', 'Resume image rotation');
    } else {
        imageGalleryState.isPlaying = true;
        crossfadeToNextImage().then(() => {
             if(imageGalleryState.isPlaying) startRotation();
        });
        toggleRotationBtn.textContent = 'Pause';
        toggleRotationBtn.setAttribute('aria-label', 'Pause image rotation');
    }
}

function handleNextImage() {
    if (imageGalleryState.transitionInProgress) return;
    stopRotation(); // Stop current interval
    crossfadeToNextImage().then(() => {
        if (imageGalleryState.isPlaying) { // If it was playing, resume with new interval
            startRotation();
        }
    });
}

function handlePreviousImage() {
    if (imageGalleryState.transitionInProgress) return;
    if (imageGalleryState.imageHistory.length < 2) {
        console.log("No previous image in history.");
        return; // Not enough history to go back
    }

    stopRotation(); // Stop current interval

    // The current image is the last in history. The previous is second to last.
    const previousImageObject = imageGalleryState.imageHistory[imageGalleryState.imageHistory.length - 2];

    // Effectively "undo" the last image addition to history for this display
    // We don't want to add the "previous" image again as if it's a "next" one.
    // So, temporarily pop the current one, so getNextImageObject doesn't see it as "just shown"
    // This is a bit hacky; a dedicated "showSpecificImage" function would be cleaner.
    const currentImg = imageGalleryState.imageHistory.pop();


    // Logic to display a specific image (simplified from crossfadeToNextImage)
    imageGalleryState.transitionInProgress = true;
    const newVisibleContainer = (currentVisibleContainer === bgImageContainer1) ? bgImageContainer2 : bgImageContainer1;
    const oldVisibleContainer = currentVisibleContainer;

    loadImage(previousImageObject, newVisibleContainer, false).then(loadedImage => {
        if (loadedImage) {
            newVisibleContainer.classList.add('visible');
            oldVisibleContainer.classList.remove('visible');
            currentVisibleContainer = newVisibleContainer;
            imageGalleryState.currentImageIndex = galleryImages.indexOf(previousImageObject);
            // History is now implicitly correct as the "previous" is the last one.
            // No need to call updateImageHistory explicitly here as we are navigating, not adding a "new" random one.
            // However, the `previousImageObject` is now the current. If user hits prev again, it should go further back.
            // The `updateImageHistory` called by crossfade normally adds. Here we are *setting*.
            // For true "previous" functionality, the history management might need to be more stack-like.
            // For now, this makes the previous image the current one. The history will be rebuilt from here.
            // To make "previous" more robust, we might need to adjust how `updateImageHistory` works or
            // explicitly manage the history pointer.
            // Simple approach: current image is already popped. When `crossfadeToNextImage` is called next,
            // the `previousImageObject` will be the one in `imageGalleryState.currentImageIndex`.
            // Let's re-add the popped current image so the history remains consistent until a *new* next.
            if(currentImg) imageGalleryState.imageHistory.push(currentImg);
            // And then remove the one we just navigated to from the "end" to make it current
            imageGalleryState.imageHistory.pop();


            preloadNextImage();
        } else {
             if(currentImg) imageGalleryState.imageHistory.push(currentImg); // Restore if load failed
        }
        imageGalleryState.transitionInProgress = false;
        if (imageGalleryState.isPlaying) { // If it was playing, resume with new interval
            startRotation();
        }
    });
}

function handleCategoryChange(event) {
    imageGalleryState.selectedCategory = event.target.value;
    imageGalleryState.imageHistory = []; // Reset history for new category (AC4)
    imageGalleryState.currentImageIndex = -1; // Reset index

    console.log(`Category changed to: ${imageGalleryState.selectedCategory}`);
    stopRotation(); // Stop current interval
    crossfadeToNextImage().then(() => {
        if (imageGalleryState.isPlaying) {
            startRotation(); // Restart rotation with new category
        }
    });
}

function handleControlsVisibility() {
    if (galleryControlsElement.classList.contains('hidden')) {
        galleryControlsElement.classList.remove('hidden');
    }
    resetControlsHideTimer();
}

function resetControlsHideTimer() {
    if (controlsHideTimeout) clearTimeout(controlsHideTimeout);
    controlsHideTimeout = setTimeout(() => {
        galleryControlsElement.classList.add('hidden');
    }, 3000); // AC4: Hide after 3 seconds
}
