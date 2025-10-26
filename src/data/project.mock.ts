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
  category?: "course" | "personal" | "research" | "hackathon" | "other";
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
    heroImageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop", // unoptimized fallback used
    descriptionHtml:
      `<h3>Problem Statement</h3>
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
    descriptionHtml:
      `<h3>Overview</h3>
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
      { id: "u_emil", name: "Emil S.", role: "Hardware", avatarUrl: "https://i.pravatar.cc/160?img=13" },
      { id: "u_aliya", name: "Aliya R.", role: "Firmware", avatarUrl: "https://i.pravatar.cc/160?img=31" },
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
    descriptionHtml:
      `<p>CLI tool and web UI for uploading PDFs and generating summaries with optional citations.</p>`,
    technologies: ["Python", "PyTorch", "Transformers", "FastAPI"],
    attachments: [
      { id: "sum_pdf", type: "pdf", url: "https://arxiv.org/pdf/1910.13461.pdf", title: "Writeup" },
    ],
    team: [
      { id: "u_lee", name: "Lee M.", role: "ML Engineer", avatarUrl: "https://i.pravatar.cc/160?img=25" },
    ],
    metadata: { category: "research" },
  },
];

export function getProjectById(id: string): ProjectDetailData | undefined {
  return projectsMock.find((p) => p.id === id);
}
