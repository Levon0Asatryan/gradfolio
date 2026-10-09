import type { Notification } from "@/lib/api/types";

/** A notification as the API sends it; override what a test is about. */
export function notification(over: Partial<Notification> = {}): Notification {
  return {
    id: "0b6f2c1e-1111-4222-8333-444455556601",
    type: "team_accepted",
    title: "Ani joined Smart Campus",
    params: {
      actorId: "0b6f2c1e-1111-4222-8333-444455556699",
      actorName: "Ani",
      projectId: "0b6f2c1e-1111-4222-8333-444455556688",
      projectTitle: "Smart Campus",
      role: null,
    },
    read: false,
    createdAt: "2026-10-09T12:00:00.000Z",
    link: "/projects/0b6f2c1e-1111-4222-8333-444455556688",
    invite: null,
    ...over,
  };
}
