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
  action: string;
  timestamp: string;
  details?: string;
}

export interface DashboardStats {
  totalProjects: number;
  githubStars: number;
  linkedinConnections: number;
  recentActivities: number;
}
