"use client";

import { FC, memo, useMemo } from "react";
import { Box, Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentWork from "@/components/dashboard/RecentWork";
import QuickActions from "@/components/dashboard/QuickActions";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { activitiesMock, projectsMock, publicationsMock, statsMock } from "@/data/dashboard.mock";
import { profileMock } from "@/data/profile.mock";

const HomePage: FC = () => {
  const router = useRouter();

  const headerUser = useMemo(
    () => ({
      name: profileMock.name,
      title: profileMock.headline,
      bio: `Based in ${profileMock.location || "Unknown location"}. Building projects in ${profileMock.skills.slice(0, 3).join(", ")}.`,
      avatarUrl: profileMock.avatarUrl,
    }),
    [],
  );

  return (
    <Container sx={{ py: 3 }}>
      {/* Header / Hero with Profile & Analytics */}
      <Box sx={{ mb: 2 }}>
        <DashboardHeader
          user={headerUser}
          stats={statsMock}
          engagementRate={3.7}
          onEditProfile={() => router.push("/profile")}
          onViewAnalytics={() => router.push("/analytics")}
        />
      </Box>

      {/* Summary Stats (interactive) */}
      <Box sx={{ mb: 2 }}>
        <DashboardStats
          stats={statsMock}
          onStatClick={(key) => {
            switch (key) {
              case "totalPublications":
                router.push("/publications");
                break;
              case "totalProjects":
                router.push("/projects");
                break;
              case "profileViews":
                router.push("/analytics");
                break;
              case "recentActivities":
                router.push("/analytics");
                break;
              default:
                break;
            }
          }}
        />
      </Box>

      {/* Main Grid */}
      <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            <RecentWork
              projects={projectsMock}
              publications={publicationsMock}
              onViewAllProjects={() => router.push("/projects")}
              onViewAllPublications={() => router.push("/publications")}
              onProjectClick={(p) => router.push(`/projects/${p.id}`)}
              onPublicationClick={() => router.push(`/publications`)}
            />
          </Box>
        </Grid>

        {/* Right Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ mb: 2 }}>
            <QuickActions
              onAddPublication={() => router.push("/publications/new")}
              onAddProject={() => router.push("/projects/new")}
              onEditProfile={() => router.push("/profile")}
              onViewAnalytics={() => router.push("/analytics")}
            />
          </Box>
          <Box>
            <ActivityFeed items={activitiesMock} />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default memo(HomePage);
