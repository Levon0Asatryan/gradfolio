"use server";

import {
  ApiError,
  addExternalTeamMember,
  inviteTeamMember,
  leaveProjectTeam,
  removeTeamMember,
} from "@/lib/api/client";
import { type TeamField, type TeamFieldError, parseExternal, parseRole } from "./form";

export type TeamResult =
  { ok: true } | { ok: false; code: string; field?: TeamField; error?: TeamFieldError };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalid: TeamResult = { ok: false, code: "VALIDATION_FAILED" };
const isId = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

async function run(fn: () => Promise<unknown>): Promise<TeamResult> {
  try {
    await fn();
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, code: error.code };
    throw error;
  }
}

/**
 * Every team action is a public endpoint: it takes no user id (the Auth0 session decides who
 * writes; the API's 404 refuses anyone but the owner), only ids and text, checked first.
 */
export async function inviteAction(
  projectId: unknown,
  userId: unknown,
  role: unknown,
): Promise<TeamResult> {
  if (!isId(projectId) || !isId(userId)) return invalid;
  const parsed = parseRole(role);
  if ("error" in parsed)
    return { ok: false, code: "VALIDATION_FAILED", field: "role", error: parsed.error };
  return run(() => inviteTeamMember(projectId, { userId, role: parsed.role }));
}

export async function addExternalAction(
  projectId: unknown,
  name: unknown,
  role: unknown,
): Promise<TeamResult> {
  if (!isId(projectId)) return invalid;
  const parsed = parseExternal(name, role);
  if ("error" in parsed) return { ok: false, code: "VALIDATION_FAILED", ...parsed };
  return run(() => addExternalTeamMember(projectId, { name: parsed.name, role: parsed.role }));
}

export async function removeMemberAction(
  projectId: unknown,
  memberId: unknown,
): Promise<TeamResult> {
  if (!isId(projectId) || !isId(memberId)) return invalid;
  return run(() => removeTeamMember(projectId, memberId));
}

export async function leaveAction(projectId: unknown): Promise<TeamResult> {
  if (!isId(projectId)) return invalid;
  return run(() => leaveProjectTeam(projectId));
}
