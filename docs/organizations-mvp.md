# Organizations That Can Help MVP

## Repository findings and integration

The starting repository (`d708d6f`) contains `index.html`, a precompiled React 19.2.5 JavaScript bundle, CSS, and SVG assets. It has no original JSX/TypeScript source, package manifest, build pipeline, database, or test suite. The app uses React state for authentication, reports, campaigns, and tab navigation. Reports have `category`, `address`, `lat`, `lng`, votes, severity, and complaint state. There is no issue URL/router or separate issue-detail page. The existing five categories are roads, lighting, waste, infrastructure, and safety.

The MVP adds **View issue details & local help** to every feed issue card. It expands the issue description and the help section in place. Native `details`/`summary` keeps the control keyboard accessible. Existing tabs, card styling, voting, complaint thresholds, map, campaigns, and report ordering are preserved.

Only three hooks change the existing bundle: an ES module import, a component factory initialization using the existing React instance/design tokens, and one child in the issue card. The React/vendor bundle is otherwise preserved. New feature code is readable, unbundled ES modules with no external dependencies. If the original source project is recovered, move the component into that source before regenerating `assets/index.js`, or a rebuilt bundle will remove these hooks. `npm run check` detects a missing card hook.

## Files

| File | Purpose |
| --- | --- |
| `assets/organizations-data.js` | Public, reviewed organization configuration; three fictional demonstrations |
| `assets/organizations.js` | Category/area/eligibility matching, safe links, scoped repair verification, config validation |
| `assets/organizations-ui.js` | Expandable issue details and organization cards, disclosures, empty states |
| `assets/organizations.css` | Scoped responsive styles matching the existing blue/slate cards |
| `assets/index.js` | Minimal integration with the existing compiled React application |
| `index.html` | Load the feature stylesheet under the existing `/aulafix/` base path |
| `package.json`, `scripts/check.js` | Dependency-free Node test and static validation commands |
| `tests/organizations.test.js` | Matching, authorization, configuration, privacy/link and rendering checks |
| `tests/browser.py` | Chromium regression checks at 320, 390 and 1280px |
| `.gitignore` | Exclude scratch files, Python cache and local dependencies |
| `docs/organizations-mvp.md`, `docs/github-review.md`, `docs/pr-body.md` | Maintenance, testing and review handoff |
| `README.md` | Beginner-friendly Mac/VS Code preview and validation instructions |

## Listing configuration

Edit `assets/organizations-data.js`. No database or administration infrastructure is needed for this directory size. Every record needs:

- Unique `id`, accurate `name`, short `description`, and `active` boolean.
- `kind`: `ngo`, `community`, or `commercial`. This controls the visible partner/provider label.
- `serviceAreas`: canonical city IDs; this MVP supports `taldykorgan`.
- `offerings`: explicit `{ category, help }` pairs. Help is `advice`, `community_support`, or `public_utility_repair`. A category alone does not establish eligibility.
- `website`: an HTTPS URL without embedded credentials. Invalid links hide the listing.
- `sponsored`: boolean; every true value gets a separate **Sponsored** badge, regardless of organization type.
- `demonstration`: boolean. Set false only for an actual reviewed partner. Demonstrations cannot claim public repair authorization.

All three initial listings are fictional and individually labeled **Demonstration**. The global note explains that they are not confirmed partners. They link to the working `https://example.org/` placeholder and say **Example website (demo)**. Do not treat this as an actual service directory until real partners and their contact links have been supplied and reviewed. Safety intentionally has no initial listing to demonstrate the empty state.

The existing report model has no structured city. Matching requires an exact, case-insensitive `Taldykorgan` comma-delimited address token, such as `Abai St. 10, Taldykorgan` or a geocoded address containing `, Taldykorgan,`. It never assumes the app's default coordinates establish coverage. Addresses missing that city token, or in another city, show a location-specific empty state. This deliberately favors showing no provider over suggesting one outside its area. New cities require updating the city resolver and validation allowlist together; a future structured city field would remove free-text ambiguity.

Organization order follows the configuration file. Matching never reads votes, severity, account state or reporter fields. It does not sort issues or offer a paid civic ranking boost.

## Public-utility repair verification

Public repair listings are hidden unless `publicUtilityAuthorization` contains all of:

```js
{
  status: "verified",
  authority: "<responsible public authority>",
  evidenceUrl: "<reviewed HTTPS authorization evidence URL>",
  categories: ["<authorized issue category>"],
  serviceAreas: ["taldykorgan"],
  verifiedAt: "<ISO date of completed review>",
  expiresAt: "<ISO expiry date after the current time>"
}
```

An AulaFix maintainer must verify the authority, evidence, scope and expiry before entering this metadata. A `verified: true` flag or payment alone is insufficient. Authorization must cover this issue's category and city, cannot be future-dated or expired, and cannot apply to demonstration records. The UI links to the evidence and names the authority when verification is valid. Without verification, only eligible advice/community support appears, with **No verified public-utility repair authorization**. Never enter descriptions or organization names that claim official status without evidence; automated matching cannot fact-check marketing text.

No current demonstration listing offers public repairs. In particular, the waste NGO example does not offer hazardous-waste handling. Existing crowdfunding contractor claims elsewhere in the app are outside this feature and were not changed.

## Privacy and commercial scope

The component receives only the existing issue object and reads its category, address and description for display/matching. It has no access to account state, makes no organization API calls, adds no analytics pixels, and sends no reporter data or issue data in contact URLs. External links use `noopener noreferrer` and `referrerPolicy="no-referrer"`. Opening the section makes no contact request. Clicking an external site navigates there normally; that destination receives the visitor's standard connection information, not an AulaFix reporter-data payload.

Sponsorship is a configuration flag for disclosure only. This change adds no payments, checkout, organization accounts, service-request submission, or data-sale/export endpoint. Existing campaign demo behavior is unchanged.

## Run locally and validate

With the checkout named `aulafix`, run from its parent directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000/aulafix/`. The existing HTML uses absolute `/aulafix/` asset paths, so serving the repository at `/` alone will not work. No npm install is needed for the application or Node checks. Run these from the repository root:

```sh
npm test
npm run check
python3 tests/browser.py
```

`npm test` runs 12 Node tests, including multiple negative authorization and matching cases. `npm run check` validates JavaScript syntax, listing configuration, linked static assets and the bundle integration hook. There is no source build command in the starting repository; the static site is already built. No bundler was introduced for this feature.

Browser checks require the Python `playwright` package and Chromium. In a local development environment without them, create a virtual environment, activate it, then run `python3 -m pip install playwright` and `python3 -m playwright install chromium`. The script uses system `chromium` if present, otherwise Playwright's installed browser. `CHROMIUM_PATH` can select another installed Chromium. It starts its own temporary local HTTP server.

## Manual acceptance checks

1. Log in with the app's existing demo credentials: `+77001234567` / `123456`.
2. In Feed, expand the first road issue with **View issue details & local help**. Check the full issue description and two listings: a Community partner and a Commercial provider with **Sponsored**. Both say **Demonstration**, list Roads/Taldykorgan, and explicitly disclaim verified public repair authorization.
3. Open **Example website (demo)**. Confirm a new tab opens `https://example.org/`; it is not a real provider-contact page.
4. Expand the lighting issue: one community example. Expand the waste issue: one NGO example, with no hazardous-waste handling. Infrastructure has community and commercial advice examples.
5. Expand the safety issue: **No matching organizations yet**, with the civic reporting/complaint fallback.
6. Submit a road report with an address in Almaty, or with no city. Return to Feed and select **All** if a category filter is active. Expand the new report: location-specific empty state and no contact links. Submit another with `Abai St. 10, Taldykorgan` to see the road matches. Reloading resets the existing in-memory demo reports.
7. Vote/unvote an issue; confirm vote counts, urgency and issue order behave as before. Open its complaint letter and confirm its existing issue/vote content. Sponsorship must not change complaint eligibility or civic ordering.
8. Check 320px and 390px mobile widths and desktop. The help cards and badges should wrap with no horizontal overflow; scroll to reach all cards above the fixed navigation. Tab to the details control and press Enter/Space to toggle it; Tab to the contact links and confirm visible focus.
9. Confirm Feed filters, Report, Map, Fund and Insights remain usable. DevTools Network should show no provider requests when expanding help; only clicking a contact link visits its website.

## Later evolution

1. **Provider dashboard:** add authenticated provider profiles, editable coverage/offerings and a moderation queue. Keep public-utility verification under independent admin review with evidence, scope, expiry and audit history. Keep sponsorship disclosure and civic rankings separate.
2. **Opt-in service requests:** let residents select a provider and explicitly approve the exact details to share. Support withdrawal, deletion and contact preferences. Do not forward existing reports or reporter identities automatically.
3. **Neighborhood demand analytics:** aggregate counts by coarse area/category/time window; suppress small groups, avoid exact coordinates/free text/identifiers, and assess re-identification risk before partner access. Start with controlled reports and access logs. Decide retention, privacy protections and commercial terms before any analytics product or sale.
