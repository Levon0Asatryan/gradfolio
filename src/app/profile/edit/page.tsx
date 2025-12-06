"use client";

import { useState, useCallback } from "react";
import { Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import { profileMock, ProfileData } from "@/data/profile.mock";
import EditableProfileHeader from "@/components/profile-edit/EditableProfileHeader";
import EditableEducationList from "@/components/profile-edit/EditableEducationList";
import EditableExperienceList from "@/components/profile-edit/EditableExperienceList";
import EditableProjectsGrid from "@/components/profile-edit/EditableProjectsGrid";
import EditableCertificationsList from "@/components/profile-edit/EditableCertificationsList";
import EditableSkillsChips from "@/components/profile-edit/EditableSkillsChips";

export default function EditProfilePage() {
  const [data, setData] = useState<ProfileData>(profileMock);

  const updateField = useCallback((field: keyof ProfileData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleHeaderUpdate = useCallback(
    (field: "name" | "headline" | "location" | "avatarUrl", value: string) => {
      updateField(field, value);
    },
    [updateField],
  );

  return (
    <Container component="main" sx={{ py: 3 }}>
      <EditableProfileHeader
        name={data.name}
        headline={data.headline}
        location={data.location}
        verified={data.verified}
        avatarUrl={data.avatarUrl}
        onUpdate={handleHeaderUpdate}
      />

      <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <EditableEducationList
            items={data.education}
            onUpdate={(items) => updateField("education", items)}
          />
          <EditableExperienceList
            items={data.experience}
            onUpdate={(items) => updateField("experience", items)}
          />
          <EditableProjectsGrid
            items={data.projects}
            onUpdate={(items) => updateField("projects", items)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <EditableSkillsChips
            items={data.skills}
            onUpdate={(items) => updateField("skills", items)}
          />
          <EditableCertificationsList
            items={data.certifications}
            onUpdate={(items) => updateField("certifications", items)}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
