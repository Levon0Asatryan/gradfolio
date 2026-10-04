# Gradfolio - Student Portfolio Management System

Gradfolio is a specialized platform designed to bridge the gap between academic coursework and industry recruitment. It enables students to showcase their academic projects, skills, and achievements in a professional manner, acting as an expanded online resume where every claim is backed by tangible proof.

🚀 **[Live Demo](https://gradfolio-navy.vercel.app/)**

---

## 🌟 Overview

The goal of Gradfolio is to provide a "show, don't tell" platform for students. By combining the structured career timeline of LinkedIn with the project-centric evidence of GitHub, Gradfolio allows graduates to prove their competencies with more than just grades or bullet points on a CV.

### Why Gradfolio?

- **Artifact-Driven Validation**: Every skill or experience is backed by proof (code repositories, reports, videos).
- **Unified Professional Narrative**: A longitudinal record of a student's development from freshman year to early career.
- **Bridging the Academic-Industry Gap**: Translating academic rigor into recruiter-friendly highlights with structured templates and AI-assisted summaries.

## ✨ Features

### 1. User Authentication & Profile Setup

- **Multi-Option Sign-Up**: Secure registration via Email/Password or OAuth (Google, LinkedIn, GitHub) powered by **Auth0**.
- **Profile Initialization**: Quick setup for basic info and professional headlines.
- **Account Linking**: Connect professional identities for verification and data import.

### 2. Intelligent Data Integration

- **LinkedIn Import**: Automatically populate Work Experience, Education, and Certifications from your LinkedIn profile.
- **GitHub Projects**: Import repositories as project entries, including metadata like primary languages, stars/forks, and README content.

### 3. Dynamic Portfolio Profile

- **Comprehensive Sections**: Education, Experience, Projects, Certifications, and Skills.
- **Verification Badges**: Credibility indicators for verified email, phone, and linked professional accounts.
- **Interactive Skills Tag Cloud**: Clickable skill badges that lead to related evidence and projects.

### 4. Advanced Project Management

- **Project Detail Pages**: Dedicated spaces for in-depth project documentation and case studies.
- **AI-Generated Summaries**: Smart taglines that highlight the essence of a project (Powered by AI).
- **Multimedia Evidence**: Support for embedding demo videos, screenshots, and PDF reports.
- **Teammate Tagging**: Collaboration features that allow group projects to appear on all members' profiles with proper attribution.

### 5. Discovery & Utilities

- **Global Search**: Robust search bar to find talent or projects by name, skill, technology, or institution.
- **Resume PDF Generator**: Instantly generate a professional, formatted resume from your portfolio data.
- **Portfolio Sharing**: Streamlined email sharing integration for job applications.

---

## 📝 Feature Specification & Design Philosophy

Gradfolio is built upon a detailed feature specification that addresses the gaps in current academic portfolio platforms.

### Core Principles

1.  **"Show, Don't Tell"**: Every skill or claim is backed by tangible artifacts (code, videos, reports).
2.  **Unified Narrative**: A single, longitudinal record from freshman year to first job and beyond.
3.  **Academic Rigor meets Industry Needs**: Translating complex academic projects into clear, recruiter-friendly case studies.

### Competitive Analysis

The design was informed by analyzing platforms like **Portfolium** and **Bulb**, identifying the need for:

- Deeper technical integration (GitHub README support, code previews).
- Independent, student-driven identity (not locked to a single institution).
- Standardized, scannable layouts optimized for recruiters.

> [!TIP]
> **View the Full Specification**: For a deep dive into the architecture, verification mechanisms, and future roadmap, read the [Detailed Feature Specification](https://docs.google.com/document/d/1dfI7A_QsUfCoHWueaTIaX2YbUwtEqMPpre1g22f0-3c/edit?tab=t.0#heading=h.i7q2hhm9v8ma).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Library**: [React 19](https://react.dev/), TypeScript
- **UI Components**: [Material UI (MUI) v7](https://mui.com/), styled with [Emotion](https://emotion.sh/)
- **Authentication**: [Auth0](https://auth0.com/) (`@auth0/nextjs-auth0` v4)
- **Animations**: [Motion](https://motion.dev/)
- **Languages**: English, Russian, Armenian
- **Tests**: [Vitest](https://vitest.dev/) and Testing Library
- **Deployment**: [Vercel](https://vercel.com/)

The backend is [gradfolio-api](https://github.com/Levon0Asatryan/gradfolio-api)
(NestJS, MySQL). Today every page still reads mock data; features move to the API
milestone by milestone, as tracked in its
[`docs/tracker.md`](https://github.com/Levon0Asatryan/gradfolio-api/blob/main/docs/tracker.md).

## 🚀 Getting Started

### Prerequisites

- Node.js 24 (see `.nvmrc`; `nvm use` picks it up)
- npm (the lockfile is npm's)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Levon0Asatryan/gradfolio.git
   cd gradfolio
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

3. **Set up environment variables** (only needed to log in; every page renders
   without them)

   ```bash
   cp .env.example .env.local
   ```

   Then fill in the Auth0 values. The variable names are Auth0 v4's:
   `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`,
   `APP_BASE_URL`, plus `AUTH0_SCOPE` and `AUTH0_AUDIENCE`.

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

### Checks

`npm run verify` runs formatting, lint, types and tests, the same as the pre-push
hook. The full command list is in [CLAUDE.md](CLAUDE.md#commands), and how to
contribute is in [CONTRIBUTING.md](CONTRIBUTING.md).

## 📂 Project Structure

```text
src/
├── app/             # Next.js App Router pages and layout
├── components/      # UI, grouped by feature (dashboard, profile, project, search, …) plus shared
├── data/            # Mock data (*.mock.ts) and translations (locales/)
├── lib/             # Auth0 client
├── utils/           # Helpers, types and constants
├── testing/         # Test setup and helpers
└── proxy.ts         # Auth0 session handling and the login requirement
scripts/             # Push gates and review scripts
docs/                # Setup plan and verification; the tracker lives in gradfolio-api
```

---

Developed as a modern solution for student career advancement.
