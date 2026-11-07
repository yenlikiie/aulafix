// Demonstrations only. Replace these with reviewed partner records before launch.
// Keep this file public-data-only: it is served directly to every visitor.
export const organizations = [
  {
    id: "demo-neighborhood-network",
    name: "Neighborhood Support Network",
    kind: "community",
    description: "Demonstration of a community group helping neighbors document hazards and prepare requests to the responsible authority.",
    serviceAreas: ["taldykorgan"],
    offerings: [
      { category: "roads", help: "community_support" },
      { category: "lighting", help: "community_support" },
      { category: "infrastructure", help: "community_support" },
    ],
    website: "https://example.org/",
    sponsored: false,
    demonstration: true,
    active: true,
  },
  {
    id: "demo-clean-neighborhood",
    name: "Clean Neighborhood Initiative",
    kind: "ngo",
    description: "Demonstration of an environmental NGO offering waste-reporting advice. Does not handle hazardous waste or perform municipal cleanup.",
    serviceAreas: ["taldykorgan"],
    offerings: [{ category: "waste", help: "advice" }],
    website: "https://example.org/",
    sponsored: false,
    demonstration: true,
    active: true,
  },
  {
    id: "demo-access-advice",
    name: "Access Advice Studio",
    kind: "commercial",
    description: "Demonstration of a commercial service offering accessibility advice and help documenting damaged paths or public facilities. No public repairs are offered.",
    serviceAreas: ["taldykorgan"],
    offerings: [
      { category: "roads", help: "advice" },
      { category: "infrastructure", help: "advice" },
    ],
    website: "https://example.org/",
    sponsored: true,
    demonstration: true,
    active: true,
  },
];
