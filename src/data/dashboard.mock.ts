import type { Activity, DashboardStats, Project } from "@/utils/types/dashboard.types";

export const projectsMock: Project[] = [
  {
    id: "ecoroute",
    title: "EcoRoute – CO₂-aware Navigation",
    description:
      "A Next.js web app that finds eco-friendly driving routes using OpenStreetMap data.",
    status: "ongoing",
    technologies: ["Next.js", "TypeScript", "Mapbox"],
    lastUpdated: "2025-12-06T09:00:00.000Z", // 12 hours ago from reference
  },
  {
    id: "smart-garden-iot",
    title: "Smart Garden IoT System",
    description:
      "An Arduino + Raspberry Pi system automating irrigation with real-time soil moisture monitoring.",
    status: "completed",
    technologies: ["Arduino", "Raspberry Pi", "MQTT"],
    lastUpdated: "2025-11-29T21:00:00.000Z", // 7 days ago from reference
  },
  {
    id: "paper-summarizer",
    title: "Paper Summarizer (NLP)",
    description: "Extractive + abstractive summarization for arXiv PDFs built with PyTorch.",
    status: "completed",
    technologies: ["Python", "PyTorch", "FastAPI"],
    lastUpdated: "2025-11-16T21:00:00.000Z", // 20 days ago from reference
  },
];

export const activitiesMock: Activity[] = [
  {
    id: "act-2",
    type: "project",
    translationKey: "projectUpdated",
    translationParams: { name: "Academic Portfolio Platform" },
    timestamp: "2025-12-06T18:00:00.000Z", // 3 hours ago from reference
  },
  {
    id: "act-3",
    type: "profile",
    translationKey: "profileViewed",
    translationParams: { count: 18 },
    timestamp: "2025-12-06T12:00:00.000Z", // 9 hours ago from reference
  },
];

export const statsMock: DashboardStats = {
  totalProjects: projectsMock.length,
  githubStars: 48,
  linkedinConnections: 342,
  recentActivities: activitiesMock.length,
};
