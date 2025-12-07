import { ProfileData, profileMock } from "./profile.mock";

export const portfoliosMock: ProfileData[] = [
  // Restore u_001 from profileMock
  {
    ...profileMock,
    id: "u_001", // Ensure ID matches
  },
  {
    id: "u_002",
    name: "Sarah Chen",
    headline: "Frontend Engineer | UI/UX Enthusiast",
    location: "San Francisco, CA",
    verified: true,
    avatarUrl: "https://i.pravatar.cc/160?img=32",
    education: [
      {
        id: "edu_2",
        institution: "UC Berkeley",
        degree: "B.A.",
        field: "Computer Science",
        startYear: 2018,
        endYear: 2022,
        description: "Focus on HCI and Design.",
      },
    ],
    experience: [
      {
        id: "exp_2",
        title: "Frontend Developer",
        organization: "Tech Corp",
        start: "2022-06",
        summary: "Building responsive web apps.",
      },
    ],
    projects: [
      {
        id: "p2_1",
        name: "DesignSystem UI",
        category: "personal",
        summary: "A comprehensive React component library.",
        tags: ["React", "Storybook", "TypeScript"],
        attachments: [
          {
            id: "att_2_1",
            type: "image",
            url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600&auto=format&fit=crop",
            title: "Showcase",
          },
          {
            id: "att_2_2",
            type: "image",
            url: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=600&auto=format&fit=crop",
            title: "Components",
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
      },
      {
        id: "p2_2",
        name: "Portfolio V1",
        category: "personal",
        summary: "Previous version of my portfolio built with Gatsby.",
        tags: ["Gatsby", "React", "GraphQL"],
        attachments: [
          {
            id: "att_2_3",
            type: "image",
            url: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=600&auto=format&fit=crop",
            title: "Landing Page",
          },
        ],
        team: [
          {
            id: "u_002",
            name: "Sarah Chen",
            avatarUrl: "https://i.pravatar.cc/160?img=32",
            profileUrl: "/profile/u_002",
          },
        ],
      },
    ],
    certifications: [
      { id: "cert_2_1", name: "Meta Frontend Developer", issuer: "Coursera", date: "2023-01" },
    ],
    skills: ["React", "TypeScript", "TailwindCSS", "Figma", "Storybook"],
  },
  {
    id: "u_003",
    name: "David Kim",
    headline: "Full Stack Developer & Open Source Contributor",
    location: "Seoul, South Korea",
    verified: false,
    avatarUrl: "https://i.pravatar.cc/160?img=11",
    education: [
      {
        id: "edu_3",
        institution: "KAIST",
        degree: "M.S.",
        field: "Software Engineering",
        startYear: 2020,
        endYear: 2022,
      },
    ],
    experience: [
      {
        id: "exp_3",
        title: "Backend Engineer",
        organization: "CloudSystems",
        start: "2022-03",
        summary: "Designing scalable microservices.",
      },
    ],
    projects: [
      {
        id: "p3_1",
        name: "DevTools CLI",
        category: "personal",
        summary: "Rust-based CLI for improved developer workflows.",
        tags: ["Rust", "CLI"],
        href: "https://github.com/example/devtools",
        attachments: [
          {
            id: "att_3_1",
            type: "image",
            url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop",
            title: "Terminal Demo",
          },
        ],
        team: [
          {
            id: "u_003",
            name: "David Kim",
            avatarUrl: "https://i.pravatar.cc/160?img=11",
            profileUrl: "/profile/u_003",
          },
        ],
      },
      {
        id: "p3_2",
        name: "Blog Platform",
        category: "personal",
        summary: "ActivityPub-compatible blogging platform.",
        tags: ["Node.js", "ActivityPub"],
        team: [
          {
            id: "u_003",
            name: "David Kim",
            avatarUrl: "https://i.pravatar.cc/160?img=11",
            profileUrl: "/profile/u_003",
          },
        ],
        attachments: [
          {
            id: "att_3_2",
            type: "image",
            url: "https://images.unsplash.com/photo-1499750310159-5254f4197283?q=80&w=600&auto=format&fit=crop",
            title: "Editor UI",
          },
        ],
      },
    ],
    certifications: [],
    skills: ["JavaScript", "Node.js", "Rust", "Docker", "PostgreSQL"],
  },
  {
    id: "u_004",
    name: "Emily Davis",
    headline: "Product Designer @ TechFlow",
    location: "London, UK",
    verified: true,
    avatarUrl: "https://i.pravatar.cc/160?img=9",
    education: [
      {
        id: "edu_4",
        institution: "Royal College of Art",
        degree: "MA",
        field: "Service Design",
        startYear: 2019,
        endYear: 2021,
      },
    ],
    experience: [
      {
        id: "exp_4",
        title: "Product Designer",
        organization: "TechFlow",
        start: "2021-09",
        summary: "Leading design system initiatives.",
      },
    ],
    projects: [
      {
        id: "p4_1",
        name: "Banking App Redesign",
        category: "other",
        summary: "Complete overhaul of a major banking application UX.",
        tags: ["Figma", "UX Research", "Prototyping"],
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
        team: [
          {
            id: "u_004",
            name: "Emily Davis",
            avatarUrl: "https://i.pravatar.cc/160?img=9",
            profileUrl: "/profile/u_004",
          },
        ],
      },
    ],
    certifications: [],
    skills: ["Product Design", "Figma", "User Research", "Prototyping"],
  },
  {
    id: "u_005",
    name: "Michael Brown",
    headline: "Machine Learning Engineer",
    location: "Berlin, Germany",
    verified: false,
    avatarUrl: "https://i.pravatar.cc/160?img=60",
    education: [
      {
        id: "edu_5",
        institution: "TU Munich",
        degree: "M.Sc.",
        field: "Robotics",
        startYear: 2018,
        endYear: 2020,
      },
    ],
    experience: [],
    projects: [
      {
        id: "p5_1",
        name: "AlphaTrade",
        category: "research",
        summary: "Reinforcement learning for algorithmic trading.",
        tags: ["Python", "PyTorch", "RL"],
        attachments: [{ id: "att_5_1", type: "pdf", url: "#", title: "Research Paper" }],
        team: [
          {
            id: "u_005",
            name: "Michael Brown",
            avatarUrl: "https://i.pravatar.cc/160?img=60",
            profileUrl: "/profile/u_005",
          },
        ],
      },
    ],
    certifications: [
      { id: "cert_5", name: "TensorFlow Developer", issuer: "Google", date: "2021-05" },
    ],
    skills: ["Python", "PyTorch", "TensorFlow", "MLOps", "Kubernetes"],
  },
  {
    id: "u_006",
    name: "Jessica Lee",
    headline: "Mobile Developer (iOS/Swift)",
    location: "Toronto, Canada",
    verified: true,
    avatarUrl: "https://i.pravatar.cc/160?img=44",
    education: [],
    experience: [
      {
        id: "exp_6",
        title: "iOS Developer",
        organization: "Appify",
        start: "2023-01",
        summary: "Developing native iOS apps.",
      },
    ],
    projects: [
      {
        id: "p6_1",
        name: "HealthTrack",
        category: "personal",
        summary: "iOS app for tracking daily wellness metrics.",
        tags: ["Swift", "SwiftUI", "HealthKit"],
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
        attachments: [
          {
            id: "att_6_1",
            type: "image",
            url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop",
            title: "App Screens",
          },
          {
            id: "att_6_2",
            type: "image",
            url: "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?q=80&w=600&auto=format&fit=crop",
            title: "Marketing Banner",
          },
        ],
      },
    ],
    certifications: [],
    skills: ["Swift", "SwiftUI", "iOS", "Combine", "XCode"],
  },
];

export function getProfileById(id: string): ProfileData | undefined {
  return portfoliosMock.find((p) => p.id === id);
}
