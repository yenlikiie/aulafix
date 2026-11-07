import test from "node:test";
import assert from "node:assert/strict";
import { organizations } from "../assets/organizations-data.js";
import { getIssueServiceArea, hasPublicUtilityAuthorization, matchOrganizations, safeWebsite, validateOrganizations } from "../assets/organizations.js";
import { createIssueDetails } from "../assets/organizations-ui.js";

const now = Date.parse("2026-11-07T12:00:00Z");
const issue = { category: "roads", address: "Abai St. 10, Taldykorgan" };
const listing = (overrides = {}) => ({ ...structuredClone(organizations[0]), ...overrides });
const repairProvider = (overrides = {}) => listing({
  kind: "commercial", demonstration: false, sponsored: true,
  offerings: [{ category: "roads", help: "public_utility_repair" }],
  ...overrides,
});
// Synthetic test evidence only. Never included in the shipped directory.
const authorization = (overrides = {}) => ({
  status: "verified", authority: "Test municipal authority", evidenceUrl: "https://example.org/evidence",
  categories: ["roads"], serviceAreas: ["taldykorgan"],
  verifiedAt: "2026-01-01T00:00:00Z", expiresAt: "2027-01-01T00:00:00Z", ...overrides,
});

test("shipped demonstrations validate and cover only the intended categories", () => {
  assert.deepEqual(validateOrganizations(), []);
  for (const [category, count] of Object.entries({ roads: 2, lighting: 1, waste: 1, infrastructure: 2, safety: 0 })) {
    const matches = matchOrganizations({ ...issue, category });
    assert.equal(matches.length, count, category);
    assert.ok(matches.every(({ organization, authorized }) => organization.demonstration && !authorized));
  }
});

test("city matching is exact, case insensitive, and supports comma-delimited geocoder addresses", () => {
  for (const address of ["Taldykorgan", "Abai 10, TALDYKORGAN ", "Abai 10, Taldykorgan, Kazakhstan"]) {
    assert.equal(getIssueServiceArea({ address }), "taldykorgan");
  }
  for (const address of ["Abai 10, Almaty", "Taldykorgan Avenue, Almaty", "Not Taldykorgan", "Taldykorgan (location not specified)", "", null]) {
    assert.equal(getIssueServiceArea({ address }), null);
    assert.deepEqual(matchOrganizations({ ...issue, address }), []);
  }
});

test("category, area, active status, and eligible help must all match", () => {
  for (const overrides of [
    { offerings: [{ category: "waste", help: "advice" }] },
    { serviceAreas: ["almaty"] }, { serviceAreas: ["*"] }, { active: false },
    { offerings: [] }, { offerings: [{ category: "roads", help: "unreviewed_service" }] },
  ]) assert.deepEqual(matchOrganizations(issue, [listing(overrides)]), []);
  assert.deepEqual(matchOrganizations({ ...issue, category: "unknown" }), []);
  assert.deepEqual(matchOrganizations({ ...issue, category: "toString" }), []);
});

test("malformed or unsafe public listings fail closed", () => {
  for (const record of [null, {}, listing({ name: "" }), listing({ kind: "official" }),
    listing({ sponsored: undefined }), listing({ demonstration: undefined }),
    listing({ offerings: null }), listing({ website: "javascript:alert(1)" })]) {
    assert.deepEqual(matchOrganizations(issue, [record]), []);
  }
  assert.deepEqual(matchOrganizations(null), []);
  assert.deepEqual(matchOrganizations(issue, null), []);
});

test("only HTTPS website links without credentials are allowed", () => {
  assert.equal(safeWebsite("https://example.org/"), "https://example.org/");
  for (const url of [undefined, "", "/relative", "javascript:alert(1)", "data:text/html,test", "http://example.org", "https://user:password@example.org"]) {
    assert.equal(safeWebsite(url), null);
  }
});

test("neither sponsorship nor a generic verified flag authorizes public repairs", () => {
  for (const sponsored of [true, false]) {
    assert.deepEqual(matchOrganizations(issue, [repairProvider({ sponsored, verified: true })], now), []);
  }
});

test("public repairs need current evidence scoped to category and area", () => {
  const provider = repairProvider({ publicUtilityAuthorization: authorization() });
  assert.equal(matchOrganizations(issue, [provider], now)[0].authorized, true);
  assert.equal(hasPublicUtilityAuthorization(provider, "lighting", "taldykorgan", now), false);
  assert.equal(hasPublicUtilityAuthorization(provider, "roads", "almaty", now), false);
  for (const overrides of [
    { status: "pending" }, { authority: " " }, { evidenceUrl: "javascript:alert(1)" },
    { categories: ["lighting"] }, { serviceAreas: ["almaty"] },
    { verifiedAt: "2027-01-01" }, { verifiedAt: "invalid" },
    { expiresAt: "2026-11-07T12:00:00Z" }, { expiresAt: "invalid" }, { expiresAt: undefined },
  ]) {
    assert.deepEqual(matchOrganizations(issue, [repairProvider({ publicUtilityAuthorization: authorization(overrides) })], now), [], JSON.stringify(overrides));
  }
});

test("demonstrations cannot receive public repair authorization even with evidence fields", () => {
  assert.deepEqual(matchOrganizations(issue, [repairProvider({ demonstration: true, publicUtilityAuthorization: authorization() })], now), []);
});

test("unverified repair offers are filtered while eligible advice remains", () => {
  const provider = repairProvider({ offerings: [
    { category: "roads", help: "public_utility_repair" },
    { category: "roads", help: "advice" },
  ] });
  const [match] = matchOrganizations(issue, [provider], now);
  assert.deepEqual(match.offerings, [{ category: "roads", help: "advice" }]);
  assert.equal(match.authorized, false);
});

test("sponsorship and vote counts cannot change relevance, ordering or civic data", () => {
  const report = { ...issue, votes: 14, severity: 4, reporter: { phone: "private" } };
  const before = structuredClone(report);
  const listings = [listing({ id: "a", sponsored: false }), listing({ id: "b", sponsored: true })];
  const ids = (data, records) => matchOrganizations(data, records).map(({ organization }) => organization.id);
  assert.deepEqual(ids(report, listings), ["a", "b"]);
  assert.deepEqual(ids({ ...report, votes: 0 }, listings.map((entry) => ({ ...entry, sponsored: !entry.sponsored }))), ["a", "b"]);
  assert.deepEqual(report, before);
  assert.equal(listings[1].sponsored, true);
});

test("validation catches duplicate IDs, unknown categories, unsupported areas and unauthorized repairs", () => {
  for (const records of [
    [listing(), listing()], [listing({ offerings: [{ category: "other", help: "advice" }] })],
    [listing({ serviceAreas: ["almaty"] })], [repairProvider()],
    [listing({ website: "http://example.org" })],
  ]) assert.ok(validateOrganizations(records).length > 0);
  assert.deepEqual(validateOrganizations([listing({ active: false })]), []);
  for (const records of [null, [null], [listing({ serviceAreas: "taldykorgan", offerings: "roads" })]]) {
    assert.ok(validateOrganizations(records).length > 0);
  }
});

test("UI keeps sponsorship, demo and authorization notices explicit and contact links private", () => {
  const fakeReact = { createElement: (tag, props, ...children) => ({ tag, props, children }), useId: () => "heading" };
  const Details = createIssueDetails(fakeReact, {}, { sectionHeader: {} });
  const tree = Details({ report: { ...issue, description: "<script>alert('test')</script>" } });
  const nodes = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    nodes.push(node);
    node.children.forEach(visit);
  }
  visit(tree);
  const serialized = JSON.stringify(tree);
  for (const label of ["Sponsored", "Demonstration", "Community partner", "Commercial provider", "No verified public-utility repair authorization"]) {
    assert.ok(serialized.includes(label));
  }
  assert.ok(!serialized.includes("dangerouslySetInnerHTML"));
  for (const link of nodes.filter((node) => node.tag === "a")) {
    assert.equal(link.props.href, "https://example.org/");
    assert.equal(link.props.referrerPolicy, "no-referrer");
    assert.equal(link.props.rel, "noopener noreferrer");
    assert.ok(!link.props.href.includes("reporter"));
  }
});
