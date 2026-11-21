"""Side-by-side review captures (planche | product) for the locked design.

Usage: python tools/make-review-captures.py [--port 8123]
Writes G-DESIGN/revue/*.png: one composed pair per page, plus the raw shots.
The product runs from dist/ with ?demo=1 (deterministic offline engine).
"""
import argparse
import functools
import http.server
import socketserver
import threading
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
PLANCHES = ROOT / "G-DESIGN" / "planches" / "relief"
REVUE = ROOT / "G-DESIGN" / "revue"

PAGES = [
    ("01-inbox", "01-inbox.html", None),
    ("02-message", "02-message.html", None),
    ("03-paste", "03-paste.html", None),
    ("04-dashboard", "04-dashboard.html", None),
]

WIDTH, HEIGHT = 1440, 900


def serve(port: int) -> http.server.ThreadingHTTPServer:
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIST))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd


def product_steps(page) -> None:
    """Score the demo inbox once, then capture every page with real data."""
    page.goto(f"http://127.0.0.1:{PORT}/?demo=1#/inbox")
    page.wait_for_timeout(800)
    page.click("#scan")
    page.wait_for_timeout(5000)
    page.screenshot(path=str(REVUE / "product-01-inbox.png"))
    page.goto(f"http://127.0.0.1:{PORT}/?demo=1#/message/m1")
    page.wait_for_timeout(3000)
    page.screenshot(path=str(REVUE / "product-02-message.png"))
    page.goto(f"http://127.0.0.1:{PORT}/?demo=1#/paste")
    page.wait_for_timeout(1200)
    page.fill(
        "#paste-text",
        "Dear client, a new beneficiary has been added to your account. Call +33 1 44 55 66 77 to cancel.",
    )
    page.click("#paste-run")
    page.wait_for_timeout(2500)
    page.goto(f"http://127.0.0.1:{PORT}/?demo=1#/paste")
    page.wait_for_timeout(1200)
    page.screenshot(path=str(REVUE / "product-03-paste.png"))
    page.goto(f"http://127.0.0.1:{PORT}/?demo=1#/dashboard")
    page.wait_for_timeout(3500)
    page.screenshot(path=str(REVUE / "product-04-dashboard.png"))


def side_by_side(name: str) -> None:
    planche = Image.open(REVUE / f"planche-{name}.png")
    product = Image.open(REVUE / f"product-{name}.png")
    pair = Image.new("RGB", (WIDTH * 2 + 8, HEIGHT), "#141414")
    pair.paste(planche, (0, 0))
    pair.paste(product, (WIDTH + 8, 0))
    pair.save(REVUE / f"{name}.png")


PORT = 8123


def main() -> None:
    global PORT
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8123)
    args = parser.parse_args()
    PORT = args.port
    REVUE.mkdir(exist_ok=True)
    httpd = serve(PORT)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel='chrome')
            page = browser.new_page(viewport={"width": WIDTH, "height": HEIGHT}, device_scale_factor=1)
            for name, planche, _ in PAGES:
                page.goto(f"file:///{(PLANCHES / planche).as_posix()}")
                page.wait_for_timeout(3600)
                page.screenshot(path=str(REVUE / f"planche-{name}.png"))
            product_steps(page)
            browser.close()
    finally:
        httpd.shutdown()
    for name, _, _ in PAGES:
        side_by_side(name)
    print("written to", REVUE)


if __name__ == "__main__":
    main()
