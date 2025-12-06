"use client";

import { Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import EducationList from "@/components/profile/EducationList";
import ExperienceList from "@/components/profile/ExperienceList";
import ProjectsGrid from "@/components/profile/ProjectsGrid";
import CertificationsList from "@/components/profile/CertificationsList";
import SkillsChips from "@/components/profile/SkillsChips";
import { profileMock } from "@/data/profile.mock";

export default function ProfileContent() {
  const router = useRouter();
  const data = profileMock;

  const handleEdit = useCallback(() => {
    router.push("/profile/edit");
  }, [router]);

  return (
    <Container component="main" sx={{ py: 3 }}>
      <ProfileHeader
        name={data.name}
        headline={data.headline}
        location={data.location}
        verified={data.verified}
        email={data.email}
        avatarUrl={data.avatarUrl}
        onEdit={handleEdit}
      />

      <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <EducationList items={data.education} />
          <ExperienceList items={data.experience} />
          <ProjectsGrid items={data.projects} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SkillsChips items={data.skills} />
          <CertificationsList items={data.certifications} />
        </Grid>
      </Grid>
    </Container>
  );
}
