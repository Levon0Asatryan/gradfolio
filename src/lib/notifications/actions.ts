"use server";

import {
  ApiError,
  markAllNotificationsRead,
  markNotificationRead,
  respondToInvitation,
} from "@/lib/api/client";

export type MarkResult = { ok: true } | { ok: false; code: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function run(fn: () => Promise<unknown>): Promise<MarkResult> {
  try {
    await fn();
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, code: error.code };
    throw error;
  }
}

/**
 * Mark one of the caller's notifications read. A public endpoint: it takes the
 * notification id and no user id (the session decides whose it must be; the API
 * answers 404 for anyone else's).
 */
export async function markNotificationReadAction(id: unknown): Promise<MarkResult> {
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, code: "VALIDATION_FAILED" };
  return run(() => markNotificationRead(id));
}

export async function markAllNotificationsReadAction(): Promise<MarkResult> {
  return run(() => markAllNotificationsRead());
}

/**
 * Accept or reject the caller's own invitation to a project. No user id is taken (the session
 * decides whose invitation it is; anyone else's is the API's 404), and the decision is a fixed word.
 */
export async function respondToInviteAction(
  projectId: unknown,
  decision: unknown,
): Promise<MarkResult> {
  if (typeof projectId !== "string" || !UUID.test(projectId))
    return { ok: false, code: "VALIDATION_FAILED" };
  if (decision !== "accept" && decision !== "reject")
    return { ok: false, code: "VALIDATION_FAILED" };
  return run(() => respondToInvitation(projectId, decision));
}
