"""Browser regression checks. Requires Python playwright and a Chromium binary.
Run from the repository root: python tests/browser.py
"""
import functools
import os
import re
from pathlib import Path
import shutil
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/aulafix/"):
            self.path = self.path[len("/aulafix"):]
        return super().do_GET()

    def log_message(self, *_):
        pass


server = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_port}/aulafix/"
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or shutil.which("chromium"), headless=True)
        for width in (320, 390, 1280):
            page = browser.new_page(viewport={"width": width, "height": 844})
            page.set_default_timeout(8000)
            errors, requests = [], []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("request", lambda request: requests.append(request.url))
            page.goto(base)
            page.get_by_placeholder("+7 700 123 4567").fill("+77001234567")
            page.get_by_placeholder("Enter password", exact=True).fill("123456")
            page.get_by_role("button", name="Log in", exact=True).click()
            page.locator("summary").first.wait_for()
            assert page.locator("summary").count() == 6
            # Native details can be opened and closed using the keyboard.
            summary = page.locator("summary").first
            summary.focus()
            page.keyboard.press("Enter")
            section = page.locator(".af-help").first
            assert section.is_visible()
            assert section.locator(".af-help-card").count() == 2
            assert section.get_by_text("Sponsored", exact=True).count() == 1
            assert section.get_by_text("Demonstration", exact=True).count() == 2
            assert section.get_by_text("Community partner", exact=True).count() == 1
            assert section.get_by_text("Commercial provider", exact=True).count() == 1
            assert section.get_by_text("No verified public-utility repair authorization.", exact=False).count() == 2
            # Merely opening local help must not contact any organization.
            requests.clear()
            summary.click()
            summary.click()
            page.wait_for_timeout(150)
            assert not requests, requests
            # Confirm the configured link works, opens a new tab and leaks no referer.
            context = page.context
            captured = []
            def example_route(route):
                captured.append(route.request.headers)
                route.fulfill(status=200, content_type="text/html", body="<title>Example website</title>")
            context.route("https://example.org/**", example_route)
            with context.expect_page() as popup_info:
                section.get_by_role("link").first.click()
            popup = popup_info.value
            popup.wait_for_load_state()
            assert popup.url == "https://example.org/"
            assert captured and "referer" not in captured[0]
            assert popup.evaluate("window.opener === null")
            popup.close()
            # Existing vote behavior, order and complaint content remain intact.
            vote = page.get_by_role("button", name="▲ 14", exact=True)
            vote.click()
            assert page.get_by_role("button", name="▲ 15", exact=True).count() == 1
            page.get_by_role("button", name="▲ 15", exact=True).click()
            page.get_by_role("button", name="Prepare complaint letter →").first.click()
            assert "Community verification: 14 residents" in page.locator("pre").inner_text()
            page.get_by_role("button", name="×", exact=True).click()
            titles_before = page.locator(".af-issue-details").evaluate_all("nodes => nodes.map(n => n.parentElement.children[2].textContent)")
            # All categories: lighting is community-only, waste is NGO-only, safety has an empty state.
            page.locator("summary").nth(1).click()
            assert page.locator(".af-help").nth(1).locator(".af-help-card").count() == 1
            page.locator("summary").nth(2).click()
            assert page.locator(".af-help").nth(2).get_by_text("NGO partner", exact=True).is_visible()
            page.locator("summary").nth(5).click()
            assert page.get_by_text("No matching organizations yet", exact=True).is_visible()
            assert page.locator(".af-issue-details").evaluate_all("nodes => nodes.map(n => n.parentElement.children[2].textContent)") == titles_before
            assert not page.evaluate("document.documentElement.scrollWidth > innerWidth"), f"Page overflows at {width}"
            assert page.locator(".af-help").evaluate_all("nodes => nodes.every(n => n.scrollWidth <= n.clientWidth)"), f"Help overflows at {width}"
            # Existing category filter, map, campaigns and insights still open.
            page.get_by_role("button", name="🗑️ Waste", exact=True).click()
            assert page.locator("summary").count() == 1
            for label, content in [("Map", "Problem Map"), ("Fund", "Community Campaigns"), ("Insights", "Your neighborhood at a glance")]:
                page.get_by_role("button", name=re.compile(label + r"$")).click()
                assert page.get_by_text(content, exact=True).count() > 0
            # New reports with an unconfirmed city get a useful empty state.
            page.get_by_role("button", name=re.compile(r"Report$")).click()
            page.get_by_text("or skip — describe the problem manually →", exact=True).click()
            page.get_by_placeholder("What's the problem?").fill("Test broken path")
            page.get_by_role("button", name="🛣️ Roads", exact=True).click()
            page.get_by_placeholder("Describe what you see", exact=False).fill("A path needs attention.")
            page.get_by_role("button", name="Next →", exact=True).click()
            page.get_by_placeholder("e.g., Auezova St. 14, near the bazaar").fill("Abai St. 10, Almaty")
            page.get_by_role("button", name="Submit Report →", exact=True).click()
            page.get_by_role("button", name="All", exact=True).click()
            page.get_by_text("Test broken path", exact=True).wait_for()
            page.locator("summary").first.click()
            assert page.get_by_text("We could not confirm a supported city", exact=False).is_visible()
            assert page.locator(".af-help").first.locator("a").count() == 0
            assert not errors, errors
            print(f"PASS {width}px: matching, disclosures, keyboard, safe links, empty states, civic actions, navigation, report submission, layout; no JS errors")
            page.close()
        browser.close()
finally:
    server.shutdown()
