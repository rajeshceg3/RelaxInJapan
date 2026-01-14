from playwright.sync_api import sync_playwright
import os

def run_verification():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)

        # --- Desktop Verification ---
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        # Load the local index.html file
        page.goto('file://' + os.getcwd() + '/index.html')
        page.wait_for_timeout(2000) # Wait for animations/loading

        # Take Desktop Screenshot
        screenshot_path_desktop = 'verification/desktop_dashboard.png'
        page.screenshot(path=screenshot_path_desktop, full_page=True)
        print(f"Desktop screenshot saved to {screenshot_path_desktop}")

        # --- Mobile Verification ---
        # Emulate Pixel 5
        pixel_5 = p.devices['Pixel 5']
        mobile_context = browser.new_context(**pixel_5)
        mobile_page = mobile_context.new_page()
        mobile_page.goto('file://' + os.getcwd() + '/index.html')
        mobile_page.wait_for_timeout(3000) # Wait for animations (slide up)

        # Take Mobile Viewport Screenshot (NOT full page, to verify fixed positioning)
        screenshot_path_mobile = 'verification/mobile_dashboard_viewport.png'
        mobile_page.screenshot(path=screenshot_path_mobile)
        print(f"Mobile viewport screenshot saved to {screenshot_path_mobile}")

        # Also take a full page one just in case
        screenshot_path_mobile_full = 'verification/mobile_dashboard_full.png'
        mobile_page.screenshot(path=screenshot_path_mobile_full, full_page=True)
        print(f"Mobile fullpage screenshot saved to {screenshot_path_mobile_full}")

        browser.close()

if __name__ == '__main__':
    if not os.path.exists('verification'):
        os.makedirs('verification')
    run_verification()
