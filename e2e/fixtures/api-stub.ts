/**
 * A stand-in for gradfolio-api's public discovery endpoints, so the anonymous browser specs
 * can run in CI with results, empty and error states and no database. Run by
 * `playwright.config.ts` (Node strips the types). It is a fixture, not the contract: every
 * body is typed with the app's own API types, so a change to them fails the type check
 * instead of the browser run. The real API is exercised by the verification record's runs.
 *
 * Magic queries: `iot` has results in both groups and more in people; `ml` has a short
 * list; `nothing` is empty; `limited` is a 429; `boom` is a 503; `long` has a project title, a
 * summary and a headline too long for their cards (cropped text) beside short ones. Any path it
 * does not know answers 503, so a page that depends on another endpoint shows its error state.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type {
  GithubRepo,
  ProjectDetail,
  Integrations,
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
  source: "manual",
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

/** Longer than two lines of a card title, three of a summary, two of a headline, at any width. */
const LONG = {
  title:
    "Distributed soil moisture monitoring for terraced vineyards in the Ararat valley, with LoRa sensor nodes and a solar-powered gateway",
  summary:
    "Forty sensor nodes report soil moisture, temperature and salinity every ten minutes over LoRa to a solar-powered gateway, which forwards them over MQTT to a dashboard that warns the farmer before a terrace dries out, and keeps a season of history for comparing irrigation schedules.",
  headline:
    "Embedded systems student building low-power sensor networks for agriculture, with a side interest in long-range radio, MQTT brokers and solar power budgets",
};

const TAGS: Record<string, TagSummary> = {
  iot: { name: "IoT", projectCount: 14, peopleCount: 9 },
  ml: { name: "ML", projectCount: 5, peopleCount: 7 },
  "c#": { name: "C#", projectCount: 3, peopleCount: 4 },
  "ci/cd": { name: "CI/CD", projectCount: 1, peopleCount: 1 },
  // A tag whose own name contains an escape sequence: it must stay one tag.
  "c%23": { name: "C%23", projectCount: 1, peopleCount: 1 },
};

/**
 * The integrations endpoints, keyed by the bearer token so each test owns its state (the
 * logged-in specs mint a session whose access token names the scenario, e2e/integrations.spec.ts):
 * `e2e-off-*` GitHub not connected; `e2e-on-*` connected; `e2e-on502-*` connected, and
 * disconnecting answers 502 after the grant is gone (the ambiguous case); `e2e-unavailable-*`
 * the server has no GitHub config; `e2e-down-*` the load fails; `e2e-inuse-*` connect answers 409
 * GITHUB_ACCOUNT_IN_USE.
 */
const github = new Map<string, Integrations["github"]>();
const githubFor = (token: string): Integrations["github"] => {
  let state = github.get(token);
  if (!state) {
    const on = /^e2e-on(502|rl|empty|err)?-/.test(token);
    state = {
      available: !token.startsWith("e2e-unavailable-"),
      status: on ? "connected" : "not_connected",
      login: on ? "ani-p" : null,
      lastSyncedAt: on ? "2026-10-09T12:00:00.000Z" : null,
    };
    github.set(token, state);
  }
  return state;
};

const seen: Array<{
  method?: string;
  path: string;
  search: string;
  headers: Record<string, string | undefined>;
}> = [];

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
    method: req.method,
    path: url.pathname,
    search: url.search,
    headers: {
      authorization: req.headers.authorization,
      "x-client-ip": req.headers["x-client-ip"] as string | undefined,
      "x-gradfolio-proxy-secret": req.headers["x-gradfolio-proxy-secret"] as string | undefined,
    },
  });

  if (url.pathname === "/__requests") return send(res, 200, seen);
  if (url.pathname === "/__suggestions") {
    const only = url.searchParams.get("token");
    return send(res, 200, {
      accepted: SUGGESTION_ACCEPTED.filter((x) => x.token === only).map((x) => x.id),
      dismissed: SUGGESTION_DISMISSED.filter((x) => x.token === only).map((x) => x.id),
    });
  }
  if (url.pathname === "/__imports") {
    const only = url.searchParams.get("token");
    return send(
      res,
      200,
      importBodies.filter((b) => !only || b.token === only),
    );
  }
  if (url.pathname === "/__reset") {
    seen.length = 0;
    return send(res, 200, {});
  }

  if (url.pathname.startsWith("/v1/me/integrations")) return integrations(req, res, url.pathname);
  if (url.pathname.startsWith("/v1/me/suggestions")) return suggestions(req, res, url.pathname);
  if (url.pathname === "/v1/me" || url.pathname === "/v1/me/profile")
    return account(req, res, url.pathname);
  if (
    url.pathname.startsWith("/v1/me/github/") ||
    /^\/v1\/me\/projects\/[^/]+\/github\/sync$/.test(url.pathname)
  )
    return githubData(req, res, url);
  if (url.pathname.startsWith("/v1/projects/5c1d9a3e-0000-4000-8000-"))
    return githubProject(req, res, url.pathname);

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
      q === "long"
        ? {
            query: q,
            people: {
              items: [person(0, { headline: LONG.headline }), person(1)],
              hasMore: false,
            },
            projects: {
              items: [project(0, { title: LONG.title, summary: LONG.summary }), project(1)],
              hasMore: false,
            },
          }
        : q === "nothing"
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

function integrations(req: IncomingMessage, res: ServerResponse, path: string) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  if (!token) return send(res, 401, { code: "UNAUTHENTICATED", message: "no token" });
  if (token.startsWith("e2e-down-"))
    return send(res, 503, { code: "DATABASE_UNAVAILABLE", message: "down" });
  const state = githubFor(token);

  if (path === "/v1/me/integrations" && req.method === "GET") {
    const body: Integrations = {
      github: { ...state },
      linkedin: { status: "not_connected", lastSyncedAt: null },
    };
    return send(res, 200, body);
  }
  if (path === "/v1/me/integrations/github/connect" && req.method === "POST") {
    if (!state.available)
      return send(res, 503, { code: "INTEGRATION_UNAVAILABLE", message: "not configured" });
    if (token.startsWith("e2e-inuse-"))
      return send(res, 409, { code: "GITHUB_ACCOUNT_IN_USE", message: "taken" });
    if (state.status === "connected")
      return send(res, 200, { state: "connected", login: state.login ?? "ani-p" });
    return send(res, 200, {
      state: "link_required",
      nonce: "stub-nonce",
      expiresAt: "2026-10-15T10:10:00.000Z",
    });
  }
  if (path === "/v1/me/integrations/github" && req.method === "DELETE") {
    if (token.startsWith("e2e-on502-")) {
      if (state.status === "not_connected")
        return send(res, 409, { code: "GITHUB_LINK_IN_PROGRESS", message: "settling" });
      // The grant is gone at GitHub, but the answer was lost: the card now reads not connected.
      state.status = "not_connected";
      state.login = null;
      state.lastSyncedAt = null;
      return send(res, 502, { code: "GITHUB_REVOKE_FAILED", message: "unknown outcome" });
    }
    state.status = "not_connected";
    state.login = null;
    state.lastSyncedAt = null;
    return send(res, 200, { status: "not_connected" });
  }
  return send(res, 404, { code: "NOT_FOUND", message: "the stub has no such endpoint" });
}

/**
 * The account endpoints for the delete-account spec. Like production (m2-plan Q7), a valid token
 * with no account **creates a new empty one** on `GET /v1/me`. Scenario by token prefix:
 * `e2e-del-*` deletes with 204; `e2e-delfail-*` answers 502 GITHUB_REVOKE_FAILED.
 */
const deletedAccounts = new Map<string, number>();
function account(req: IncomingMessage, res: ServerResponse, path: string) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  if (!token) return send(res, 401, { code: "UNAUTHENTICATED", message: "no token" });
  if (path === "/v1/me" && req.method === "DELETE") {
    if (token.startsWith("e2e-delfail-"))
      return send(res, 502, { code: "GITHUB_REVOKE_FAILED", message: "no" });
    deletedAccounts.set(token, (deletedAccounts.get(token) ?? 0) + 1);
    res.writeHead(204);
    return res.end();
  }
  if (path === "/v1/me") {
    return send(res, 200, {
      id: "0b6f2c1e-1111-4222-8333-444455556666",
      name: "Ani Petrosyan",
      email: "ani@example.com",
      avatarUrl: null,
      headline: "",
      verified: true,
      isPublic: true,
      // A brand-new account after a delete is not onboarded.
      onboarded: !deletedAccounts.has(token),
      identities: ["auth0"],
    });
  }
  return send(res, 200, {
    isPublic: true,
    contactEmail: null,
    name: "Ani Petrosyan",
    headline: "",
    bio: "",
    location: "",
    avatarUrl: null,
    links: { github: null, linkedin: null, twitter: null, website: null },
  });
}

/**
 * GitHub repositories and import (docs/m7-plan.md section 4), keyed by the bearer token like the
 * integrations: `e2e-on-*` a normal account; `e2e-onrl-*` the GitHub limit is reached (429);
 * `e2e-onempty-*` no public repositories; `e2e-onerr-*` GitHub fails (502).
 * Repository 3 is already imported. `q` filters by name; the first page has a cursor.
 */
const REPOS: GithubRepo[] = Array.from({ length: 5 }, (_, i) => ({
  repoId: i + 1,
  fullName: `ani-p/${["thesis-tracker", "smart-garden", "dotfiles", "ml-notes", "c-sharp-labs"][i]}`,
  description:
    i === 4
      ? null
      : `Repository ${i + 1}: ${"a long description that wraps. ".repeat(i === 1 ? 6 : 1)}`,
  language: ["TypeScript", "C++", "Shell", "Python", null][i] ?? null,
  stars: i * 3,
  forks: i,
  fork: false,
  archived: false,
  pushedAt: "2026-10-01T10:00:00.000Z",
  imported: i === 2,
  projectId: i === 2 ? "5c1d9a3e-0000-4000-8000-000000000003" : null,
}));
const importBodies: Array<{ token: string; repoIds: number[]; overrides?: unknown }> = [];

function githubData(req: IncomingMessage, res: ServerResponse, url: URL) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  if (!token) return send(res, 401, { code: "UNAUTHENTICATED", message: "no token" });
  const rateLimit = { remaining: 4000, resetsAt: "2026-10-16T10:30:00.000Z" };
  if (url.pathname === "/v1/me/github/repos") {
    if (token.startsWith("e2e-onrl-"))
      return send(res, 429, { code: "GITHUB_RATE_LIMITED", message: "limit" });
    if (token.startsWith("e2e-onerr-"))
      return send(res, 502, { code: "GITHUB_UNAVAILABLE", message: "down" });
    if (token.startsWith("e2e-onempty-"))
      return send(res, 200, { items: [], nextCursor: null, rateLimit });
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const all = REPOS.filter((r) => !q || r.fullName.toLowerCase().includes(q));
    const cursor = url.searchParams.get("cursor");
    return send(res, 200, {
      items: cursor ? all.slice(3) : all.slice(0, 3),
      nextCursor: !cursor && all.length > 3 ? "page-2" : null,
      rateLimit,
    });
  }
  if (url.pathname === "/v1/me/github/import/preview" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw) as { repoIds: number[] };
      send(res, 200, {
        results: body.repoIds.map((id) => {
          const repo = REPOS.find((r) => r.repoId === id);
          const name = repo?.fullName.split("/")[1] ?? String(id);
          if (id === 3)
            return {
              repoId: id,
              outcome: "exists",
              reason: null,
              projectId: "5c1d9a3e-0000-4000-8000-000000000003",
              draft: null,
              notes: [],
            };
          if (id === 5)
            return {
              repoId: id,
              outcome: "skipped",
              reason: "not_owner",
              projectId: null,
              draft: null,
              notes: [],
            };
          return {
            repoId: id,
            outcome: "draft",
            reason: null,
            projectId: null,
            draft: {
              title: name,
              summary: repo?.description?.trim() ?? null,
              descriptionHtml: `<h1>${name}</h1><p>README of ${name}, cleaned by the server.</p>`,
              technologies: repo?.language ? [repo.language] : [],
              links: [],
              repoUrl: `https://github.com/${repo?.fullName ?? ""}`,
              isPublic: true,
            },
            notes: [],
          };
        }),
        rateLimit,
      });
    });
    return;
  }
  if (url.pathname === "/v1/me/github/import" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw) as { repoIds: number[] };
      importBodies.push({ token, ...body });
      send(res, 200, {
        results: body.repoIds.map((id) =>
          id === 3
            ? {
                repoId: id,
                outcome: "exists",
                reason: null,
                projectId: "5c1d9a3e-0000-4000-8000-000000000003",
                notes: [],
              }
            : id === 5
              ? { repoId: id, outcome: "skipped", reason: "not_owner", projectId: null, notes: [] }
              : {
                  repoId: id,
                  outcome: "created",
                  reason: null,
                  projectId: `5c1d9a3e-0000-4000-8000-00000000000${id}`,
                  notes: [],
                },
        ),
        rateLimit,
      });
    });
    return;
  }
  // Re-sync: a dry run reports; the real call returns the same fields with dryRun false.
  const dry = url.searchParams.get("dryRun") === "true";
  return send(res, 200, {
    dryRun: dry,
    fields: [
      { field: "title", outcome: "unchanged" },
      { field: "summary", outcome: "updated" },
      { field: "technologies", outcome: "kept" },
      { field: "descriptionHtml", outcome: "conflict", githubValue: "GitHub's newer README" },
      { field: "repoUrl", outcome: "unchanged" },
    ],
    systemUpdated: [{ field: "stars", value: 12 }],
  });
}

/** An owner's GitHub-imported project page; id `...0003` is the one the repo list marks imported. */
function githubProject(req: IncomingMessage, res: ServerResponse, path: string) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  if (!token) return send(res, 404, { code: "NOT_FOUND", message: "no" });
  if (path.endsWith("/team")) return send(res, 200, { items: [], nextCursor: null });
  const id = path.split("/")[3] ?? "";
  // Publish / move back to drafts: `PATCH { isDraft }`, state kept per token and project. The
  // project ending in `4` is refused with reasons, like a project the API will not publish.
  const key = `${token}:${id}`;
  if (req.method === "PATCH") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (id.endsWith("4"))
        return send(res, 400, {
          code: "VALIDATION_FAILED",
          message: "invalid",
          details: [{ path: ["summary"], message: "A published project needs a summary" }],
        });
      const patch = JSON.parse(raw) as { isDraft?: boolean };
      if (typeof patch.isDraft === "boolean") projectDraft.set(key, patch.isDraft);
      send(res, 200, projectBody(id, projectDraft.get(key) ?? true));
    });
    return;
  }
  return send(res, 200, projectBody(id, projectDraft.get(key) ?? true));
}

const projectDraft = new Map<string, boolean>();
function projectBody(id: string, isDraft: boolean): ProjectDetail {
  const body: ProjectDetail = {
    id,
    title: "dotfiles",
    summary: "My shell setup",
    category: "personal",
    status: "ongoing",
    source: "github",
    heroImageUrl: null,
    tags: [],
    role: "owner",
    technologies: ["Shell"],
    isPublic: true,
    isDraft,
    isOwner: true,
    ownerId: "0b6f2c1e-1111-4222-8333-444455556666",
    metadata: { startDate: null, endDate: null, course: null, professor: null },
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    aiSummary: null,
    descriptionHtml: "<p>Imported README.</p>",
    liveDemoUrl: null,
    repo: {
      url: "https://github.com/ani-p/dotfiles",
      latestCommitDate: "2026-10-01",
      readmeUrl: "https://github.com/ani-p/dotfiles#readme",
      stars: 6,
      forks: 2,
      language: "Shell",
    },
    links: [],
    files: [],
    attachments: [],
    team: [],
    owner: { id: "0b6f2c1e-1111-4222-8333-444455556666", name: "Ani Petrosyan", avatarUrl: null },
  };
  return body;
}

/**
 * Profile suggestions from GitHub (API #82), keyed by token: one fill (bio, empty now) and one
 * replace (location). `accepted` / `dismissed` lists are exposed at /__suggestions for assertions.
 */
const SUGGESTION_ACCEPTED: Array<{ token: string; id: string }> = [];
const SUGGESTION_DISMISSED: Array<{ token: string; id: string }> = [];
const suggestionItems = () => [
  {
    id: "0b6f2c1e-1111-4222-8333-444455556661",
    kind: "profile.bio",
    source: "github",
    status: "open",
    field: "bio",
    current: null,
    proposed: "I build things",
    mode: "fill",
    lastSyncedAt: null,
    createdAt: "2026-10-16T10:00:00.000Z",
    resolvedAt: null,
  },
  {
    id: "0b6f2c1e-1111-4222-8333-444455556662",
    kind: "profile.location",
    source: "github",
    status: "open",
    field: "location",
    current: "Yerevan",
    proposed: "Gyumri",
    mode: "replace",
    lastSyncedAt: null,
    createdAt: "2026-10-16T10:00:00.000Z",
    resolvedAt: null,
  },
];
function suggestions(req: IncomingMessage, res: ServerResponse, path: string) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  if (!token) return send(res, 401, { code: "UNAUTHENTICATED", message: "no token" });
  const gone = new Set(
    [...SUGGESTION_ACCEPTED, ...SUGGESTION_DISMISSED]
      .filter((x) => x.token === token)
      .map((x) => x.id),
  );
  if (path === "/v1/me/suggestions/refresh")
    return send(res, 200, { github: "refreshed", nextAllowedAt: null, created: 2, openCount: 2 });
  if (path === "/v1/me/suggestions") {
    if (token.startsWith("e2e-onempty-"))
      return send(res, 200, { items: [], nextCursor: null, openCount: 0 });
    const items = suggestionItems().filter((i) => !gone.has(i.id));
    return send(res, 200, { items, nextCursor: null, openCount: items.length });
  }
  const m = /^\/v1\/me\/suggestions\/([^/]+)\/(accept|dismiss)$/.exec(path);
  if (m) {
    (m[2] === "accept" ? SUGGESTION_ACCEPTED : SUGGESTION_DISMISSED).push({ token, id: m[1]! });
    return send(res, 200, {
      id: m[1],
      status: m[2] === "accept" ? "accepted" : "dismissed",
      applied: null,
    });
  }
  return send(res, 404, { code: "NOT_FOUND", message: "no" });
}
