export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
  description?: string;
  highlights?: string[];
}

export interface Experience {
  id: string;
  title: string;
  organization: string;
  start: string; // ISO month (e.g., 2023-06)
  end?: string; // ISO month or undefined for Present
  summary: string;
  achievements?: string[];
  skills?: string[];
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  category: "academic" | "personal" | "research" | "other";
  tags: string[];
  href?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string; // YYYY-MM
  credentialUrl?: string;
}

export interface ProfileData {
  id: string;
  name: string;
  headline: string;
  location?: string;
  verified: boolean;
  email?: string;
  avatarUrl: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
  skills: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export const profileMock: ProfileData = {
  id: "u_001",
  name: "Gabe Nuels",
  headline: "Computer Science Undergraduate at XYZ University – Aspiring Data Scientist",
  location: "Yerevan, Armenia",
  verified: true,
  email: "ari.petrosyan@example.com",
  avatarUrl: "https://i.pravatar.cc/160?img=5",
  socialLinks: {
    github: "https://github.com/example",
    linkedin: "https://linkedin.com/in/example",
  },
  education: [
    {
      id: "edu_bsc",
      institution: "XYZ University",
      degree: "B.Sc.",
      field: "Computer Science",
      startYear: 2021,
      description:
        "Focused on algorithms, data structures, and applied machine learning. Teaching assistant for Intro to Python.",
      highlights: [
        "GPA: 3.8/4.0",
        "Capstone: Real-time traffic prediction using LSTM",
        "Notable courses: Algorithms, Databases, ML, Distributed Systems",
      ],
    },
    {
      id: "edu_hs",
      institution: "Anania Shirakatsi Lyceum",
      degree: "High School Diploma",
      field: "Math & Physics",
      startYear: 2017,
      endYear: 2021,
      description: "Competitive programming club lead; participated in national olympiads.",
    },
  ],
  experience: [
    {
      id: "exp_intern_ds",
      title: "Data Science Intern",
      organization: "Cortex Analytics",
      start: "2024-06",
      end: "2024-09",
      summary:
        "Built data preprocessing pipelines and model evaluation dashboards. Improved AUC by 7% on churn prediction.",
      achievements: [
        "Implemented feature store using DuckDB",
        "Optimized model training time by 30%",
      ],
      skills: ["Python", "Pandas", "Scikit-learn", "MLflow"],
    },
    {
      id: "exp_ra",
      title: "Research Assistant",
      organization: "XYZ University AI Lab",
      start: "2023-10",
      summary:
        "Exploring graph neural networks for recommendation on sparse datasets; co-authored workshop paper.",
      skills: ["PyTorch", "GNN", "Recsys"],
    },
  ],
  projects: [
    {
      id: "prj_1",
      name: "EcoRoute",
      category: "personal",
      summary:
        "A Next.js app that suggests eco-friendly routes using OpenStreetMap and CO2 estimates.",
      tags: ["Next.js", "TypeScript", "Mapbox", "Vercel"],
      href: "https://example.com/projects/ecoroute",
    },
    {
      id: "prj_2",
      name: "CourseVision",
      category: "academic",
      summary: "Computer vision project detecting lab equipment and measuring usage time.",
      tags: ["Python", "OpenCV", "YOLOv8"],
    },
    {
      id: "prj_3",
      name: "Paper Summarizer",
      category: "research",
      summary:
        "Extractive+abstractive summarization for arXiv PDFs with evaluation via ROUGE and BERTScore.",
      tags: ["NLP", "Transformers", "PyTorch"],
    },
  ],
  certifications: [
    {
      id: "cert_aws_ccp",
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "2024-11",
      credentialUrl: "https://aws.amazon.com/verification?id=12345",
    },
    {
      id: "cert_dl",
      name: "Deep Learning Specialization",
      issuer: "Coursera / DeepLearning.AI",
      date: "2023-08",
    },
  ],
  skills: [
    "Python",
    "TypeScript",
    "React",
    "Next.js",
    "Machine Learning",
    "Data Visualization",
    "Docker",
    "SQL",
  ],
};
