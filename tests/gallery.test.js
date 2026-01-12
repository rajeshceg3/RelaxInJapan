
// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: () => {
      store = {};
    },
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    hasOwnProperty: jest.fn((key) => key in store)
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Image.decode
let imageOnloadCallback = null;
global.Image = class {
  constructor() {
    this.src = '';
    Object.defineProperty(this, 'onload', {
        set: (callback) => {
            imageOnloadCallback = callback;
            Promise.resolve().then(callback);
        },
        get: () => imageOnloadCallback
    });
  }
  decode = jest.fn().mockResolvedValue(undefined);
};

describe('Gallery Logic', () => {
  let gallery;
  let mockBgGallery, mockCategoryFilter, mockToggleRotationBtn, mockNextBtn, mockPrevBtn, mockImageInfoOverlay, mockControls;

  beforeEach(() => {
    jest.resetModules(); // IMPORTANT: Reset modules to get fresh state for gallery.js

    document.body.innerHTML = `
      <div id="background-gallery"></div>
      <select id="category-filter"></select>
      <button id="toggle-rotation"></button>
      <button id="next-image"></button>
      <button id="prev-image"></button>
      <div id="image-info-overlay"></div>
      <div id="gallery-controls"></div>
      <!-- Lightbox Structure (always present in HTML for simplicity in tests) -->
      <div id="lightbox-overlay" class="lightbox-hidden">
          <div id="lightbox-container">
              <img id="lightbox-image" src="" alt="Lightbox Image">
              <button id="lightbox-close-btn">&times;</button>
              <div id="lightbox-info"></div>
              <button id="lightbox-prev-btn" class="lightbox-nav-btn">&lt;</button>
              <button id="lightbox-next-btn" class="lightbox-nav-btn">&gt;</button>
          </div>
      </div>
    `;

    mockBgGallery = document.getElementById('background-gallery');
    mockCategoryFilter = document.getElementById('category-filter');
    mockToggleRotationBtn = document.getElementById('toggle-rotation');
    mockNextBtn = document.getElementById('next-image');
    mockPrevBtn = document.getElementById('prev-image');
    mockImageInfoOverlay = document.getElementById('image-info-overlay');
    mockControls = document.getElementById('gallery-controls');

    localStorageMock.clear();

    // Now require gallery.js
    gallery = require('../js/gallery.js');

    // Reset state directly if exposed, or rely on fresh module state (which is clean initially)
    // gallery.imageGalleryState should be fresh.

    // Spy on console
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    jest.useFakeTimers();
    jest.spyOn(global, 'setInterval');
    jest.spyOn(global, 'clearInterval');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('initializeGallery', () => {
    test('DOM Element Caching and Creation', () => {
      // initializeGallery is called on DOMContentLoaded in require if document exists.
      // But we might want to call it manually to verify logic if it wasn't triggered or to re-trigger.
      // Since we resetModules, require run the top level code.
      // We need to trigger DOMContentLoaded or call initializeGallery manually.
      // Since it's attached to event, we can dispatch it.
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const actualBgGalleryElement = document.getElementById('background-gallery');
      expect(actualBgGalleryElement.children.length).toBe(2);
      expect(actualBgGalleryElement.children[0].className).toBe('bg-image-container');
    });
  });

  describe('Lightbox Functionality', () => {
    beforeEach(() => {
        // Ensure initialized
        document.dispatchEvent(new Event('DOMContentLoaded'));
        gallery.imageGalleryState.isPlaying = true; // Assume playing
    });

    test('should open lightbox', () => {
      const img = gallery.galleryImages[0];
      gallery.openLightbox(img);

      const overlay = document.getElementById('lightbox-overlay');
      expect(overlay.classList.contains('lightbox-visible')).toBe(true);
      expect(gallery.imageGalleryState.isPlaying).toBe(false);
    });

    test('should close lightbox', () => {
      const img = gallery.galleryImages[0];
      gallery.openLightbox(img);
      gallery.closeLightbox();

      const overlay = document.getElementById('lightbox-overlay');
      expect(overlay.classList.contains('lightbox-visible')).toBe(false);
      expect(gallery.imageGalleryState.isPlaying).toBe(true);
    });
  });

  // Minimal set of other tests to verify core logic
  describe('Rotation Logic', () => {
       beforeEach(() => {
           document.dispatchEvent(new Event('DOMContentLoaded'));
           // Mock loadImage to avoid actual image loading logic delays or errors
            jest.spyOn(gallery, 'loadImage').mockImplementation(async (imgObj, container) => {
                if (container) container.classList.add('visible');
                return new global.Image();
            });
            // Mock getNextImageObject to return predictable images
            jest.spyOn(gallery, 'getNextImageObject').mockImplementation(() => gallery.galleryImages[0]);
       });

       test('startRotation sets interval', () => {
           gallery.startRotation();
           expect(setInterval).toHaveBeenCalled();
       });

       test('stopRotation clears interval', () => {
           gallery.startRotation();
           gallery.stopRotation();
           expect(clearInterval).toHaveBeenCalled();
       });
  });

});
