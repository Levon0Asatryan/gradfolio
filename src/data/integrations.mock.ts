/**
 * Mock data and types for Integrations feature.
 * Strongly typed and used by the Integrations page with local state only.
 */

export type IntegrationId = "linkedin" | "github";

export type IntegrationStatus = "connected" | "not_connected";

export interface Integration {
  id: IntegrationId;
  name: string;
  description: string;
  status: IntegrationStatus;
  lastSyncedAt?: string;
}

/**
 * Initial mock dataset for the two supported integrations.
 */
export const integrationsMock: Integration[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    description:
      "Import education, experience, certifications, and skills. Enables profile verification.",
    status: "not_connected",
  },
  {
    id: "github",
    name: "GitHub",
    description:
      "Import repositories to create project entries. Verifies coding projects on your portfolio.",
    status: "connected",
    lastSyncedAt: "2025-01-15T10:00:00.000Z",
  },
];
