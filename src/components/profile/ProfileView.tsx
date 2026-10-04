"use client";

import { FC } from "react";
import { Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/api/types";
import ProfileHeader from "./ProfileHeader";
import EducationList from "./EducationList";
import ExperienceList from "./ExperienceList";
import ProjectsGrid from "./ProjectsGrid";
import CertificationsList from "./CertificationsList";
import SkillsChips from "./SkillsChips";

/**
 * A profile as the API returned it (`GET /v1/users/{id}`). `isOwner` comes from
 * the API, which decides it from the token; here it only picks what to show.
 */
export const ProfileView: FC<{ profile: Profile }> = ({ profile }) => {
  const router = useRouter();

  return (
    <Container component="main" sx={{ py: 3 }}>
      <ProfileHeader
        name={profile.name}
        headline={profile.headline}
        bio={profile.bio}
        location={profile.location}
        verified={profile.verified}
        contactEmail={profile.contactEmail}
        avatarUrl={profile.avatarUrl}
        links={profile.links}
        privateNotice={profile.isOwner && !profile.isPublic}
      />

      <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <EducationList items={profile.education} />
          <ExperienceList items={profile.experience} />
          <ProjectsGrid
            items={profile.projects}
            onAddProject={profile.isOwner ? () => router.push("/projects/new") : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SkillsChips items={profile.skills} />
          <CertificationsList items={profile.certifications} />
        </Grid>
      </Grid>
    </Container>
  );
};
