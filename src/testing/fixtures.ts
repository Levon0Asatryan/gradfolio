import type { Profile } from "@/lib/api/types";

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
