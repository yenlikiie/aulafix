import { organizations } from "./organizations-data.js";

export const categoryLabels = Object.freeze({
  roads: "Roads",
  lighting: "Lighting",
  waste: "Waste",
  infrastructure: "Infrastructure",
  safety: "Safety",
});

export const helpLabels = Object.freeze({
  advice: "Advice",
  community_support: "Community support",
  public_utility_repair: "Public-utility repair",
});

const normalize = (value) => typeof value === "string"
  ? value.normalize("NFKC").trim().toLowerCase()
  : "";

// Existing reports have a free-text address, not a city field. Require an exact
// comma-delimited city token; never infer coverage from the app's default GPS.
export function getIssueServiceArea(report) {
  const parts = typeof report?.address === "string" ? report.address.split(",") : [];
  return parts.some((part) => normalize(part) === "taldykorgan") ? "taldykorgan" : null;
}

export function safeWebsite(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

// Authorization is category- and area-specific, independent of sponsorship.
// A boolean like `verified: true` is deliberately insufficient. The evidence
// must be reviewed by AulaFix before it is entered into this public config.
export function hasPublicUtilityAuthorization(organization, category, area, now = Date.now()) {
  const verification = organization?.publicUtilityAuthorization;
  const reviewed = Date.parse(verification?.verifiedAt);
  const expires = Date.parse(verification?.expiresAt);
  return organization?.demonstration === false
    && verification?.status === "verified"
    && typeof verification.authority === "string"
    && verification.authority.trim().length > 0
    && Boolean(safeWebsite(verification.evidenceUrl))
    && Array.isArray(verification.categories) && verification.categories.includes(category)
    && Array.isArray(verification.serviceAreas) && verification.serviceAreas.includes(area)
    && Number.isFinite(reviewed) && reviewed <= now
    && Number.isFinite(expires) && expires > now;
}

export function matchOrganizations(report, listings = organizations, now = Date.now()) {
  const area = getIssueServiceArea(report);
  if (!area || !Object.hasOwn(categoryLabels, report?.category) || !Array.isArray(listings)) return [];

  // Keep editorial config order. This function never reads votes, severity,
  // reporter identity or sponsorship when deciding relevance or order.
  return listings.flatMap((organization) => {
    if (organization?.active !== true
      || !["ngo", "community", "commercial"].includes(organization.kind)
      || typeof organization.name !== "string" || !organization.name.trim()
      || typeof organization.description !== "string" || !organization.description.trim()
      || typeof organization.sponsored !== "boolean"
      || typeof organization.demonstration !== "boolean"
      || !Array.isArray(organization.serviceAreas) || !organization.serviceAreas.includes(area)
      || !Array.isArray(organization.offerings) || !safeWebsite(organization.website)) return [];

    const authorized = hasPublicUtilityAuthorization(organization, report.category, area, now);
    const offerings = organization.offerings.filter((offering) =>
      offering?.category === report.category
      && Object.hasOwn(helpLabels, offering.help)
      && (offering.help !== "public_utility_repair" || authorized));

    return offerings.length ? [{ organization, offerings, authorized }] : [];
  });
}

// Catch configuration mistakes during `npm run check`; runtime matching also
// fails closed for incomplete records and unsafe or unverified repair offers.
export function validateOrganizations(listings = organizations) {
  const errors = [];
  const ids = new Set();
  if (!Array.isArray(listings)) return ["Organization listings must be an array"];
  for (const organization of listings) {
    const id = organization?.id;
    if (typeof id !== "string" || !id || ids.has(id)) errors.push(`Missing or duplicate ID: ${id}`);
    ids.add(id);
    const areas = Array.isArray(organization?.serviceAreas) ? organization.serviceAreas : [];
    const offerings = Array.isArray(organization?.offerings) ? organization.offerings : [];
    if (!areas.length || areas.some((area) => area !== "taldykorgan")) {
      errors.push(`${id}: unsupported or missing service area`);
    }
    if (!offerings.length) errors.push(`${id}: no offerings`);
    if (typeof organization?.active !== "boolean") errors.push(`${id}: active must be a boolean`);
    for (const offering of offerings) {
      if (!Object.hasOwn(categoryLabels, offering?.category) || !Object.hasOwn(helpLabels, offering?.help)) {
        errors.push(`${id}: unknown category or help type`);
        continue;
      }
      for (const area of areas) {
        if (offering.help === "public_utility_repair"
          && !hasPublicUtilityAuthorization(organization, offering.category, area)) {
          errors.push(`${id}: public-utility repair requires current, scoped authorization`);
        }
      }
      if (!matchOrganizations({ category: offering.category, address: "Taldykorgan" }, [{ ...organization, active: true }]).length) {
        errors.push(`${id}: listing is incomplete, unsafe or ineligible`);
      }
    }
  }
  return errors;
}
