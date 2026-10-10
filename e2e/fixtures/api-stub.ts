/**
 * A stand-in for gradfolio-api's public discovery endpoints, so the anonymous browser specs
 * can run in CI with results, empty and error states and no database. Run by
 * `playwright.config.ts` (Node strips the types). It is a fixture, not the contract: every
 * body is typed with the app's own API types, so a change to them fails the type check
 * instead of the browser run. The real API is exercised by the verification record's runs.
 *
 * Magic queries: `iot` has results in both groups and more in people; `ml` has a short
 * list; `nothing` is empty; `limited` is a 429; `boom` is a 503. Any path it does not know
 * answers 503, so a page that depends on another endpoint shows its error state.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type {
  DiscoveryProject,
  Suggestions,
  TagCloud,
  UserFacets,
  DiscoveryProjectPage,
  PersonPage,
  PersonSummary,
  SearchResults,
  TagSummary,
} from "../../src/lib/api/types";

const PORT = Number(process.env.E2E_API_PORT ?? 3199);

const person = (n: number, over: Partial<PersonSummary> = {}): PersonSummary => ({
  id: `0b6f2c1e-1111-4222-8333-4444555566${String(n).padStart(2, "0")}`,
  name:
    ["Ani Petrosyan", "Արմեն Գրիգորյան", "Алёна Смирнова", "Ben Carter", "Dana Lee"][n % 5] ??
    "Ani",
  headline: "IoT engineer and student",
  avatarUrl: null,
  verified: n % 2 === 0,
  location: "Yerevan",
  skills: ["IoT", "C#", "Go", "ML"],
  projectCount: n,
  ...over,
});

const project = (n: number, over: Partial<DiscoveryProject> = {}): DiscoveryProject => ({
  id: `5c1d9a3e-aaaa-4bbb-8ccc-dddd0000${String(n).padStart(4, "0")}`,
  title: ["Smart Garden IoT", "Խելացի այգի", "Умная теплица", "EcoRoute"][n % 4] ?? "Project",
  summary: "Soil moisture monitoring with MQTT and an IoT gateway.",
  category: (["course", "personal", "research", "hackathon"] as const)[n % 4] ?? "other",
  status: "completed",
  heroImageUrl: null,
  technologies: ["Arduino", "IoT", "MQTT"],
  tags: ["iot"],
  owner: { id: person(n).id, name: person(n).name, avatarUrl: null },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
  ...over,
});

const people = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, i) => person(offset + i));
const projects = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, i) => project(offset + i));

const TAGS: Record<string, TagSummary> = {
  iot: { name: "IoT", projectCount: 14, peopleCount: 9 },
  ml: { name: "ML", projectCount: 5, peopleCount: 7 },
  "c#": { name: "C#", projectCount: 3, peopleCount: 4 },
  "ci/cd": { name: "CI/CD", projectCount: 1, peopleCount: 1 },
  // A tag whose own name contains an escape sequence: it must stay one tag.
  "c%23": { name: "C%23", projectCount: 1, peopleCount: 1 },
};

const seen: Array<{ path: string; search: string; headers: Record<string, string | undefined> }> =
  [];

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const FAIL = {
  limited: [429, { code: "RATE_LIMITED", message: "slow down" }],
  boom: [503, { code: "DATABASE_UNAVAILABLE", message: "down" }],
} as const;

/** A query that starts with "slow" is answered late, so a test can type while a search is in flight. */
const SLOW_MS = 700;

createServer((req, res) => {
  const slow = (new URL(req.url ?? "/", "http://stub").searchParams.get("q") ?? "")
    .toLowerCase()
    .startsWith("slow");
  if (slow) {
    setTimeout(() => handle(req, res), SLOW_MS);
    return;
  }
  handle(req, res);
}).listen(PORT, "127.0.0.1", () => process.stdout.write(`api stub on ${PORT}\n`));

function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://stub");
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const name = (url.searchParams.get("name") ?? "").trim().toLowerCase();
  const cursor = url.searchParams.get("cursor");
  const limit = Number(url.searchParams.get("limit") ?? 12);
  seen.push({
    path: url.pathname,
    search: url.search,
    headers: {
      authorization: req.headers.authorization,
      "x-client-ip": req.headers["x-client-ip"] as string | undefined,
      "x-gradfolio-proxy-secret": req.headers["x-gradfolio-proxy-secret"] as string | undefined,
    },
  });

  if (url.pathname === "/__requests") return send(res, 200, seen);
  if (url.pathname === "/__reset") {
    seen.length = 0;
    return send(res, 200, {});
  }

  const failure = FAIL[q as keyof typeof FAIL];
  if (failure && url.pathname.startsWith("/v1/search")) return send(res, failure[0], failure[1]);

  const list = <T>(all: T[]) => {
    // Two pages: the first `limit` items with a cursor, then the rest.
    if (!cursor)
      return { items: all.slice(0, limit), nextCursor: all.length > limit ? "page-2" : null };
    return { items: all.slice(limit), nextCursor: null };
  };

  if (url.pathname === "/v1/search/suggestions") {
    // Prefix match on a few fixed names; `zzz` has none.
    const starts = (text: string) => text.toLowerCase().startsWith(q);
    const body: Suggestions = {
      query: q,
      people: people(5)
        .filter((p) => starts(p.name) || starts(p.headline))
        .slice(0, 3)
        .map((p) => ({ id: p.id, label: p.name, avatarUrl: null })),
      projects: projects(4)
        .filter((p) => starts(p.title))
        .slice(0, 3)
        .map((p) => ({ id: p.id, label: p.title, avatarUrl: null })),
      tags: Object.values(TAGS)
        .filter((tag) => starts(tag.name))
        .map((tag) => tag.name),
    };
    return send(res, 200, body);
  }

  if (url.pathname === "/v1/search") {
    const body: SearchResults =
      q === "nothing"
        ? {
            query: q,
            people: { items: [], hasMore: false },
            projects: { items: [], hasMore: false },
          }
        : {
            query: q,
            people: { items: people(Math.min(limit, 6)), hasMore: q === "iot" },
            projects: { items: projects(q === "ml" ? 2 : 4), hasMore: false },
          };
    return send(res, 200, body);
  }
  if (url.pathname === "/v1/search/people" || url.pathname === "/v1/tags/people") {
    const all = q === "nothing" ? [] : people(name || q === "iot" ? 15 : 3);
    const body: PersonPage = list(all);
    return send(res, 200, body);
  }
  if (url.pathname === "/v1/search/projects" || url.pathname === "/v1/tags/projects") {
    const all = q === "nothing" ? [] : projects(name || q === "iot" ? 15 : 3);
    const body: DiscoveryProjectPage = list(all);
    return send(res, 200, body);
  }
  if (url.pathname === "/v1/projects") {
    // Browse: `category=other` is empty so the empty state can be seen.
    const all = url.searchParams.get("category") === "other" ? [] : projects(15);
    const body: DiscoveryProjectPage = list(all);
    return send(res, 200, body);
  }
  if (url.pathname === "/v1/users") {
    const school = url.searchParams.get("school");
    const all = school === "Nowhere" ? [] : people(15);
    const body: PersonPage = list(all);
    return send(res, 200, body);
  }
  if (url.pathname === "/v1/users/facets") {
    const body: UserFacets = {
      schools: [
        { value: "NPUA", count: 9 },
        { value: "YSU", count: 4 },
      ],
      majors: [{ value: "Informatics", count: 7 }],
      years: [
        { value: 2026, count: 6 },
        { value: 2027, count: 3 },
      ],
      generatedAt: "2026-10-10T00:00:00.000Z",
    };
    return send(res, 200, body);
  }
  if (url.pathname === "/v1/tags/cloud") {
    const body: TagCloud = {
      generatedAt: "2026-10-10T00:00:00.000Z",
      items: [
        { name: "IoT", projects: 14, people: 9 },
        { name: "ML", projects: 5, people: 7 },
        { name: "C#", projects: 3, people: 4 },
        { name: "Go", projects: 1, people: 2 },
      ],
    };
    return send(res, 200, body);
  }
  if (url.pathname === "/v1/tags") {
    const tag = TAGS[name];
    return tag ? send(res, 200, tag) : send(res, 404, { code: "NOT_FOUND", message: "no tag" });
  }
  return send(res, 503, { code: "DATABASE_UNAVAILABLE", message: "the stub has no such endpoint" });
}
