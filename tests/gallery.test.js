const {
    imageGalleryState,
    galleryImages,
    initializeGallery,
    loadImage,
    crossfadeToNextImage,
    startRotation,
    stopRotation,
    getNextImageObject,
    handleVisibilityChange,
} = require('../js/gallery.js');

describe('Image Gallery Logic', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="background-gallery"></div>
        `;
        // Reset state
        imageGalleryState.currentImageIndex = -1;
        imageGalleryState.isPlaying = true;
        imageGalleryState.imageHistory = [];
        imageGalleryState.transitionInProgress = false;
        imageGalleryState.wasPlayingBeforeHidden = false;
        stopRotation(); // Clear any existing intervals
    });

    test('initializeGallery should setup the gallery', () => {
        initializeGallery();
        expect(document.getElementById('background-gallery').children.length).toBe(2);
    });

    test('getNextImageObject should return a valid image object', () => {
        const imageObject = getNextImageObject();
        expect(imageObject).toHaveProperty('id');
        expect(imageObject).toHaveProperty('path');
    });

    test('loadImage should load an image into a container', async () => {
        const container = document.createElement('div');
        const imageObject = galleryImages[0];
        const loadedImage = await loadImage(imageObject, container, false);
        expect(container.style.backgroundImage).toBe(`url("${imageObject.path}")`);
        expect(loadedImage).not.toBeNull();
    });

    test('crossfadeToNextImage should change the visible container and image', async () => {
        initializeGallery();
        const initialImageIndex = imageGalleryState.currentImageIndex;
        await crossfadeToNextImage();
        expect(imageGalleryState.currentImageIndex).not.toBe(initialImageIndex);
    });

    test('startRotation and stopRotation should control the rotation interval', () => {
        jest.useFakeTimers();
        initializeGallery();
        startRotation();
        expect(setInterval).toHaveBeenCalledTimes(2);
        expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), imageGalleryState.userPreferences.rotationInterval);
        stopRotation();
        expect(clearInterval).toHaveBeenCalledTimes(2);
    });

    test('handleVisibilityChange should pause and resume rotation', () => {
        initializeGallery();
        startRotation();
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
        handleVisibilityChange();
        expect(imageGalleryState.wasPlayingBeforeHidden).toBe(true);
        Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
        handleVisibilityChange();
        expect(imageGalleryState.wasPlayingBeforeHidden).toBe(false);
    });
});
