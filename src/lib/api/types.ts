import type { components, paths } from "./schema";

/**
 * The API's shapes, taken from the generated schema (Q5), so a contract change
 * is a type error here and not a wrong page. Importable from client components:
 * `client.ts` is server-only, this file is types.
 */
type Json<Op> = Op extends { responses: { 200: { content: { "application/json": infer B } } } }
  ? B
  : never;

/** The caller's account, `GET /v1/me` (openapi.yaml `getMe`). */
export type Me = Json<paths["/v1/me"]["get"]>;
/** A profile with its sections, `GET /v1/users/{id}` (`getProfile`). */
export type Profile = components["schemas"]["Profile"];
export type ProfileProject = components["schemas"]["ProfileProject"];
/** The editable header, `GET`/`PATCH /v1/me/profile`. */
export type ProfileHeader = components["schemas"]["ProfileHeader"];
export type ProfileHeaderPatch = NonNullable<
  paths["/v1/me/profile"]["patch"]["requestBody"]
>["content"]["application/json"];

export type Education = components["schemas"]["Education"];
export type Experience = components["schemas"]["Experience"];
export type Certification = components["schemas"]["Certification"];
export type ProfileLinks = components["schemas"]["ProfileLinks"];

/** A project in a list, `GET /v1/me/projects` (`listMyProjects`). */
export type ProjectSummary = components["schemas"]["ProjectSummary"];
/** A project with everything on its page, `GET /v1/projects/{id}` (`getProject`). */
export type ProjectDetail = components["schemas"]["ProjectDetail"];
export type ProjectPage = components["schemas"]["ProjectPage"];
export type ProjectAttachment = components["schemas"]["ProjectAttachment"];
export type ProjectTeamMember = components["schemas"]["ProjectTeamMember"];
/** The body of `POST /v1/projects`; `PATCH` takes any subset of it. */
export type ProjectWriteBody = NonNullable<
  paths["/v1/projects"]["post"]["requestBody"]
>["content"]["application/json"];
/** `POST /v1/projects/{id}/attachments`. */
export type AttachmentBody = NonNullable<
  paths["/v1/projects/{id}/attachments"]["post"]["requestBody"]
>["content"]["application/json"];
/** `PATCH /v1/projects/{id}/attachments/{attachmentId}`: `url` and/or `title`. */
export type AttachmentPatch = NonNullable<
  paths["/v1/projects/{id}/attachments/{attachmentId}"]["patch"]["requestBody"]
>["content"]["application/json"];
/** `POST /v1/me/uploads`. */
export type UploadRequest = NonNullable<
  paths["/v1/me/uploads"]["post"]["requestBody"]
>["content"]["application/json"];
export type UploadTicket = components["schemas"]["UploadTicket"];
/** The query of `listMyProjects`: what the list page and "load more" send. */
export type ProjectListQuery = NonNullable<paths["/v1/me/projects"]["get"]["parameters"]["query"]>;

/** One notification, `GET /v1/me/notifications`. Render the text from `type` + `params`. */
export type Notification = components["schemas"]["Notification"];
export type NotificationPage = components["schemas"]["NotificationPage"];
export type UnreadCount = components["schemas"]["UnreadCount"];
/** One row of a project's team, `GET /v1/projects/{id}/team` (owner only; every status). */
export type TeamMember = components["schemas"]["TeamMember"];
/** A person to invite, `GET /v1/users/lookup`. */
export type LookupUser = components["schemas"]["UserLookupResult"]["items"][number];

/** The caller's teams in one call, `GET /v1/me/teams`: four lists, each on its own cursor. */
export type MyTeams = components["schemas"]["MyTeams"];
export type IncomingInvite = components["schemas"]["IncomingInvite"];
export type OutgoingInvite = components["schemas"]["OutgoingInvite"];
