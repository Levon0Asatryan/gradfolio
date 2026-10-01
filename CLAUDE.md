# Gradfolio

Student Portfolio Management System — a platform enabling students to showcase academic projects, skills, and achievements in a professional manner, bridging academia and industry recruitment. Combines LinkedIn's structured career timeline with GitHub's project-centric evidence. Each skill or experience is backed by tangible proof (code, documents, media).

**University coursework project** at NPUA (National Polytechnic University of Armenia).

## Tech Stack

- **Framework**: Next.js 16 (App Router) with Turbopack (`next dev --turbopack`)
- **Language**: TypeScript (strict mode, `noUncheckedIndexedAccess`, `noImplicitReturns`, `allowJs: false`)
- **UI**: MUI (Material UI) v7 + Emotion for styling
- **Auth**: Auth0 (`@auth0/nextjs-auth0` v4, server-side SDK)
- **Layout**: `react-resizable-panels` for the resizable sidebar
- **Hooks library**: `rooks` (used for `useWindowSize`)
- **Animation**: Motion (Framer Motion successor)
- **Analytics**: Vercel Analytics + Speed Insights
- **Fonts**: Geist (sans + mono) via `next/font/google`, Roboto via `@fontsource/roboto`
- **i18n**: Custom context-based system with 3 languages: English (`en`), Russian (`ru`), Armenian (`am`)
- **Deployment**: Vercel

## Project Structure

```
src/
  app/                          # Next.js App Router pages
    page.tsx                    # Dashboard/home (client component, uses mock data)
    layout.tsx                  # Root layout with provider hierarchy
    not-found.tsx               # Custom 404 page (hides sidebar, shows Noise effect)
    account/page.tsx            # Account page (static placeholder, no interactions yet)
    dashboard/page.tsx          # Redirects to / (dashboard is the home page)
    integrations/
      page.tsx                  # Integrations management (LinkedIn/GitHub connect/disconnect)
      connections/
        page.tsx                # Multi-step onboarding stepper (Welcome → BasicInfo → Experience → Repos)
        components/             # Step components: StepWelcome, StepBasicInfo, StepExperienceEducation, StepRepos
    profile/
      page.tsx                  # Redirects to /profile/u_001 (hardcoded current user)
      ProfileContent.tsx        # Main profile component with preview/edit toggle
      edit/page.tsx             # Redirects to /profile (edit is now inline toggle)
      [id]/page.tsx             # Dynamic profile page, uses getProfileById(), shows isOwnProfile toggle
    projects/
      page.tsx                  # Projects list page (server component with metadata)
      ProjectsContent.tsx       # Client component with search, category filter, sort
      new/page.tsx              # New project form
      [id]/page.tsx             # Project detail page with generateMetadata()
    search/page.tsx             # Explore/search portfolios page
    settings/page.tsx           # Settings page (language + theme toggles)
  components/
    dashboard/                  # DashboardHeader, DashboardStats, RecentProjects, QuickActions, ActivityFeed
    integrations/               # IntegrationCard, ConnectIntegrationDialog, ConfirmDisconnectDialog, IntegrationsPage
    layout/                     # SidebarVisibilityContext (controls sidebar hide/show for pages like 404)
    navigation/                 # AppNavigation (sidebar nav with collapsible mode, active route detection)
    profile/                    # Read-only components: ProfileHeader, EducationList, ExperienceList, SkillsChips, CertificationsList, ProjectsGrid
      shared/                   # Badge, DetailDialog, SectionCard, Tag
    profile-edit/               # Editable versions: EditableProfileHeader, EditableEducationList, EditableExperienceList, EditableProjectsGrid, EditableSkillsChips, EditableCertificationsList, EditableAvatar
    project/                    # ProjectHeader, ProjectDescription, AttachmentsGallery, ProjectMetadataCard, TeamList, TechTags, TechTagsClient, BackButton, SectionCard
      shared/                   # Tag
    project-new/                # ProjectNewForm, ProjectBasicInfo, ProjectMediaUpload, ProjectNewActions
    projects/                   # ProjectCard, ProjectsList, ProjectsListToolbar
      shared/                   # SectionCard, Tag
    search/                     # ExplorePage, FilterBar, PortfolioCard, ResultsGrid, SearchHeader
    settings/                   # SettingsPage (language toggle: en/ru/am, theme toggle: light/dark)
    shared/                     # EditableText, HighlightedText
    sidebar/                    # SideBarWrapper (react-resizable-panels based, collapsible)
      utils/constants/          # COMPONENT_ID enum
      utils/hooks/              # useLayoutConfigHook (calculates panel sizes from window width)
    stepper/                    # Reusable multi-step component: StepperRoot, Step, StepConnector, StepContentWrapper, StepIndicator, SlideTransition
    text/                       # TextType, TypographyWithTooltip
    theme/                      # ThemeRegistry (Emotion SSR cache), ThemeWrapper (light/dark via cookies + context)
      utils/helpers/            # getTheme() — returns MUI palette config per mode
      utils/types/              # ThemeMode = "light" | "dark"
    i18n/                       # LanguageContext + LanguageProvider (persists to localStorage)
    effects/                    # Noise (canvas-based visual noise effect)
  data/                         # Mock data files (no backend yet)
    dashboard.mock.ts           # projectsMock (summary), activitiesMock, statsMock
    integrations.mock.ts        # integrationsMock (LinkedIn, GitHub)
    portfolios.mock.ts          # portfoliosMock (6 users with full profiles), getProfileById()
    profile.mock.ts             # profileMock (u_001 "Gabe Nuels"), ProfileData + related types
    project.mock.ts             # projectsMock (detailed), ProjectDetailData + related types, getProjectById()
    locales/                    # Translation dictionaries
      types.ts                  # Language type, Dictionary interface (enforces all keys across languages)
      en.ts                     # English translations
      ru.ts                     # Russian translations
      am.ts                     # Armenian translations
  lib/
    auth0.ts                    # Auth0Client initialization (reads env vars, explicit scope/audience)
  utils/
    constants/constants.ts      # cookiesThemeKey, ProfileForm type, initialProfileForm
    helpers/formatDate.ts       # formatDate(iso, options?) — locale-aware date formatting
    helpers/validation.ts       # isNonEmpty(), isValidEmail()
    types/dashboard.types.ts    # Project, Activity, DashboardStats interfaces
  middleware.ts                 # Auth0 middleware — protects all routes except _next/static, _next/image, favicon, sitemap, robots
```

## Commands

```bash
npm run dev           # Start dev server with Turbopack
npm run build         # Production build with Turbopack
npm run start         # Start production server
npm run prettier      # Format all src/ files with Prettier
npm run eslint        # Lint the project
npm run eslint-fix    # Lint and auto-fix
npm run knip          # Find unused exports/dependencies
```

## Pre-commit Hooks

Husky runs on every commit (`.husky/pre-commit`):

1. `npm run prettier` — auto-formats code
2. `npm run eslint-fix` — lints and fixes

## Code Style & Conventions

- **Prettier**: semicolons on, double quotes, no JSX single quotes, trailing commas (all), 100 char width, 2-space indent, always arrow parens, bracket spacing
- **ESLint**: flat config (`eslint.config.mjs`) with `unused-imports` plugin (unused imports = error), `no-console` (only `console.error` and `console.warn` allowed), `prefer-const`, `no-empty` with allowEmptyCatch, `@typescript-eslint/no-explicit-any: off`
- **TypeScript**: strict mode, target ES2022, `allowJs: false` — all code must be TypeScript
- **Path alias**: `@/*` maps to `./src/*`
- **Components**: Functional components with `FC` type, `memo()` where appropriate for performance
- **Client components**: Explicitly marked with `"use client"` directive
- **Server components**: Default in App Router; used for pages that only render or redirect (e.g., `projects/page.tsx`, `profile/[id]/page.tsx`)
- **Theme**: Light/dark mode stored in cookies (`cookiesThemeKey = "theme"`), toggled via `DarkModeContext`
- **i18n**: Use `useLanguage()` hook to get `t` (translation dictionary) — access like `t.common.settings`, `t.profile.skills`. Language persisted to `localStorage`
- **Styling**: MUI `sx` prop throughout, no Tailwind, no CSS modules. Theme-aware via callback `sx={(theme) => ({...})}`

## Key Architecture Patterns

### Provider Hierarchy (layout.tsx)

```
<html>
  <body>
    <ThemeRegistry>           ← Emotion SSR cache (prepend: true for MUI)
      <ThemeWrapper>          ← MUI ThemeProvider + CssBaseline + DarkModeContext
        <LanguageProvider>    ← i18n context (en/ru/am)
          <SidebarVisibilityProvider>  ← Controls sidebar show/hide
            <SideBarWrapper>  ← Resizable panel layout (sidebar + content)
              {children}
            </SideBarWrapper>
          </SidebarVisibilityProvider>
        </LanguageProvider>
      </ThemeWrapper>
    </ThemeRegistry>
    <SpeedInsights />
    <Analytics />
  </body>
</html>
```

### Sidebar Layout

- Uses `react-resizable-panels` with `PanelGroup` (horizontal)
- Left panel: `AppNavigation` (collapsible sidebar with nav items)
- Right panel: page content (scrollable)
- `useLayoutConfigHook` converts pixel sizes to percentage-based panel sizes using `useWindowSize` from rooks
- Auto-collapses on mobile (`useMediaQuery` for `sm` breakpoint)
- Panel state auto-saved via `autoSaveId`
- Sidebar can be hidden entirely (e.g., 404 page) via `SidebarVisibilityContext`

### Navigation

- Sidebar nav items: Dashboard (`/`), Login (`/auth/login`), Login Connections (`/integrations/connections`), My Account (`/profile/u_001`), Projects (`/projects`), Integrations (`/integrations`), Explore Portfolios (`/search`)
- Settings link pinned to bottom of sidebar
- Active route detection: longest matching href prefix, with special handling for `/projects` to only highlight for user's own projects
- Logo switches between `light_logo.png` and `dark_logo.png` based on theme mode
- Tooltips shown when sidebar is collapsed

### Theme System

- `ThemeWrapper` creates MUI theme via `getTheme(mode)`:
  - Light: primary `#000000`, navigation bg `grey[50]`
  - Dark: primary `grey[300]`, navigation bg `#1e1e1e`
- Custom palette extension: `palette.navigation.main` (declared via module augmentation on `@mui/material/styles`)
- Font: Roboto (300, 400, 500, 700 weights loaded)
- Cookie-based persistence: `theme` cookie with 1-year max-age, read server-side in layout to avoid flash
- `ThemeRegistry` handles Emotion SSR with `useServerInsertedHTML`

### Data Layer

- **No backend/database yet** — all data is mock
- `src/data/profile.mock.ts`: Single user profile (`ProfileData` interface) with education, experience, projects, certifications, skills, social links
- `src/data/portfolios.mock.ts`: 6 mock users (u_001 through u_006) with full profiles; `getProfileById(id)` lookup function
- `src/data/project.mock.ts`: Detailed project data (`ProjectDetailData`) with AI summary, description HTML, attachments (image/video/pdf/link), repo info, technologies, team members, metadata; `getProjectById(id)` lookup. ~14 projects total including duplicates for u_001 profile projects
- `src/data/dashboard.mock.ts`: Summary project list, activity feed, stats for dashboard
- `src/data/integrations.mock.ts`: LinkedIn (not_connected) and GitHub (connected) integration entries

### Data Types

**Profile types** (`src/data/profile.mock.ts`):

- `ProfileData`: id, name, headline, location, verified, email, avatarUrl, education[], experience[], projects[], certifications[], skills[], socialLinks
- `Education`: institution, degree, field, startYear, endYear, description, highlights
- `Experience`: title, organization, start (ISO month), end, summary, achievements, skills
- `Project` (profile-level): id, name, summary, category, tags, href, attachments, team
- `Certification`: name, issuer, date (YYYY-MM), credentialUrl

**Project detail types** (`src/data/project.mock.ts`):

- `ProjectDetailData`: id, title, aiSummary, heroImageUrl, descriptionHtml, attachments[], links[], files[], repo (RepoInfo), technologies[], team (TeamMember[]), metadata (ProjectMetadata), liveDemoUrl
- `ProjectAttachment`: id, type (image|video|pdf|link), url, title, thumbnailUrl
- `RepoInfo`: url, latestCommitDate, readmeUrl
- `TeamMember`: id, name, role, avatarUrl, profileUrl
- `ProjectMetadata`: startDate, endDate, category (course|personal|research|hackathon|academic|other), course, professor

**Dashboard types** (`src/utils/types/dashboard.types.ts`):

- `Project`: id, title, description, status (ongoing|completed|archived), technologies[], lastUpdated
- `Activity`: id, type (project|profile), translationKey, translationParams, timestamp, details
- `DashboardStats`: totalProjects, githubStars, linkedinConnections, recentActivities

### Auth

- Auth0 v4 server-side SDK initialized in `src/lib/auth0.ts`
- `authorizationParameters` explicitly passes `AUTH0_SCOPE` and `AUTH0_AUDIENCE` (v4 SDK no longer auto-reads these)
- Middleware wraps all routes with `auth0.middleware(request)`, catches errors gracefully
- Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, `sitemap.xml`, `robots.txt`
- Current user is hardcoded as `u_001` (no real auth session reading yet)

### i18n System

- Type-safe: `Dictionary` interface in `src/data/locales/types.ts` enforces every key exists in all 3 languages
- Sections: `common`, `profile`, `integrations` (with nested `steps`, `dialog`, `setup`), `projects` (with `categories`, `status`, `sort`, `form`), `dashboard` (with `stats`, `activity`, `activityTypes`), `search` (with `categories`)
- Language stored in `localStorage` under key `"language"`
- Default language: English
- Access pattern: `const { t, language, setLanguage } = useLanguage()`

### Stepper Component

- Reusable multi-step wizard in `src/components/stepper/`
- Exports: `Stepper` (root), `Step` (child)
- Features: step indicators, connectors, slide transitions, back/next buttons, `canProceed` validation per step, `onStepChange` and `onFinalStepCompleted` callbacks
- Customizable via `sx`, `stepperContainerSx`, `contentSx` props
- Used in the integrations/connections onboarding flow (4 steps)

## Page-by-Page Details

### Dashboard (`/`, `src/app/page.tsx`)

- Client component showing: DashboardHeader (user info + stats + engagement rate), DashboardStats (summary cards), RecentProjects (grid with click-to-navigate), QuickActions (add project, edit profile), ActivityFeed
- Data from `dashboard.mock.ts` and `profile.mock.ts`
- `/dashboard` redirects to `/`

### Profile (`/profile/[id]`, `src/app/profile/[id]/page.tsx`)

- Server component: fetches profile via `getProfileById(id)`, returns 404 if not found
- `isOwnProfile` determined by `id === "u_001"` (hardcoded)
- `ProfileContent` (client): toggle between Preview and Edit modes via `ToggleButtonGroup`
- **Preview mode**: ProfileHeader, EducationList, ExperienceList, ProjectsGrid, SkillsChips, CertificationsList
- **Edit mode**: Editable versions of all components with inline editing, `updateField` callback pattern
- Layout: 8/4 grid (main content / sidebar with skills + certifications)
- `/profile` redirects to `/profile/u_001`
- `/profile/edit` redirects to `/profile` (edit is now inline)

### Projects List (`/projects`, `src/app/projects/ProjectsContent.tsx`)

- Client component with: search input, category filter, sort dropdown (newest/oldest/name asc/desc)
- Filters projects from `project.mock.ts` that belong to current user (cross-references `profileMock.projects` IDs)
- "Add Project" button navigates to `/projects/new`

### Project Detail (`/projects/[id]`, `src/app/projects/[id]/page.tsx`)

- Server component with `generateMetadata()` for dynamic title/description
- Shows: BackButton, ProjectHeader (title, AI summary, hero image, repo link, live demo), ProjectDescription (HTML content), AttachmentsGallery, ProjectMetadataCard (dates, category, course, professor), TechTags (clickable), TeamList (avatars + roles)
- Layout: 8/4 grid

### New Project (`/projects/new`, `src/components/project-new/ProjectNewForm.tsx`)

- Form with: title, AI summary, live demo URL, repo URL, attachments management
- Attachments: add/remove with type (image/video/pdf/link), URL, title
- Mock save (1s delay) then redirect to `/projects`

### Search/Explore (`/search`, `src/components/search/ExplorePage.tsx`)

- Search across all portfolios by name, headline, skills, project names/summaries
- Category filter: All, Developers, Designers, Product Managers, Data Scientists, Researchers (keyword-based heuristic matching against headline + skills)
- Results shown in a grid of portfolio cards

### Integrations (`/integrations`, `src/components/integrations/IntegrationsPage.tsx`)

- Shows LinkedIn and GitHub integration cards
- Connect/disconnect via confirmation dialogs (mock local state, no real OAuth)
- Shows connection status, last synced date
- Info banner when nothing is connected

### Connections Onboarding (`/integrations/connections`)

- 4-step stepper wizard:
  1. **Welcome**: Import from GitHub/LinkedIn buttons (simulated 900ms import)
  2. **Basic Info**: Full name (required), email (validated), birthday, GitHub URL, LinkedIn URL, phone, website
  3. **Experience & Education**: Free-text fields
  4. **Repos**: Free-text repos input
- Validation: Step 2 requires valid name + email to proceed
- Uses the reusable `Stepper` component

### Settings (`/settings`, `src/components/settings/SettingsPage.tsx`)

- Language toggle: English / Русский / Հայերեն
- Theme toggle: Light (with sun icon) / Dark (with moon icon)

### Account (`/account`)

- Static placeholder page with title and description text
- No interactive functionality yet

### 404 (`not-found.tsx`)

- Hides sidebar via `SidebarVisibilityContext`
- Shows Noise visual effect, gradient text "404 — Page not found"
- Buttons: "Go to Dashboard" and "Explore Portfolios"

## Environment Variables

Auth0 requires (loaded automatically by the SDK unless noted):

- `AUTH0_SECRET`
- `AUTH0_BASE_URL`
- `AUTH0_ISSUER_BASE_URL`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_SCOPE` — must be passed explicitly in v4
- `AUTH0_AUDIENCE` — must be passed explicitly in v4

## Remote Image Domains

Configured in `next.config.ts`:

- `i.pravatar.cc` — mock avatar images
- `images.unsplash.com` — mock project/attachment images

## Database Schema (separate repo: `gradfolio-sql`)

A MySQL 8.4 database schema exists in the sibling repo at `../gradfolio-sql/`. It runs via Docker Compose (MySQL 8.4 + Adminer web UI) and is designed to replace the current mock data layer.

**Connection string** (for `.env.local`):

```
DATABASE_URL=mysql://gradfolio:gradfolio_pass@localhost:3306/gradfolio
```

### Tables (10 total)

```
users                       ← ProfileData + socialLinks (github/linkedin inline columns)
├── education               ← Education (highlights as JSON array)
├── experience              ← Experience (achievements + skills as JSON arrays)
├── certifications          ← Certification
├── user_skills             ← ProfileData.skills (one row per skill)
├── projects                ← ProjectDetailData + RepoInfo + ProjectMetadata (all inline)
│   └── project_attachments ← ProjectAttachment
├── integrations            ← Integration (unique per user+type)
└── activities              ← Activity (translation_key + params as JSON)
```

### Key design decisions:

- All PKs are `VARCHAR(36)` with `DEFAULT (UUID())`
- `users.auth0_id` is UNIQUE — maps to Auth0 identity
- `education.highlights`, `experience.achievements`, `experience.skills`, `projects.tags`, `projects.technologies`, `projects.links`, `projects.files` are JSON columns (arrays)
- `projects` table has FULLTEXT index on `(title, summary, ai_summary)` for search
- `projects.category` is ENUM: `academic|personal|research|hackathon|course|other`
- `projects.status` is ENUM: `ongoing|completed|archived`
- `integrations` has UNIQUE constraint on `(user_id, integration_type)`
- All FKs use `ON DELETE CASCADE` — deleting a user removes all their data
- `sort_order` columns on education, experience, certifications, skills, attachments for user-defined ordering
- charset: `utf8mb4` / `utf8mb4_unicode_ci` (supports Armenian text)

### Table → TypeScript type mapping:

| Table                 | TS type                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `users`               | `ProfileData` + `ProfileData.socialLinks`                        |
| `education`           | `Education` (`highlights` → JSON)                                |
| `experience`          | `Experience` (`achievements` + `skills` → JSON)                  |
| `certifications`      | `Certification`                                                  |
| `user_skills`         | `ProfileData.skills`                                             |
| `projects`            | `ProjectDetailData` + `Project` + `RepoInfo` + `ProjectMetadata` |
| `project_attachments` | `ProjectAttachment`                                              |
| `integrations`        | `Integration`                                                    |
| `activities`          | `Activity`                                                       |

## Current State & Limitations

- **Frontend-only with mock data** — no backend, no database connected, no real API calls
- **Database schema exists** in `../gradfolio-sql/` but is not yet wired to the Next.js app
- **Auth0 is wired but not functional** without env vars; current user hardcoded as `u_001`
- **`vercel.json`** returns 503 for all routes (maintenance mode)
- **No real OAuth** for LinkedIn/GitHub integrations — connect/disconnect is local state only
- **Import from GitHub/LinkedIn** in onboarding is simulated (setTimeout)
- **Project save** is mocked (no persistence)
- **Profile edits** are client-state only (not persisted across page reload)
- **Search** filters locally against mock portfolio data
- **No tests** — no test framework configured
- **No real AI summary** generation — AI summary is a manual text field
- **No file uploads** — attachments reference external URLs only
- **No team member management** — team data is hardcoded in mocks
- **No notifications system**
- **No privacy controls** — all profiles/projects are public in mock data

## Product Vision & Specification

The full product vision is documented in spec files located at `../` (parent directory). The core philosophy is **"Show, Don't Tell"** — every skill or experience must be backed by tangible proof (code, documents, media).

### Competitive positioning

Gradfolio fills the gap between:

- **Portfolium (Canvas Folio)**: Strong on artifacts/collaboration but institution-centric, no native code integration, limited peer-to-peer features
- **Bulb Digital Portfolios**: Rich media + longitudinal records but reflection-heavy, no social graph, narrative over structure

Gradfolio's differentiator: **academic depth packaged in a recruiter-friendly format** with native support for technical projects (repo links, structured metadata, code evidence).

### Feature Roadmap (from specification, not yet implemented)

#### 1. Authentication & Onboarding

- Multi-option sign-up: email/password + OAuth (Google, LinkedIn, GitHub)
- Profile initialization during first login (pre-fill from OAuth)
- Email & phone verification (OTP) — marks profile as credible
- External account linking post-registration (LinkedIn, GitHub)

#### 2. LinkedIn & GitHub Integration (Data Import)

- **LinkedIn import**: Work experience, education, certifications, skills via LinkedIn API
- **GitHub import**: List repos → user selects which become projects → import name, description, language, stars, README content
- Review/edit imported data before publishing
- Manual re-sync option (user-triggered, no auto-overwrite)

#### 3. Verification & Credibility (optional, can be deferred)

- **Email/phone verification** → verified profile indicator
- **LinkedIn/GitHub verification** → "Verified LinkedIn/GitHub" badge via OAuth confirmation
- **Education verification** → manual document upload (transcript/diploma), admin review → checkmark
- **Certification verification** → certificate ID/URL input, auto-validate known issuers (Coursera, AWS, etc.)
- **Project verification** → GitHub-imported projects get GitHub icon; supervisor/teammate endorsement; mutual teammate confirmation
- **Verified Profile status** → composite badge when multiple verifications complete
- Privacy: verification documents kept private, only status displayed

#### 4. Search & Discovery (enhanced)

- Global search across names, skills, project titles, school names
- Clickable tech tags → show all projects/profiles with that tag
- Browse Projects page: gallery with sorting (newest, most viewed, by category), thumbnail cards
- Browse Users directory: filter by school, major, graduation year
- Advanced cross-entity search: combined queries returning grouped results (Projects vs Profiles)
- Tag clouds and recommendations: trending technologies, "Similar Projects", "People with similar skills"
- Public/private content controls: users can mark projects as private

#### 5. Utilities & Export

- **Automated CV/Resume PDF**: generate from profile data, choose template, select sections
- **Portfolio PDF export**: full portfolio with text + images for offline use
- **Email sharing**: "Share via Email" button with recipient input, auto-generated email template with highlights + portfolio link
- **Notifications**: teammate tags, project verification, comments, employer contact requests

#### 6. AI Features

- AI-generated project summaries (2-3 sentences from description/README, editable)
- Auto-suggest tags from project description ("You used Python, do you want to tag Python?")
- Description improvement suggestions

#### 7. Social Features (future scope)

- Comments/feedback on project pages
- Skill endorsements from peers
- Follow/bookmark other students' projects
- Activity feed beyond own actions

#### 8. Admin Interface (future scope)

- Content moderation
- Verification document review/approval
- Site-wide settings management

### Example End-to-End User Journey (from spec)

1. **Onboarding**: Student signs up with university email → verifies → links Google + LinkedIn → imports LinkedIn data (education, internship, skills auto-filled)
2. **Adding projects**: GitHub import for personal project (screenshots + AI summary added); manual entry for group class project (description, video demo, tag teammate)
3. **Verification**: Upload diploma PDF → admin verifies; enter Cisco cert number → auto-verified; profile shows "Verified" badge
4. **Using portfolio**: Generate resume PDF for applications; share portfolio link in email signature; recruiter views profile → impressed by video demo → contacts via email link
5. **Discovery**: Classmate browses "IoT" tag → discovers other hardware projects → connects with peers
