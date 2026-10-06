import type { ProjectCategory } from "@/components/theme/tokens";

export interface Project {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  status: "ongoing" | "completed" | "archived";
  technologies: string[];
  lastUpdated: string;
}

export interface Activity {
  id: string;
  type: "project" | "profile";
  translationKey: string;
  translationParams?: Record<string, string | number>;
  timestamp: string;
  details?: string;
}

export interface DashboardStats {
  totalProjects: number;
  githubStars: number;
  linkedinConnections: number;
  recentActivities: number;
}
