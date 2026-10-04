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
