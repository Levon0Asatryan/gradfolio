import type { Profile, ProjectDetail, ProjectSummary } from "@/lib/api/types";

/** A profile shaped like the API's answer (`getProfile`), for tests only. */
export const PROFILE: Profile = {
  id: "0b6f2c1e-1111-4222-8333-444455556666",
  name: "Ani Petrosyan",
  headline: "CS student",
  bio: "I like compilers.",
  location: "Yerevan",
  avatarUrl: null,
  verified: true,
  contactEmail: "ani@example.com",
  links: { github: "https://github.com/ani", linkedin: null, twitter: null, website: null },
  isOwner: false,
  isPublic: true,
  education: [
    {
      id: "e1",
      institution: "NPUA",
      degree: "B.Sc.",
      field: "Informatics",
      startYear: 2021,
      endYear: null,
      description: null,
      highlights: [],
    },
  ],
  experience: [
    {
      id: "x1",
      title: "Intern",
      organization: "Acme",
      start: "2024-06",
      end: null,
      summary: "Built things.",
      achievements: [],
      skills: [],
    },
  ],
  certifications: [
    {
      id: "c1",
      name: "AWS",
      issuer: "Amazon",
      date: "2025-01",
      credentialUrl: "javascript:alert(1)",
    },
  ],
  skills: ["TypeScript"],
  projects: [
    {
      id: "p1",
      title: "Ecoroute",
      summary: null,
      category: "hackathon",
      status: "ongoing",
      heroImageUrl: null,
      tags: ["maps"],
      role: "owner",
      isPublic: false,
      isDraft: true,
    },
  ],
};

const PROJECT_ID = "5c1d9a3e-aaaa-4bbb-8ccc-ddddeeeeffff";

/** A project in a list, shaped like the API's answer (`listMyProjects`), for tests only. */
export function projectSummary(over: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    id: PROJECT_ID,
    title: "EcoRoute",
    summary: "Routes with less CO2.",
    category: "hackathon",
    status: "completed",
    heroImageUrl: null,
    tags: [],
    role: "owner",
    technologies: ["Next.js", "Mapbox"],
    isPublic: true,
    isDraft: false,
    isOwner: true,
    ownerId: PROFILE.id,
    metadata: { startDate: "2025-12-06", endDate: null, course: null, professor: null },
    createdAt: "2025-12-06T10:00:00.000Z",
    updatedAt: "2025-12-06T10:00:00.000Z",
    ...over,
  };
}

/** A project page, shaped like the API's answer (`getProject`), for tests only. */
export function projectDetail(over: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    ...projectSummary(),
    aiSummary: null,
    descriptionHtml: "<p>The <strong>story</strong>.</p>",
    liveDemoUrl: "https://demo.example.com",
    repo: {
      url: "https://github.com/x/y",
      latestCommitDate: null,
      readmeUrl: null,
      stars: null,
      forks: null,
      language: null,
    },
    links: [],
    files: [],
    attachments: [],
    team: [],
    owner: { id: PROFILE.id, name: "Ani Petrosyan", avatarUrl: null },
    source: "manual",
    ...over,
  };
}
