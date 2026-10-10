import "server-only";
import { AccessTokenError, AccessTokenErrorCode } from "@auth0/nextjs-auth0/errors";
import { auth0 } from "@/lib/auth0";
import type { Section } from "@/lib/profile/sections";
import type {
  Me,
  Profile,
  ProfileHeader,
  ProfileHeaderPatch,
  AttachmentBody,
  AttachmentPatch,
  ProjectAttachment,
  ProjectDetail,
  ProjectListQuery,
  UploadRequest,
  UploadTicket,
  ProjectWriteBody,
  ProjectPage,
  NotificationPage,
  UnreadCount,
  TeamMember,
  LookupUser,
  MyTeams,
} from "./types";

/**
 * gradfolio-api, called from this app's server only (Q11): the access token
 * never reaches the browser. Every failure becomes an ApiError with the API's
 * stable `code` (its error envelope is `{ code, message }`), or one of ours
 * for failures that never reached the API.
 */

/** Codes produced here, before or instead of an API answer. */
const LOCAL_CODES = {
  notConfigured: "API_NOT_CONFIGURED",
  unreachable: "API_UNREACHABLE",
  unauthenticated: "UNAUTHENTICATED",
  unknown: "UNKNOWN_ERROR",
} as const;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** `VALIDATION_FAILED` only: which fields the API refused, `{ path, message }[]`. */
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TIMEOUT_MS = 10_000;

function isEnvelope(value: unknown): value is { code: string; message: string; details?: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { code?: unknown }).code === "string" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}

/**
 * The session's access token. `null` only for a visitor with no session at all
 * (and only when the caller allows it); an expired session, a lost refresh token
 * or any other failure is never anonymous: the user must sign in again.
 */
async function accessToken(allowAnonymous: boolean): Promise<string | null> {
  try {
    const { token } = await auth0.getAccessToken();
    return token;
  } catch (error) {
    if (error instanceof AccessTokenError) {
      if (allowAnonymous && error.code === AccessTokenErrorCode.MISSING_SESSION) return null;
      throw new ApiError(401, LOCAL_CODES.unauthenticated, "sign in again");
    }
    throw error;
  }
}

/** The API's user ids are UUIDs; anything else is never sent (no path tricks like `..`). */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Call {
  method: "GET" | "PATCH" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  /** `optional`: send the token when there is a session, read anonymously otherwise. */
  auth?: "required" | "optional";
}

async function request<T>({ method, path, body, auth = "required" }: Call): Promise<T> {
  const base = process.env.API_BASE_URL;
  if (!base) throw new ApiError(503, LOCAL_CODES.notConfigured, "API_BASE_URL is not set");

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = await accessToken(auth === "optional");
  if (token !== null) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(new URL(path, base), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(503, LOCAL_CODES.unreachable, "the API did not answer");
  }

  const parsed: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    if (isEnvelope(parsed))
      throw new ApiError(response.status, parsed.code, parsed.message, parsed.details);
    throw new ApiError(response.status, LOCAL_CODES.unknown, `HTTP ${response.status}`);
  }
  return parsed as T;
}

/** The signed-in user's account; the API creates it on the first call. */
export function getMe(): Promise<Me> {
  return request<Me>({ method: "GET", path: "/v1/me" });
}

/**
 * Anyone's profile. Sends the token when there is a session, so the owner sees
 * their own private profile and `isOwner`; a visitor reads public ones. A private
 * profile is a 404 for everyone else, as an unknown id is.
 */
export async function getProfile(id: string): Promise<Profile> {
  if (!UUID.test(id)) throw new ApiError(404, "NOT_FOUND", "no such profile");
  return request<Profile>({ method: "GET", path: `/v1/users/${id}`, auth: "optional" });
}

export function getMyProfile(): Promise<ProfileHeader> {
  return request<ProfileHeader>({ method: "GET", path: "/v1/me/profile" });
}

export function updateMyProfile(patch: ProfileHeaderPatch): Promise<ProfileHeader> {
  return request<ProfileHeader>({ method: "PATCH", path: "/v1/me/profile", body: patch });
}

export function completeOnboarding(): Promise<{ onboarded: true }> {
  return request<{ onboarded: true }>({ method: "POST", path: "/v1/me/onboarding/complete" });
}

/**
 * One project. Sends the token when there is a session: the owner reads their own
 * private or draft project, everyone else gets a 404 for it, as for an unknown id (Q3).
 */
export async function getProject(id: string): Promise<ProjectDetail> {
  if (!UUID.test(id)) throw new ApiError(404, "NOT_FOUND", "no such project");
  return request<ProjectDetail>({ method: "GET", path: `/v1/projects/${id}`, auth: "optional" });
}

/** A new project; the API sanitizes `descriptionHtml` and answers with what it kept. */
export function createProject(body: ProjectWriteBody): Promise<ProjectDetail> {
  return request<ProjectDetail>({ method: "POST", path: "/v1/projects", body });
}

/** Change fields of the caller's project. Someone else's project is the API's 404. */
export async function updateProject(
  id: string,
  body: Partial<ProjectWriteBody>,
): Promise<ProjectDetail> {
  if (!UUID.test(id)) throw new ApiError(404, "NOT_FOUND", "no such project");
  return request<ProjectDetail>({ method: "PATCH", path: `/v1/projects/${id}`, body });
}

export async function deleteProject(id: string): Promise<void> {
  if (!UUID.test(id)) throw new ApiError(404, "NOT_FOUND", "no such project");
  await request<undefined>({ method: "DELETE", path: `/v1/projects/${id}` });
}

const attachmentPath = (projectId: string, attachmentId?: string): string => {
  if (!UUID.test(projectId) || (attachmentId !== undefined && !UUID.test(attachmentId))) {
    throw new ApiError(404, "NOT_FOUND", "no such attachment");
  }
  const base = `/v1/projects/${projectId}/attachments`;
  return attachmentId ? `${base}/${attachmentId}` : base;
};

export async function addAttachment(
  projectId: string,
  body: AttachmentBody,
): Promise<ProjectAttachment> {
  return request<ProjectAttachment>({ method: "POST", path: attachmentPath(projectId), body });
}

export async function updateAttachment(
  projectId: string,
  attachmentId: string,
  body: AttachmentPatch,
): Promise<ProjectAttachment> {
  return request<ProjectAttachment>({
    method: "PATCH",
    path: attachmentPath(projectId, attachmentId),
    body,
  });
}

export async function deleteAttachment(projectId: string, attachmentId: string): Promise<void> {
  await request<undefined>({ method: "DELETE", path: attachmentPath(projectId, attachmentId) });
}

/** `ids` is every attachment of the project in its new order. */
export async function reorderAttachments(
  projectId: string,
  ids: string[],
): Promise<ProjectAttachment[]> {
  if (!UUID.test(projectId)) throw new ApiError(404, "NOT_FOUND", "no such project");
  return request<ProjectAttachment[]>({
    method: "PUT",
    path: `/v1/projects/${projectId}/attachments/order`,
    body: { ids },
  });
}

/** A signed PUT for one file. The browser uploads straight to storage; the token stays here (Q11). */
export function createUpload(body: UploadRequest): Promise<UploadTicket> {
  return request<UploadTicket>({ method: "POST", path: "/v1/me/uploads", body });
}

/** The caller's own projects, every state; one page, keyset-paginated by `cursor`. */
export function listMyProjects(query: ProjectListQuery = {}): Promise<ProjectPage> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return request<ProjectPage>({ method: "GET", path: `/v1/me/projects${qs ? `?${qs}` : ""}` });
}

/** Section entries (education, experience, certifications): `/v1/me/<section>`. */
const entryId = (id: string): string => {
  if (!UUID.test(id)) throw new ApiError(404, "NOT_FOUND", "no such entry");
  return id;
};

export function createEntry(section: Section, body: Record<string, unknown>): Promise<unknown> {
  return request({ method: "POST", path: `/v1/me/${section}`, body });
}

export async function updateEntry(
  section: Section,
  id: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  return request({ method: "PATCH", path: `/v1/me/${section}/${entryId(id)}`, body });
}

export async function deleteEntry(section: Section, id: string): Promise<void> {
  await request({ method: "DELETE", path: `/v1/me/${section}/${entryId(id)}` });
}

/** `ids`: exactly the caller's entries in the new order (409 ORDER_STALE if the list is incomplete). */
export function reorderEntries(section: Section, ids: string[]): Promise<unknown> {
  return request({ method: "PUT", path: `/v1/me/${section}/order`, body: { ids } });
}

export function replaceSkills(skills: string[]): Promise<{ skills: string[] }> {
  return request({ method: "PUT", path: "/v1/me/skills", body: { skills } });
}

/** Deletes the caller's account and all its data (`deleteMe`). The login itself stays: sign out afterwards. */
export async function deleteMe(): Promise<void> {
  await request({ method: "DELETE", path: "/v1/me" });
}

/** The caller's notifications, newest first; one keyset page. */
export function listNotifications(
  query: { limit?: number; cursor?: string } = {},
): Promise<NotificationPage> {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.cursor) params.set("cursor", query.cursor);
  const qs = params.toString();
  return request<NotificationPage>({
    method: "GET",
    path: `/v1/me/notifications${qs ? `?${qs}` : ""}`,
  });
}

export function getUnreadNotificationCount(): Promise<UnreadCount> {
  return request<UnreadCount>({ method: "GET", path: "/v1/me/notifications/unread-count" });
}

/** Someone else's notification is the API's 404, as an unknown id is. */
export async function markNotificationRead(id: string): Promise<void> {
  if (!UUID.test(id)) throw new ApiError(404, "NOT_FOUND", "no such notification");
  await request<undefined>({ method: "POST", path: `/v1/me/notifications/${id}/read` });
}

export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return request<{ updated: number }>({ method: "POST", path: "/v1/me/notifications/read-all" });
}

/** The invitee answers an invitation. Addressed by project id; the caller is the session's user. */
export async function respondToInvitation(
  projectId: string,
  decision: "accept" | "reject",
): Promise<void> {
  if (!UUID.test(projectId)) throw new ApiError(404, "NOT_FOUND", "no such invitation");
  await request({ method: "POST", path: `/v1/projects/${projectId}/team/me/${decision}` });
}

const teamPath = (projectId: string, tail = ""): string => {
  if (!UUID.test(projectId)) throw new ApiError(404, "NOT_FOUND", "no such project");
  return `/v1/projects/${projectId}/team${tail}`;
};

/** The owner's view of the team: every status. Anyone else gets the API's 404. */
export async function listProjectTeam(projectId: string): Promise<TeamMember[]> {
  const page = await request<{ items: TeamMember[] }>({ method: "GET", path: teamPath(projectId) });
  return page.items;
}

export function inviteTeamMember(
  projectId: string,
  body: { userId: string; role?: string | null },
): Promise<TeamMember> {
  return request<TeamMember>({ method: "POST", path: teamPath(projectId), body });
}

export function addExternalTeamMember(
  projectId: string,
  body: { name: string; role?: string | null },
): Promise<TeamMember> {
  return request<TeamMember>({ method: "POST", path: teamPath(projectId, "/external"), body });
}

export async function removeTeamMember(projectId: string, memberId: string): Promise<void> {
  if (!UUID.test(memberId)) throw new ApiError(404, "NOT_FOUND", "no such member");
  await request<undefined>({ method: "DELETE", path: teamPath(projectId, `/${memberId}`) });
}

/** An accepted teammate leaves; the owner is told. */
export async function leaveProjectTeam(projectId: string): Promise<void> {
  await request<undefined>({ method: "DELETE", path: teamPath(projectId, "/me") });
}

/** People to invite: public profiles by name prefix (3 to 50 characters). */
export async function lookupUsers(q: string): Promise<LookupUser[]> {
  const page = await request<{ items: LookupUser[] }>({
    method: "GET",
    path: `/v1/users/lookup?q=${encodeURIComponent(q)}`,
  });
  return page.items;
}

/** The cursors the four lists of `GET /v1/me/teams` take; pass only the one being extended. */
export interface TeamsQuery {
  limit?: number;
  ownedCursor?: string;
  memberCursor?: string;
  incomingCursor?: string;
  outgoingCursor?: string;
}

/** The caller's invitations, owned teams and joined teams. Always the caller's own. */
export function getMyTeams(query: TeamsQuery = {}): Promise<MyTeams> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return request<MyTeams>({ method: "GET", path: `/v1/me/teams${qs ? `?${qs}` : ""}` });
}
