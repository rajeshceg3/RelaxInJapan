from playwright.sync_api import sync_playwright
import os

def verify_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800}) # Desktop view

        try:
            page.goto("http://localhost:8000/index.html")

            # Wait for gallery to load (optional, but good practice)
            page.wait_for_selector("#background-gallery", timeout=5000)

            # Take a screenshot of the initial state
            # Ensure path is correct relative to cwd or absolute
            page.screenshot(path="verification/dashboard_desktop.png")
            print("Desktop screenshot taken.")

            # Mobile view
            page.set_viewport_size({'width': 375, 'height': 812})
            page.reload()
            page.wait_for_selector("#background-gallery", timeout=5000)
            page.screenshot(path="verification/dashboard_mobile.png")
            print("Mobile screenshot taken.")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dashboard()
