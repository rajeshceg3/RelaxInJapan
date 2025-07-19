const imageGalleryState = {
  currentImageIndex: -1,
  isPlaying: true,
  imageHistory: [],
  transitionInProgress: false,
  userPreferences: {
    autoRotate: true,
    transitionDuration: 2000, // ms
    rotationInterval: 300000, // 5 minutes in ms
  },
  wasPlayingBeforeHidden: false,
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

let currentVisibleContainer;
let rotationIntervalId = null;

// --- Initialization ---
function initializeGallery() {
    try {
        backgroundGalleryElement = document.getElementById('background-gallery');

        if (!backgroundGalleryElement) {
            console.error("background-gallery element is missing. Initialization aborted.");
            return;
        }

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

        loadInitialImage();

        if (imageGalleryState.userPreferences.autoRotate && imageGalleryState.isPlaying) {
            startRotation();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
    } catch (error) {
        console.error("Error during gallery initialization:", error);
    }
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
        return !imageGalleryState.imageHistory.slice(-(12 - 1)).some(historicImg => historicImg.id === img.id);
    });
    if (availableImages.length === 0) {
        const fallbackImages = galleryImages;
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
