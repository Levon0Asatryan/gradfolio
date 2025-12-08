export interface Project {
  id: string;
  title: string;
  description: string;
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
