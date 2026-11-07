# AulaFix

Civic issue reporting for Taldykorgan. This repository ships a prebuilt React application; running it does not require npm installation or a build.

## Preview this feature on your Mac

Install VS Code, Git and Python 3 if needed. Open **VS Code → Terminal → New Terminal**, then run:

```sh
cd ~/Documents
git clone --branch feature/organizations-that-can-help --single-branch https://github.com/yenlikiie/aulafix.git
python3 -m http.server 8000 --bind 127.0.0.1
```

Keep the terminal running and open **http://localhost:8000/aulafix/** in Chrome. The server must run from the folder containing `aulafix`, because the app's asset paths start with `/aulafix/`.

In VS Code, choose **File → Open Folder** and select `Documents/aulafix` to inspect or edit the feature. If that folder already exists, clone into another parent folder instead; do not overwrite an existing checkout.

Use the existing demo login `+77001234567` / `123456`. Expand **View issue details & local help** on a feed card. All organization listings are fictional demonstrations, and their example links do not contact real providers. Press **Control-C** in the server terminal to stop the preview. Reloading resets the existing in-memory demo reports.

## Organizations That Can Help

The new section matches listings by issue category, confirmed city coverage and eligible help. It distinguishes NGO/community partners and commercial providers, explicitly labels sponsorship, and requires current, scoped authorization evidence before offering public-utility repairs. Civic rankings and reporter-data sharing are unchanged. No payments or analytics sales are added.

Listings live in `assets/organizations-data.js`. See [the maintenance and testing guide](docs/organizations-mvp.md) for configuration, empty states, limitations and acceptance checks.

## Checks

From the `aulafix` folder, with Node.js 22 or newer installed:

```sh
npm test
npm run check
```

These require no npm dependencies. Browser tests additionally need Python Playwright and Chromium; see the maintenance guide for setup, then run `python3 tests/browser.py`.

The original JSX/source build project is absent. The new feature uses readable modules with minimal integration into the existing bundle. Port those hooks before rebuilding from any recovered original source.

See [GitHub review instructions](docs/github-review.md) for author identity, pull requests and contribution credit. Running locally does not commit, push, merge or deploy anything.
