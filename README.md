# Serene Dashboard - Image Gallery

## Project Description

The Serene Dashboard is a web application that displays a rotating gallery of images, creating a calm and visually appealing background experience. Users can pause the rotation, navigate between images, and filter images by category. The project is built with HTML, CSS, and JavaScript.

## Features

*   **Dynamic Background Image Gallery:** Displays images that transition smoothly.
*   **Image Rotation:** Images automatically rotate at a set interval.
*   **Manual Navigation:** Users can pause rotation and navigate to the next or previous image.
*   **Category Filtering:** Images can be filtered by categories (e.g., Nature, Architecture, Seasons, Culture).
*   **Image Information Overlay:** Displays the title and location of the current image.
*   **Lightbox Mode:** Click on the image information (title and location) to view a larger version of the current image in a modal overlay. Navigate between images within the lightbox using previous/next buttons, or close it with a dedicated button or the Escape key.
*   **Responsive Controls:** Gallery controls (pause, next, previous, category filter) are available and auto-hide when not in use.
*   **Reduced Motion Accessibility:** Respects user preference for reduced motion.
*   **User Preferences:** Remembers your last selected image category and whether image rotation was paused or active across sessions.
*   **Journaling Widget:** Allows users to write and save daily journal entries with optional mood tracking. Entries are stored locally and can be navigated by date.

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
*   **Viewing Images in Lightbox:** Click on the image information (title and location) that appears over the background image. This will open a lightbox showing a larger version of the image. You can navigate to the previous or next image within the lightbox using the provided arrow buttons, or close the lightbox using the close button (×) or by pressing the Escape key.
*   **Controls Visibility:**
    *   Move your mouse over the page to show the gallery controls. They will automatically hide after a few seconds of inactivity.

### Using the Journaling Widget

*   **Writing an Entry:** Type your thoughts into the text area provided in the "My Journal" widget.
*   **Selecting a Mood (Optional):** Click on one of the emoji icons below the text area to associate a mood with your entry. Click again or select another to change it.
*   **Saving an Entry:** Click the "Save Entry" button. If an entry for the current day already exists, it will be updated. Otherwise, a new entry for today will be created.
*   **Viewing Past Entries:**
    *   Use the "Previous" and "Next" arrow buttons to navigate through your entries chronologically.
    *   Select a specific date using the date picker to jump directly to that day's entry (if one exists).
*   **Data Storage:** Journal entries are saved in your browser's local storage.

### User Preferences
The gallery automatically saves the following settings to your browser's local storage:
*   **Selected Category:** The last image category you filtered by.
*   **Rotation State:** Whether the image rotation was active or paused.

These preferences are loaded when you next open the dashboard, allowing you to continue your session where you left off.

### Application Scenarios

The Serene Dashboard can be used in a variety of ways to create a calm and visually appealing atmosphere:

*   **Personal Relaxation and Mindfulness:** Use the dashboard to create a soothing backdrop for your relaxation exercises, meditation sessions, or simply to unwind after a busy day.
*   **Ambient Display for Homes or Offices:** Transform any screen into a dynamic art piece. The rotating images can enhance the ambiance of your living space or provide a calming visual focus in a work environment.
*   **Digital Signage in Waiting Rooms or Reception Areas:** Create a more welcoming and peaceful atmosphere for visitors or clients by displaying serene imagery in waiting areas.
*   **A Calming Background for Study or Work Sessions:** Minimize distractions and promote focus by using the dashboard as a gentle, unobtrusive background while you study or work.
*   **A Visual Aid for Meditation or Yoga Practices:** The beautiful and tranquil images can serve as a focal point or visual inspiration during meditation or yoga.

## Project Structure

*   `index.html`: The main HTML file for the dashboard and gallery.
*   `css/style.css`: Contains the styles for the application.
*   `js/gallery.js`: Handles the logic for the image gallery, including image loading, rotation, navigation, and filtering.
*   `images/`: Contains subdirectories for different image categories.
    *   `images/<category>/<image_file>.jpg`: Image files for the gallery.
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

## Contributing and Bug Reporting

We welcome contributions and bug reports to help improve the Serene Dashboard!

### Reporting Bugs

If you encounter a bug, please help us by reporting it. Before submitting a new bug report, please:

1.  **Check Existing Issues:** Search the existing issues on GitHub to see if someone else has already reported the same problem.
2.  **Open a New Issue:** If the bug hasn't been reported, please open a new issue on GitHub.
3.  **Provide Details:** In your issue, please include as much detail as possible, such as:
    *   Steps to reproduce the bug.
    *   The browser and version you are using (e.g., Chrome 105, Firefox 103).
    *   Your operating system (e.g., Windows 11, macOS Monterey).
    *   Screenshots or screen recordings if they help illustrate the problem.

### Contributing to Development

We follow the standard GitHub flow for contributions:

1.  **Fork the Repository:** Create your own fork of the project on GitHub.
2.  **Create a Feature Branch:** Switch to a new branch for your changes:
    ```bash
    git checkout -b feature/AmazingFeature
    ```
    (Replace `AmazingFeature` with a descriptive name for your feature or fix).
3.  **Commit Your Changes:** Make your changes and commit them with a clear message:
    ```bash
    git commit -m 'Add some AmazingFeature'
    ```
4.  **Push to the Branch:** Push your changes to your forked repository:
    ```bash
    git push origin feature/AmazingFeature
    ```
5.  **Open a Pull Request:** Go to the original Serene Dashboard repository and open a new Pull Request from your feature branch. Provide a clear description of your changes.

**Coding Guidelines:**

*   Write clean and understandable code.
*   If you are adding new functionality, consider if unit tests are needed. You can find more information in the "Running Unit Tests" section.
*   Currently, the project does not enforce a strict coding style, but please try to maintain consistency with the existing codebase.

## Running Unit Tests

The unit tests for this project are written using Jest, a delightful JavaScript Testing Framework.

To run the tests, navigate to the root directory of the project in your terminal and execute the following command:

```bash
npx jest
```

This command will discover and run all test files (typically ending in `.test.js` or `.spec.js`) within the project.

## Future Ideas

*   **Improved Preloading:** Enhance the image preloading logic for smoother transitions, especially on slower connections.
*   **Admin Interface:** Create an admin interface for easier management of images and categories without directly editing the JavaScript file.
*   **API Integration:** Fetch image data from an external API instead of a local array.
*   **Advanced Animation & Transitions:** Explore more sophisticated image transition effects.
*   **Unit Tests:** Add JavaScript unit tests to ensure the gallery logic functions as expected.

## CI/CD Pipeline

A CI/CD (Continuous Integration/Continuous Delivery) pipeline has been set up for this project using GitHub Actions to automate testing and deployment.

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
        branches: [ main ]
      pull_request:
        branches: [ main ]

    jobs:
      build-and-deploy:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout code
            uses: actions/checkout@v4

          - name: Set up Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '18'

          - name: Install dependencies
            run: npm install

          - name: Run Tests
            run: npx jest

          # Optional: Generate Code Coverage Report (as mentioned in README)
          # - name: Generate Code Coverage
          #   run: npx jest --coverage

          - name: Deploy to GitHub Pages
            uses: peaceiris/actions-gh-pages@v3
            if: github.ref == 'refs/heads/main' # Only deploy on push to main
            with:
              github_token: ${{ secrets.GITHUB_TOKEN }}
              publish_dir: ./
    ```

4.  **Explanation:**
    *   **`on`**: Defines when the workflow runs (e.g., on pushes or pull requests to the `main` branch).
    *   **`jobs`**: Defines a set of tasks to execute.
    *   **`build-and-deploy`**: A specific job that runs on an `ubuntu-latest` runner.
    *   **`steps`**:
        *   `actions/checkout@v4`: Checks out your repository code.
        *   **(Optional) Linting:** Incorporate linters for code quality. Specific examples for a pipeline step:
            *   **JavaScript (ESLint):** Run `npx eslint .` (assuming ESLint is configured, e.g., via `.eslintrc.js` and dependencies in `package.json`).
            *   **CSS (Stylelint):** Run `npx stylelint "**/*.css"` (assuming Stylelint is configured, e.g., via `.stylelintrc.js` and dependencies).
            *   **HTML (html-validate):** Run `npx html-validate ./**/*.html` (assuming html-validate is configured and dependencies installed).
        *   **(Crucial) Running Tests:** The `npx jest` command (assuming Jest is set up) is vital for verifying that new changes don't break existing functionality.
        *   **Code Coverage:** Jest can generate a code coverage report (e.g., using `npx jest --coverage`). This report highlights parts of your code not covered by tests and helps in gradually increasing test coverage. It's a good practice to review this report.
        *   **Static Analysis for Performance and Accessibility:** Tools like Google Lighthouse (runnable via CLI, e.g., `lhci autorun` after setup, or through browser developer tools) can analyze your site for performance bottlenecks, accessibility issues (against WCAG guidelines), and basic SEO best practices. Consider incorporating these checks, perhaps manually at first or via a GitHub Action that comments on PRs with Lighthouse scores.
        *   `peaceiris/actions-gh-pages@v3`: An action to deploy the content of `publish_dir` (in this case, the root directory `./`) to GitHub Pages. This step is conditional and only runs on direct pushes to the `main` branch.

5.  **Secrets:**
    *   `GITHUB_TOKEN`: Automatically provided by GitHub Actions, needed for deploying to GitHub Pages.

6.  **Further Steps:**
    *   **Install Linters/Testers:** If you add linting or testing, include their configurations (e.g., `.eslintrc.js`, `stylelint.config.js`, test files) and ensure they are installed (e.g., via `npm install`).
    *   **Build Process:** For more complex projects, you might have a build step (e.g., using Webpack, Parcel) that generates optimized static assets into a `dist` folder. The `publish_dir` would then be set to that folder.

This CI/CD setup automates the testing and deployment process. The workflow includes steps for checking out code, setting up Node.js, installing dependencies, running tests, and deploying the application to GitHub Pages on pushes to the main branch. It can be further customized and expanded based on future project needs.

## License

This project is licensed under the terms of the MIT License. See the `LICENSE` file for details.
