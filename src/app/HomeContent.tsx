"use client";

import { FC, memo, useCallback, useMemo } from "react";
import { Box, Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentProjects from "@/components/dashboard/RecentProjects";
import QuickActions from "@/components/dashboard/QuickActions";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { activitiesMock, projectsMock, statsMock } from "@/data/dashboard.mock";
import { profileMock } from "@/data/profile.mock";
import type { Project } from "@/utils/types/dashboard.types";

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

  const handleEditProfile = useCallback(() => {
    router.push("/profile/edit");
  }, [router]);

  const handleViewProjects = useCallback(() => {
    router.push("/projects");
  }, [router]);

  const handleAddProject = useCallback(() => {
    router.push("/projects/new");
  }, [router]);

  const handleProjectClick = useCallback(
    (p: Project) => {
      router.push(`/projects/${p.id}`);
    },
    [router],
  );

  return (
    <Container sx={{ py: 4 }}>
      {/* Header / Hero with Profile & Analytics */}
      <Box sx={{ mb: 3 }}>
        <DashboardHeader
          user={headerUser}
          stats={statsMock}
          engagementRate={3.7}
          onEditProfile={handleEditProfile}
        />
      </Box>

      {/* Summary Stats (non-interactive) */}
      <Box sx={{ mb: 3 }}>
        <DashboardStats stats={statsMock} />
      </Box>

      {/* Main Grid */}
      <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ mb: { xs: 3, md: 0 } }}>
            <RecentProjects
              items={projectsMock}
              onViewAll={handleViewProjects}
              onItemClick={handleProjectClick}
              loading={false}
            />
          </Box>
        </Grid>

        {/* Right Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ mb: 3 }}>
            <QuickActions onAddProject={handleAddProject} onEditProfile={handleEditProfile} />
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
