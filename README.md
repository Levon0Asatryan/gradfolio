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

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **UI Components**: [Material UI (MUI) v7](https://mui.com/)
- **Authentication**: [Auth0](https://auth0.com/)
- **Styling**: [Emotion](https://emotion.sh/) & Styled Components
- **Animations**: [Motion](https://www.framer.com/motion/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm / yarn / pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/gradfolio.git
   cd gradfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root and add your Auth0 credentials:
   ```env
   AUTH0_SECRET='your_secret'
   APP_BASE_URL='http://localhost:3000'
   AUTH0_DOMAIN='your-domain.auth0.com'
   AUTH0_CLIENT_ID='your_client_id'
   AUTH0_CLIENT_SECRET='your_client_secret'
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to see the application in action.

## 📂 Project Structure

```text
src/
├── app/             # Next.js App Router (pages, layouts, API)
├── components/      # Reusable UI components (Dashboard, Profile, Stepper)
├── data/            # Mock data and localizations (locales)
├── lib/             # Third-party library configurations (Auth0)
├── utils/           # Helper functions, types, and constants
├── styles/          # Global styles and MUI theme
└── features/        # Feature-specific logic and components
```

---

Developed as a modern solution for student career advancement.
