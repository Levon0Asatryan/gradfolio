import type { Activity, DashboardStats, Project } from "@/utils/types/dashboard.types";

export const projectsMock: Project[] = [
  {
    id: "ecoroute",
    title: "EcoRoute – CO₂-aware Navigation",
    description:
      "A Next.js web app that finds eco-friendly driving routes using OpenStreetMap data.",
    status: "ongoing",
    technologies: ["Next.js", "TypeScript", "Mapbox"],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "smart-garden-iot",
    title: "Smart Garden IoT System",
    description:
      "An Arduino + Raspberry Pi system automating irrigation with real-time soil moisture monitoring.",
    status: "completed",
    technologies: ["Arduino", "Raspberry Pi", "MQTT"],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "paper-summarizer",
    title: "Paper Summarizer (NLP)",
    description: "Extractive + abstractive summarization for arXiv PDFs built with PyTorch.",
    status: "completed",
    technologies: ["Python", "PyTorch", "FastAPI"],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
];

export const activitiesMock: Activity[] = [
  {
    id: "act-2",
    type: "project",
    action: 'Updated project "Academic Portfolio Platform"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "act-3",
    type: "profile",
    action: "Profile viewed 18 times",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
  },
];

export const statsMock: DashboardStats = {
  totalProjects: projectsMock.length,
  githubStars: 48,
  linkedinConnections: 342,
  recentActivities: activitiesMock.length,
};
