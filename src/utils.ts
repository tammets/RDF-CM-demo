const routeMap = {
  Dashboard: "",
  Subjects: "subjects",
  Topics: "topics",
  Outcomes: "outcomes",
  Browse: "browse",
  Search: "search",
  Relations: "relations",
  Import: "import",
  Export: "export",
} as const;

export type PageName = keyof typeof routeMap;

export function createPageUrl(name: PageName) {
  const slug = routeMap[name];
  return slug ? `/${slug}` : "/";
}
