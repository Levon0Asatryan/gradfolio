"use client";

import { useState, useCallback } from "react";
import { Container, Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageContext";
import Grid from "@mui/material/Grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import { profileMock, ProfileData } from "@/data/profile.mock";
import EditableProfileHeader from "@/components/profile-edit/EditableProfileHeader";
import EditableEducationList from "@/components/profile-edit/EditableEducationList";
import EditableExperienceList from "@/components/profile-edit/EditableExperienceList";
import EditableProjectsGrid from "@/components/profile-edit/EditableProjectsGrid";
import EditableCertificationsList from "@/components/profile-edit/EditableCertificationsList";
import EditableSkillsChips from "@/components/profile-edit/EditableSkillsChips";
import ProfileHeader from "@/components/profile/ProfileHeader";
import EducationList from "@/components/profile/EducationList";
import ExperienceList from "@/components/profile/ExperienceList";
import ProjectsGrid from "@/components/profile/ProjectsGrid";
import CertificationsList from "@/components/profile/CertificationsList";
import SkillsChips from "@/components/profile/SkillsChips";

const toggleButtonGroupStyles = {
  backgroundColor: "background.paper",
  boxShadow: 2,
  borderRadius: 2,
  "& .MuiToggleButton-root": {
    px: 3,
    py: 1,
    border: "none",
    textTransform: "none",
    fontWeight: 500,
    gap: 1,
    "&.Mui-selected": {
      backgroundColor: "primary.main",
      color: "primary.contrastText",
      "&:hover": {
        backgroundColor: "primary.dark",
      },
    },
    "&:not(.Mui-selected)": {
      color: "text.secondary",
      "&:hover": {
        backgroundColor: "action.hover",
      },
    },
  },
};

interface ProfileContentProps {
  initialData?: ProfileData;
  isOwnProfile?: boolean;
}

export default function ProfileContent({
  initialData = profileMock,
  isOwnProfile = true,
}: ProfileContentProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<ProfileData>(initialData);
  const [isEditing, setIsEditing] = useState(false);

  const updateField = useCallback((field: keyof ProfileData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleHeaderUpdate = useCallback(
    (field: "name" | "headline" | "location" | "avatarUrl", value: string) => {
      updateField(field, value);
    },
    [updateField],
  );

  const handleModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
      if (newValue !== null) {
        setIsEditing(newValue === "edit");
      }
    },
    [],
  );

  return (
    <Container component="main" sx={{ py: 3 }}>
      {isOwnProfile && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 3,
            position: "sticky",
            top: 16,
            zIndex: 10,
          }}
        >
          <ToggleButtonGroup
            value={isEditing ? "edit" : "preview"}
            exclusive
            onChange={handleModeChange}
            aria-label="profile mode"
            sx={toggleButtonGroupStyles}
          >
            <ToggleButton value="preview" aria-label="preview mode">
              <VisibilityIcon fontSize="small" />
              {t.profile.previewMode}
            </ToggleButton>
            <ToggleButton value="edit" aria-label="edit mode">
              <EditIcon fontSize="small" />
              {t.profile.editMode}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {isEditing ? (
        <>
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
        </>
      ) : (
        <>
          <ProfileHeader
            name={data.name}
            headline={data.headline}
            location={data.location}
            verified={data.verified}
            email={data.email}
            avatarUrl={data.avatarUrl}
            onEdit={isOwnProfile ? () => setIsEditing(true) : undefined}
          />

          <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <EducationList items={data.education} />
              <ExperienceList items={data.experience} />
              <ProjectsGrid
                items={data.projects}
                onAddProject={isOwnProfile ? () => router.push("/projects/new") : undefined}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SkillsChips items={data.skills} />
              <CertificationsList items={data.certifications} />
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}
