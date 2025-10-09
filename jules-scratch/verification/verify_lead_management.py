from playwright.sync_api import sync_playwright, expect, Page

def verify_lead_management(page: Page):
    """
    This script verifies the key UI components of the new Lead Management module.
    """
    # 1. Navigate to the Lead Management Dashboard and take a screenshot.
    print("Navigating to dashboard...")
    page.goto("http://localhost:3000/leads")
    expect(page.get_by_role("heading", name="Lead Management")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/01_lead_dashboard.png")
    print("Dashboard screenshot captured.")

    # 2. Navigate to the 'Create New Lead' page and take a screenshot.
    print("Navigating to create lead page...")
    page.get_by_role("button", name="+ New Lead").click()
    expect(page).to_have_url("http://localhost:3000/leads/create")
    expect(page.get_by_role("heading", name="Create Account-Lead")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/02_create_lead_form.png")
    print("Create lead form screenshot captured.")

    # 3. Navigate back and click on the first lead's 'View' button.
    print("Navigating to lead detail page...")
    page.goto("http://localhost:3000/leads")
    page.get_by_role("button", name="View").first.click()
    expect(page).to_have_url("http://localhost:3000/leads/1") # Assumes first lead has id '1'

    # 4. Take a screenshot of the lead detail page, showing all new sections.
    expect(page.get_by_role("heading", name="Lead Details")).to_be_visible()
    expect(page.get_by_text("Activity Feed")).to_be_visible()
    expect(page.get_by_text("Follow-up Tasks")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/03_lead_detail_view.png")
    print("Lead detail view screenshot captured.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_lead_management(page)
            print("Verification script completed successfully.")
        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    main()