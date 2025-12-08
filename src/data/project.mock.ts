export type AttachmentType = "image" | "video" | "pdf" | "link";

export interface ProjectAttachment {
  id: string;
  type: AttachmentType;
  url: string;
  title?: string;
  thumbnailUrl?: string; // for images/videos; falls back to url
}

export interface RepoInfo {
  url: string;
  latestCommitDate?: string; // ISO date
  readmeUrl?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  profileUrl?: string;
}

export interface ProjectMetadata {
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  category?: "course" | "personal" | "research" | "hackathon" | "other" | "academic";
  course?: string;
  professor?: string;
}

export interface ProjectDetailData {
  id: string; // used as route param
  title: string;
  aiSummary: string;
  heroImageUrl?: string;
  descriptionHtml: string; // sanitized HTML or to be sanitized
  attachments?: ProjectAttachment[];
  links?: { label: string; url: string }[];
  files?: { label: string; url: string }[]; // PDFs etc.
  repo?: RepoInfo;
  technologies: string[];
  team?: TeamMember[];
  metadata?: ProjectMetadata;
  liveDemoUrl?: string;
}

export const projectsMock: ProjectDetailData[] = [
  {
    id: "ecoroute",
    title: "EcoRoute – CO₂-aware Navigation",
    aiSummary:
      "A Next.js web app that finds eco-friendly driving routes using OpenStreetMap data and estimated CO₂ emissions. Includes dynamic maps, turn-by-turn summaries, and deployment on Vercel.",
    heroImageUrl: "/images/projects/ecoroute.png",
    descriptionHtml: `<h3>Problem Statement</h3>
       <p>Navigation apps typically optimize for <strong>shortest</strong> or <strong>fastest</strong> routes, but not for <em>emissions</em>. EcoRoute estimates CO₂ per segment using speed, stops, and elevation.</p>
       <h3>Solution Approach</h3>
       <ul>
         <li>Data: OpenStreetMap, elevation tiles.</li>
         <li>Frontend: Next.js + Mapbox GL.</li>
         <li>Heuristics: penalize stop-and-go, reward steady segments.</li>
       </ul>
       <h3>Outcome</h3>
       <p>In tests across 20 city trips, EcoRoute reduced emissions by about 8–15% with small travel time tradeoffs.</p>`,
    attachments: [
      {
        id: "ecoroute_img1",
        type: "image",
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
        title: "Map view",
      },
      {
        id: "ecoroute_video1",
        type: "video",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Demo Video",
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      },
      {
        id: "ecoroute_pdf1",
        type: "pdf",
        url: "https://arxiv.org/pdf/1706.03762.pdf",
        title: "Project Report (PDF)",
      },
    ],
    links: [
      { label: "Live Demo", url: "https://example.com/demo/ecoroute" },
      { label: "Design Doc", url: "https://example.com/docs/ecoroute" },
    ],
    files: [{ label: "Slides (PDF)", url: "https://arxiv.org/pdf/2106.14881.pdf" }],
    repo: {
      url: "https://github.com/example/ecoroute",
      latestCommitDate: "2025-04-18",
    },
    technologies: ["Next.js", "TypeScript", "Mapbox", "Node.js"],
    team: [
      {
        id: "u_gabe",
        name: "Gabe Nuels",
        role: "Lead Developer",
        avatarUrl: "https://i.pravatar.cc/160?img=5",
        profileUrl: "/profile",
      },
      {
        id: "u_ana",
        name: "Ana Hov",
        role: "Data Analyst",
        avatarUrl: "https://i.pravatar.cc/160?img=11",
      },
    ],
    metadata: {
      startDate: "2024-10-01",
      endDate: "2025-02-20",
      category: "personal",
    },
    liveDemoUrl: "https://example.com/demo/ecoroute",
  },
  {
    id: "smart-garden-iot",
    title: "Smart Garden IoT System",
    aiSummary:
      "An Arduino + Raspberry Pi system automating irrigation with real-time soil moisture monitoring and a mobile dashboard.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
    descriptionHtml: `<h3>Overview</h3>
       <p>The system controls water pumps based on moisture sensors and weather forecast. The dashboard shows trends and alerts.</p>
       <h3>Hardware</h3>
       <ul>
         <li>Arduino Nano, DHT22, capacitive soil sensor.</li>
         <li>Raspberry Pi Zero W for Wi‑Fi + MQTT.</li>
       </ul>
       <h3>Results</h3>
       <p>Saved ~25% water over a 2-month pilot while keeping soil moisture in optimal range.</p>`,
    attachments: [
      {
        id: "garden_img1",
        type: "image",
        url: "https://images.unsplash.com/photo-1529390079861-591de354faf5?q=80&w=1600&auto=format&fit=crop",
        title: "Prototype on desk",
      },
    ],
    repo: {
      url: "https://github.com/example/smart-garden-iot",
      latestCommitDate: "2025-06-30",
      readmeUrl: "https://raw.githubusercontent.com/example/smart-garden-iot/main/README.md",
    },
    technologies: ["Arduino", "Raspberry Pi", "MQTT", "Python"],
    team: [
      {
        id: "u_emil",
        name: "Emil S.",
        role: "Hardware",
        avatarUrl: "https://i.pravatar.cc/160?img=13",
      },
      {
        id: "u_aliya",
        name: "Aliya R.",
        role: "Firmware",
        avatarUrl: "https://i.pravatar.cc/160?img=31",
      },
    ],
    metadata: {
      startDate: "2024-03-01",
      endDate: "2024-12-15",
      category: "course",
      course: "CS 480 – IoT Systems",
      professor: "Dr. Petrosyan",
    },
  },
  {
    id: "paper-summarizer",
    title: "Paper Summarizer (NLP)",
    aiSummary:
      "Extractive + abstractive summarization for arXiv PDFs with evaluation via ROUGE/BERTScore, built with PyTorch.",
    descriptionHtml: `<p>CLI tool and web UI for uploading PDFs and generating summaries with optional citations.</p>`,
    heroImageUrl:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop",
    technologies: ["Python", "PyTorch", "Transformers", "FastAPI"],
    attachments: [
      { id: "sum_pdf", type: "pdf", url: "https://arxiv.org/pdf/1910.13461.pdf", title: "Writeup" },
    ],
    team: [
      {
        id: "u_lee",
        name: "Lee M.",
        role: "ML Engineer",
        avatarUrl: "https://i.pravatar.cc/160?img=25",
      },
    ],
    metadata: { category: "research" },
  },
  // Added projects from portfolios.mock.ts
  {
    id: "p6_1",
    title: "HealthTrack",
    aiSummary: "iOS app for tracking daily wellness metrics using HealthKit integration.",
    descriptionHtml:
      "<p>HealthTrack helps users monitor their vital signs, sleep patterns, and activity levels. Built with SwiftUI and HealthKit for seamless data integration.</p>",
    technologies: ["Swift", "SwiftUI", "HealthKit"],
    team: [
      {
        id: "u_006",
        name: "Jessica Lee",
        avatarUrl: "https://i.pravatar.cc/160?img=44",
        profileUrl: "/profile/u_006",
      },
      {
        id: "u_002",
        name: "Sarah Chen",
        avatarUrl: "https://i.pravatar.cc/160?img=32",
        profileUrl: "/profile/u_002",
      },
    ],
    heroImageUrl:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop",
    attachments: [
      {
        id: "att_6_1",
        type: "image",
        url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop",
        title: "App Dashboard",
      },
    ],
    metadata: { category: "personal" },
  },
  {
    id: "p2_1",
    title: "DesignSystem UI",
    aiSummary: "A comprehensive React component library with Storybook documentation.",
    descriptionHtml:
      "<p>A reusable component library built to ensure UI consistency across applications. Documented with Storybook.</p>",
    technologies: ["React", "Storybook", "TypeScript"],
    heroImageUrl:
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600&auto=format&fit=crop",
    attachments: [
      {
        id: "att_2_1",
        type: "image",
        url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600&auto=format&fit=crop",
        title: "Showcase",
      },
    ],
    team: [
      {
        id: "u_002",
        name: "Sarah Chen",
        avatarUrl: "https://i.pravatar.cc/160?img=32",
        profileUrl: "/profile/u_002",
      },
      {
        id: "u_004",
        name: "Emily Davis",
        avatarUrl: "https://i.pravatar.cc/160?img=9",
        profileUrl: "/profile/u_004",
      },
    ],
    metadata: { category: "personal" },
  },
  {
    id: "p2_2",
    title: "Portfolio V1",
    aiSummary: "Previous version of my portfolio built with Gatsby.",
    descriptionHtml:
      "<p>My first portfolio site, exploring static site generation with Gatsby and GraphQL.</p>",
    technologies: ["Gatsby", "React", "GraphQL"],
    heroImageUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop",
    team: [
      {
        id: "u_002",
        name: "Sarah Chen",
        avatarUrl: "https://i.pravatar.cc/160?img=32",
        profileUrl: "/profile/u_002",
      },
    ],
    metadata: { category: "personal" },
  },
  {
    id: "p3_1",
    title: "DevTools CLI",
    aiSummary: "Rust-based CLI for improved developer workflows.",
    descriptionHtml:
      "<p>A high-performance CLI tool written in Rust to automate common development tasks.</p>",
    technologies: ["Rust", "CLI"],
    repo: { url: "https://github.com/example/devtools" },
    heroImageUrl:
      "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=600&auto=format&fit=crop",
    team: [
      {
        id: "u_003",
        name: "David Kim",
        avatarUrl: "https://i.pravatar.cc/160?img=11",
        profileUrl: "/profile/u_003",
      },
    ],
    metadata: { category: "personal" },
  },
  {
    id: "p3_2",
    title: "Blog Platform",
    aiSummary: "ActivityPub-compatible blogging platform.",
    descriptionHtml:
      "<p>A decentralized blogging platform implementing the ActivityPub protocol for federation.</p>",
    technologies: ["Node.js", "ActivityPub"],
    team: [
      {
        id: "u_003",
        name: "David Kim",
        avatarUrl: "https://i.pravatar.cc/160?img=11",
        profileUrl: "/profile/u_003",
      },
    ],
    heroImageUrl:
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=600&auto=format&fit=crop",
    metadata: { category: "personal" },
  },
  {
    id: "p4_1",
    title: "Banking App Redesign",
    aiSummary: "Complete overhaul of a major banking application UX.",
    descriptionHtml:
      "<p>Redesigned the mobile banking experience to improve accessibility and user flow. Conducted extensive user research and prototyping.</p>",
    technologies: ["Figma", "UX Research", "Prototyping"],
    attachments: [
      {
        id: "att_4_1",
        type: "image",
        url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop",
        title: "Mobile UI",
      },
      {
        id: "att_4_2",
        type: "image",
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop",
        title: "Dashboard",
      },
    ],
    heroImageUrl:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop",
    team: [
      {
        id: "u_004",
        name: "Emily Davis",
        avatarUrl: "https://i.pravatar.cc/160?img=9",
        profileUrl: "/profile/u_004",
      },
    ],
    metadata: { category: "other" },
  },
  {
    id: "p5_1",
    title: "AlphaTrade",
    aiSummary: "Reinforcement learning for algorithmic trading.",
    descriptionHtml:
      "<p>Applied Deep Q-Learning to optimize trading strategies in simulated financial markets.</p>",
    technologies: ["Python", "PyTorch", "RL"],
    attachments: [{ id: "att_5_1", type: "pdf", url: "#", title: "Research Paper" }],
    heroImageUrl:
      "https://images.unsplash.com/photo-1611974765270-ca12586343bb?q=80&w=600&auto=format&fit=crop",
    team: [
      {
        id: "u_005",
        name: "Michael Brown",
        avatarUrl: "https://i.pravatar.cc/160?img=60",
        profileUrl: "/profile/u_005",
      },
    ],
    metadata: { category: "research" },
  },
  // ID Mappings for u_001
  {
    id: "prj_1",
    title: "EcoRoute",
    aiSummary:
      "A Next.js app that suggests eco-friendly routes using OpenStreetMap and CO2 estimates.",
    descriptionHtml:
      "<p>A Next.js web app that finds eco-friendly driving routes using OpenStreetMap data.</p>",
    technologies: ["Next.js", "TypeScript", "Mapbox", "Vercel"],
    liveDemoUrl: "/projects/prj_1",
    heroImageUrl: "/images/projects/ecoroute.png",
    metadata: { category: "personal" },
    attachments: [
      {
        id: "ecoroute_img1",
        type: "image",
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
        title: "Map view",
      },
      {
        id: "ecoroute_video1",
        type: "video",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Demo Video",
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      },
      {
        id: "ecoroute_pdf1",
        type: "pdf",
        url: "https://arxiv.org/pdf/1706.03762.pdf",
        title: "Project Report (PDF)",
      },
    ],
  },
  {
    id: "prj_2",
    title: "CourseVision",
    aiSummary: "Computer vision project detecting lab equipment and measuring usage time.",
    descriptionHtml: "<p>Used YOLOv8 to detect and track usage of shared lab equipment.</p>",
    technologies: ["Python", "OpenCV", "YOLOv8"],
    heroImageUrl: "/images/projects/coursevision.png",
    metadata: { category: "academic" },
  },
  {
    id: "prj_3",
    title: "Paper Summarizer",
    aiSummary: "Extractive+abstractive summarization for arXiv PDFs.",
    descriptionHtml: "<p>CLI tool for summarizing research papers.</p>",
    technologies: ["NLP", "Transformers", "PyTorch"],
    heroImageUrl: "/images/projects/summarizer.png",
    metadata: { category: "research" },
  },
];

export function getProjectById(id: string): ProjectDetailData | undefined {
  return projectsMock.find((p) => p.id === id);
}
