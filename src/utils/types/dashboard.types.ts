export interface Publication {
  id: string;
  title: string;
  journal: string;
  date: string;
  authors: string[];
  status: "published" | "inReview" | "draft";
}

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
  type: "publication" | "project" | "profile";
  action: string;
  timestamp: string;
  details?: string;
}

export interface DashboardStats {
  totalPublications: number;
  totalProjects: number;
  profileViews: number;
  recentActivities: number;
}
