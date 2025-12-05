import type { Activity, DashboardStats, Project, Publication } from "@/utils/types/dashboard.types";

export const publicationsMock: Publication[] = [
  {
    id: "pub-1",
    title: "Deep Learning Approaches for Time Series Forecasting",
    journal: "IEEE Transactions on Neural Networks",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    authors: ["A. Smith", "J. Doe"],
    status: "published",
  },
  {
    id: "pub-2",
    title: "Graph-based Methods in Bioinformatics",
    journal: "Bioinformatics Journal",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    authors: ["L. Zhang", "K. Patel"],
    status: "inReview",
  },
  {
    id: "pub-3",
    title: "A Survey on Explainable AI",
    journal: "ACM Computing Surveys",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    authors: ["M. Rossi"],
    status: "draft",
  },
];

export const projectsMock: Project[] = [
  {
    id: "proj-1",
    title: "Academic Portfolio Platform",
    description: "Building a Next.js + MUI dashboard for academic portfolios.",
    status: "ongoing",
    technologies: ["Next.js", "TypeScript", "MUI"],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "proj-2",
    title: "NLP for Literature Review",
    description: "Automated keyword extraction and topic modeling.",
    status: "completed",
    technologies: ["Python", "spaCy", "LDA"],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "proj-3",
    title: "Research Data Visualizer",
    description: "Interactive charts and dashboards for publication metrics.",
    status: "archived",
    technologies: ["D3.js", "React"],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: "proj-4",
    title: "Lab Equipment Tracker",
    description: "Track usage and maintenance of lab equipment.",
    status: "ongoing",
    technologies: ["Node.js", "MongoDB"],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export const activitiesMock: Activity[] = [
  {
    id: "act-1",
    type: "publication",
    action: 'Added publication "Deep Learning Approaches for Time Series Forecasting"',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
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
  totalPublications: publicationsMock.length,
  totalProjects: projectsMock.length,
  profileViews: 1287,
  recentActivities: activitiesMock.length,
};
