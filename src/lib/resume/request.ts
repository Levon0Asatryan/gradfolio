import type { ResumeRequest } from "@/lib/api/types";

export const RESUME_SECTIONS = [
  "contact",
  "bio",
  "education",
  "experience",
  "projects",
  "skills",
  "certifications",
] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isResumeRequest(value: unknown): value is ResumeRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    Object.keys(v).every((k) =>
      ["sections", "language", "projectIds", "includePrivateProjects"].includes(k),
    ) &&
    Array.isArray(v.sections) &&
    v.sections.length <= RESUME_SECTIONS.length &&
    v.sections.every(
      (s) => typeof s === "string" && (RESUME_SECTIONS as readonly string[]).includes(s),
    ) &&
    new Set(v.sections).size === v.sections.length &&
    (v.language === undefined ||
      (typeof v.language === "string" && ["en", "ru", "am"].includes(v.language))) &&
    (v.includePrivateProjects === undefined || typeof v.includePrivateProjects === "boolean") &&
    (v.projectIds === undefined ||
      (Array.isArray(v.projectIds) &&
        v.projectIds.length <= 50 &&
        v.projectIds.every((id) => typeof id === "string" && UUID.test(id)) &&
        new Set(v.projectIds).size === v.projectIds.length))
  );
}
