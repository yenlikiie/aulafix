import { categoryLabels, getIssueServiceArea, helpLabels, matchOrganizations, safeWebsite } from "./organizations.js";

// Use the existing bundled React instance and design tokens. No second React
// runtime, backend, network request, or access to account state is needed.
export function createIssueDetails(React, palette, styles) {
  const el = React.createElement;
  const kindLabels = { ngo: "NGO partner", community: "Community partner", commercial: "Commercial provider" };

  return function IssueDetails({ report }) {
    const headingId = React.useId();
    const matches = matchOrganizations(report);
    const area = getIssueServiceArea(report);
    const badge = (text, className = "") => el("span", { className: `af-help-badge ${className}`, key: text }, text);

    return el("details", { className: "af-issue-details", style: { borderColor: palette.border } },
      el("summary", { style: { color: palette.accent } }, "View issue details & local help"),
      el("div", { className: "af-issue-details-body" },
        el("p", { className: "af-issue-description", style: { color: palette.textSecondary } }, report.description),
        el("section", { "aria-labelledby": headingId, className: "af-help" },
          el("h2", { id: headingId, style: { ...styles.sectionHeader, lineHeight: 1.4, letterSpacing: "normal" } }, "Organizations That Can Help"),
          el("p", { className: "af-help-intro" }, "Relevant advice and community support. Public infrastructure repairs require authorization from the responsible authority."),
          matches.some(({ organization }) => organization.demonstration) && el("p", { className: "af-help-demo-note" },
            "Demonstration listings are labeled below. They are fictional examples, not confirmed AulaFix partners. Example links do not contact a provider."),
          matches.length === 0
            ? el("div", { className: "af-help-empty", role: "status" },
              el("p", { className: "af-help-empty-title" }, "No matching organizations yet"),
              el("p", null, area
                ? "No eligible organizations are listed for this issue category in Taldykorgan. You can still use the civic reporting and complaint tools."
                : "We could not confirm a supported city from this issue’s address. No local providers are suggested. Include the city as a separate part of the address, for example: Abai St. 10, Taldykorgan."))
            : el("ul", { className: "af-help-list" }, matches.map(({ organization, offerings, authorized }) =>
              el("li", { key: organization.id, className: "af-help-card" },
                el("div", { className: "af-help-badges" },
                  badge(kindLabels[organization.kind]),
                  organization.sponsored && badge("Sponsored", "af-help-sponsored"),
                  organization.demonstration && badge("Demonstration", "af-help-demo")),
                el("h3", { className: "af-help-name" }, organization.name),
                el("p", { className: "af-help-category" },
                  `${categoryLabels[report.category]} · ${[...new Set(offerings.map((offering) => helpLabels[offering.help]))].join(" / ")} · Taldykorgan`),
                el("p", { className: "af-help-description" }, organization.description),
                authorized
                  ? el("p", { className: "af-help-authorization" },
                    `Public-utility repair authorization verified for ${categoryLabels[report.category].toLowerCase()} in Taldykorgan. Authority: ${organization.publicUtilityAuthorization.authority}. `,
                    el("a", {
                      href: safeWebsite(organization.publicUtilityAuthorization.evidenceUrl), target: "_blank",
                      rel: "noopener noreferrer", referrerPolicy: "no-referrer",
                    }, "View authorization evidence"))
                  : el("p", { className: "af-help-authorization" }, "No verified public-utility repair authorization. Listed for advice or community support only."),
                el("a", {
                  className: "af-help-link", href: safeWebsite(organization.website), target: "_blank",
                  rel: "noopener noreferrer", referrerPolicy: "no-referrer",
                  "aria-label": `${organization.demonstration ? "Open example website" : "Visit website"} for ${organization.name} (opens in a new tab)`,
                }, organization.demonstration ? "Example website (demo) ↗" : "Visit website ↗")))),
          el("p", { className: "af-help-footer" },
            "Sponsorship does not affect civic issue rankings or imply official approval. AulaFix does not send your reporter details to these organizations. External websites open separately."))));
  };
}
