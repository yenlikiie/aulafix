Adds expandable issue details with an **Organizations That Can Help** section to the existing feed cards. Listings must match the issue category, a confirmed supported city, and eligible help. NGO/community partners and commercial providers have separate labels; sponsored placements are explicitly labeled. Public-utility repair offers require reviewed, current authorization scoped to the category and service area.

The repository only contains compiled React assets and has no separate issue-detail route or original source/build project. This change adds three small bundle integration hooks and readable, dependency-free modules for configuration, matching and rendering. All initial organizations are clearly identified fictional demonstrations linked to an example website. No real partners were supplied.

The change does not alter votes, civic rankings, complaint eligibility, payments or reporter-data sharing. It adds no backend or data-sale functionality. Addresses without a confirmed supported city and categories without eligible partners have explicit empty states.

Validation:

- `npm test`: 12 Node tests covering matching, safe contacts, sponsorship independence, authorization scope/expiry and UI disclosures.
- `npm run check`: JavaScript syntax, listing configuration, static assets and integration hook.
- `python tests/browser.py`: Chromium at 320, 390 and 1280px, including keyboard interaction, links, empty states, vote/complaint regression, navigation and report submission.
- No original build command exists; the repository ships prebuilt static assets.

See `docs/organizations-mvp.md` for listing maintenance, limitations, manual acceptance steps and later provider-dashboard/opt-in-request/aggregate-analytics proposals. See `docs/github-review.md` for owner identity, review and merge instructions. Original-source rebuilds must preserve or port the feature hooks.

AI-assisted development. Owner review and approval are required before integration. No merge or deployment is authorized by this pull request.
