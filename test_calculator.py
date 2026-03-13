from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.route("**/*clippy*", lambda route: route.abort())
        page.route("**/*.mjs", lambda route: route.abort())

        page.goto("http://localhost:8080")

        page.evaluate("""() => {
            const bootScreen = document.getElementById('boot-screen');
            if (bootScreen) {
                bootScreen.style.display = 'none';
            }
            document.body.classList.remove('booting');

            const allNodes = document.body.children;
            for (let i = 0; i < allNodes.length; i++) {
                if (allNodes[i].id !== 'calculator-window') {
                    allNodes[i].style.display = 'none';
                }
            }
        }""")

        page.evaluate("window.Windows97.showApp('calculator')")
        page.wait_for_selector("#calculator-window:not(.app-window-hidden)")
        page.evaluate("""() => {
            const calc = document.getElementById('calculator-window');
            calc.style.display = 'flex';
            calc.style.zIndex = '99999';
            calc.style.top = '10px';
            calc.style.left = '10px';
        }""")

        def click_btn(action, val=None):
            if val is not None:
                page.click(f"#calculator-window .calculator-btn[data-action='{action}'][data-val='{val}']", force=True)
            else:
                page.click(f"#calculator-window .calculator-btn[data-action='{action}']", force=True)

        def get_display():
            return page.evaluate("document.getElementById('calc-display').value")

        # Code review test: 50 + 10 % = 55
        click_btn("clear")
        click_btn("num", "5")
        click_btn("num", "0")
        click_btn("add")
        click_btn("num", "1")
        click_btn("num", "0")
        click_btn("percent")
        click_btn("equals")
        assert get_display() == "55", f"Expected 55, got {get_display()}"

        # Code review test: 5 + MR = 10
        click_btn("clear")
        click_btn("num", "5")
        click_btn("ms") # M=5
        click_btn("clear")
        click_btn("num", "5")
        click_btn("add")
        click_btn("mr") # MR=5
        click_btn("equals")
        assert get_display() == "10", f"Expected 10, got {get_display()}"

        # Test: chaining calculations, e.g. 2 + 2 = 4 + 2 = 6
        click_btn("clear")
        click_btn("num", "2")
        click_btn("add")
        click_btn("num", "2")
        click_btn("equals")
        assert get_display() == "4"
        click_btn("add")
        click_btn("num", "2")
        click_btn("equals")
        assert get_display() == "6"

        print("All calculator Playwright tests passed successfully!")
        browser.close()

if __name__ == "__main__":
    run()
