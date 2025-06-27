# Serene Dashboard - Image Gallery

## Project Description

The Serene Dashboard is a web application that displays a rotating gallery of images, creating a calm and visually appealing background experience. Users can pause the rotation, navigate between images, and filter images by category. The project is built with HTML, CSS, and JavaScript.

## Features

*   **Dynamic Background Image Gallery:** Displays images that transition smoothly.
*   **Image Rotation:** Images automatically rotate at a set interval.
*   **Manual Navigation:** Users can pause rotation and navigate to the next or previous image.
*   **Category Filtering:** Images can be filtered by categories (e.g., Nature, Architecture, Seasons, Culture).
*   **Image Information Overlay:** Displays the title and location of the current image.
*   **Responsive Controls:** Gallery controls (pause, next, previous, category filter) are available and auto-hide when not in use.
*   **Reduced Motion Accessibility:** Respects user preference for reduced motion.

## How to Use

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Navigate to the Project Directory:**
    ```bash
    cd <project-directory>
    ```
3.  **Open `index.html`:**
    Open the `index.html` file in your web browser to view and interact with the image gallery.

### Using the Gallery Features

*   **Image Rotation:**
    *   Images will start rotating automatically.
    *   Click the "Pause" button to stop the automatic rotation. Click "Resume" to start it again.
*   **Manual Navigation:**
    *   Click "Next" to view the next image.
    *   Click "Previous" to view the previous image.
*   **Category Filtering:**
    *   Use the dropdown menu to select an image category. The gallery will then only display images from the selected category. Select "All Categories" to see images from all categories.
*   **Image Information:**
    *   The title and location of the current image are displayed in an overlay.
*   **Controls Visibility:**
    *   Move your mouse over the page to show the gallery controls. They will automatically hide after a few seconds of inactivity.

## Project Structure

*   `index.html`: The main HTML file for the dashboard and gallery.
*   `css/style.css`: Contains the styles for the application.
*   `js/gallery.js`: Handles the logic for the image gallery, including image loading, rotation, navigation, and filtering.
*   `images/`: Contains subdirectories for different image categories.
    *   `images/<category>/<image_file>.txt`: Placeholder files representing images. In a production scenario, these would be actual image files (e.g., .jpg, .png, .webp).
*   `LICENSE`: Contains the license information for the project.
*   `README.md`: This file.

## Customization

### Adding New Images

1.  **Place Image Files:** Add your new image files (e.g., `my_new_image.jpg`) to the appropriate category subfolder within the `images/` directory (e.g., `images/nature/`). If the category doesn't exist, create a new subfolder.
2.  **Update `galleryImages` Array:** Open `js/gallery.js` and add a new JavaScript object to the `galleryImages` array for each new image. Follow this format:

    ```javascript
    {
      id: 'uniqueId', // e.g., 'n07' for a new nature image
      title: 'Your Image Title',
      location: 'Image Location',
      photographer: 'Photographer Name',
      category: 'categoryName', // e.g., 'nature'
      path: 'images/categoryName/your_image_file.jpg' // Update to the actual image path
    }
    ```
    *   Ensure the `id` is unique.
    *   Update the `path` to point to your new image file (e.g., `images/nature/my_new_image.jpg`).

### Changing Image Categories

1.  **Update Image Objects:** Modify the `category` property in the image objects within the `galleryImages` array in `js/gallery.js`.
2.  **Organize Files (Optional):** Move the image files to the corresponding category folders within `images/` for better organization.
3.  **Update Category Filter:** The category filter dropdown is populated dynamically from the `galleryImages` array. No manual update to the HTML is needed for the filter itself.

## Future Ideas

*   **Actual Image Support:** Replace the `.txt` placeholder files with actual image files (e.g., `.jpg`, `.png`, `.webp`) and update the `loadImage` function in `js/gallery.js` to display them.
*   **Improved Preloading:** Enhance the image preloading logic for smoother transitions, especially on slower connections.
*   **User Preferences Storage:** Use `localStorage` to save user preferences (e.g., selected category, auto-rotate preference) across sessions.
*   **Lightbox Mode:** Implement a lightbox view for images, allowing users to see a larger version of the image with more details.
*   **Admin Interface:** Create an admin interface for easier management of images and categories without directly editing the JavaScript file.
*   **API Integration:** Fetch image data from an external API instead of a local array.
*   **Advanced Animation & Transitions:** Explore more sophisticated image transition effects.
*   **Unit Tests:** Add JavaScript unit tests to ensure the gallery logic functions as expected.

## Bug Fixes and Known Issues

*   **Placeholder Images:**
    *   **Issue:** The gallery currently uses `.txt` files as placeholders for images (`path: 'images/category/name.txt'`). The `loadImage` function in `js/gallery.js` simulates loading these text files rather than actual image files.
    *   **Fix:**
        1.  Replace all `.txt` file references in the `galleryImages` array within `js/gallery.js` with paths to actual image files (e.g., `.jpg`, `.png`, `.webp`).
        2.  Update the `loadImage` function in `js/gallery.js` to correctly load and display these image files. This involves:
            *   Creating an `Image` object (`const img = new Image();`).
            *   Setting its `src` to the image path.
            *   Using `await img.decode()` or an `onload` event to ensure the image is loaded.
            *   Setting the `backgroundImage` style of the container to `url('${imageObject.path}')`.
        3.  Ensure actual image files are present in the `images/` subdirectories.
*   **Initial Load Flicker:** There might be a slight flicker or style adjustment on initial load before the JavaScript fully initializes the gallery. This could be mitigated by setting initial styles or a loading state.
*   **Accessibility Enhancements:** While some ARIA attributes are used, a full accessibility audit could identify further improvements for keyboard navigation and screen reader compatibility.

## CI/CD Pipeline (Conceptual Setup)

Setting up a CI/CD (Continuous Integration/Continuous Delivery) pipeline can automate testing and deployment. Here's a conceptual outline using GitHub Actions:

1.  **Prerequisites:**
    *   Project hosted on GitHub.
    *   Deployment target (e.g., GitHub Pages, Netlify, Vercel).

2.  **Create a Workflow File:**
    *   In your repository, create a `.github/workflows/main.yml` file.

3.  **Define Workflow:**

    ```yaml
    name: CI/CD Pipeline for Serene Dashboard

    on:
      push:
        branches: [ main ] # Trigger on pushes to the main branch
      pull_request:
        branches: [ main ] # Trigger on pull requests to main

    jobs:
      build-and-deploy:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout code
            uses: actions/checkout@v3

          # Add steps for linting, testing, building if applicable
          # For this simple static site, we might just deploy.

          # Example: Lint HTML/CSS/JS (if linters are configured)
          # - name: Lint Code
          #   run: |
          #     npm install # If you have linters as dev dependencies
          #     npm run lint # Or specific lint commands

          # Example: Run Tests (if tests are added)
          # - name: Run Tests
          #   run: |
          #     npm install # If you have a test runner
          #     npm test

          # Example: Deploy to GitHub Pages
          - name: Deploy to GitHub Pages
            uses: peaceiris/actions-gh-pages@v3
            if: github.ref == 'refs/heads/main' # Only deploy on push to main
            with:
              github_token: ${{ secrets.GITHUB_TOKEN }}
              publish_dir: ./ # Assuming index.html is in the root

          # Add other deployment steps for services like Netlify/Vercel if needed
    ```

4.  **Explanation:**
    *   **`on`**: Defines when the workflow runs (e.g., on pushes or pull requests to the `main` branch).
    *   **`jobs`**: Defines a set of tasks to execute.
    *   **`build-and-deploy`**: A specific job that runs on an `ubuntu-latest` runner.
    *   **`steps`**:
        *   `actions/checkout@v3`: Checks out your repository code.
        *   **(Optional) Linting/Testing:** You would add steps here if you have linters (e.g., ESLint, Stylelint) or test suites (e.g., Jest, Mocha). This typically involves installing dependencies and running lint/test commands.
        *   `peaceiris/actions-gh-pages@v3`: An action to deploy the content of `publish_dir` (in this case, the root directory `./`) to GitHub Pages. This step is conditional and only runs on direct pushes to the `main` branch.

5.  **Secrets:**
    *   `GITHUB_TOKEN`: Automatically provided by GitHub Actions, needed for deploying to GitHub Pages.

6.  **Further Steps:**
    *   **Install Linters/Testers:** If you add linting or testing, include their configurations (e.g., `.eslintrc.js`, `stylelint.config.js`, test files).
    *   **Build Process:** For more complex projects, you might have a build step (e.g., using Webpack, Parcel) that generates optimized static assets into a `dist` folder. The `publish_dir` would then be set to that folder.

This CI/CD setup provides a basic framework. For production applications, more sophisticated pipelines include stages for building, testing across multiple environments, and more complex deployment strategies.

## License

This project is licensed under the terms of the MIT License. See the `LICENSE` file for details.
