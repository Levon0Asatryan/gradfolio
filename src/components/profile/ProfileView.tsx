"use client";

import { FC, useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Profile } from "@/lib/api/types";
import ProfileHeader from "./ProfileHeader";
import { ProfileHeaderForm } from "./ProfileHeaderForm";
import EducationList from "./EducationList";
import ExperienceList from "./ExperienceList";
import ProjectsGrid from "./ProjectsGrid";
import CertificationsList from "./CertificationsList";
import SkillsChips from "./SkillsChips";
import { SectionEditor, type EditableItem } from "./edit/SectionEditor";
import { SkillsEditor } from "./edit/SkillsEditor";
import { PageContainer } from "@/components/layout/PageContainer";

/**
 * A profile as the API returned it (`GET /v1/users/{id}`). `isOwner` comes from
 * the API, which decides it from the token; here it only picks what to show.
 */
export const ProfileView: FC<{ profile: Profile }> = ({ profile }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [sectionEdit, setSectionEdit] = useState(false);
  const [skillsDirty, setSkillsDirty] = useState(false);
  const editSections = sectionEdit && profile.isOwner;

  return (
    <PageContainer gap={0}>
      {profile.isOwner && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={editSections ? "edit" : "preview"}
            // A mode switch would drop unsaved skill changes: save or cancel first.
            disabled={skillsDirty}
            onChange={(_, mode: string | null) => {
              if (mode) setSectionEdit(mode === "edit");
            }}
            aria-label={t.profile.editMode}
          >
            <ToggleButton value="preview">
              <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
              {t.profile.previewMode}
            </ToggleButton>
            <ToggleButton value="edit">
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              {t.profile.editMode}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {editing && profile.isOwner ? (
        <ProfileHeaderForm
          initial={profile}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      ) : (
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
          onEdit={profile.isOwner ? () => setEditing(true) : undefined}
        />
      )}

      <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          {editSections ? (
            <>
              <SectionEditor
                section="education"
                items={profile.education as unknown as EditableItem[]}
                empty={t.profile.noEducation}
                describe={(e) => ({
                  primary: `${e.degree} • ${e.field}`,
                  secondary: `${e.institution} • ${e.startYear}${e.endYear !== null ? `–${e.endYear}` : ` – ${t.common.present}`}`,
                  label: `${e.degree}, ${e.institution}`,
                })}
              />
              <SectionEditor
                section="experience"
                items={profile.experience as unknown as EditableItem[]}
                empty={t.profile.noExperience}
                describe={(e) => ({
                  primary: `${e.title} • ${e.organization}`,
                  secondary: `${e.start} – ${e.end ?? t.common.present}`,
                  label: `${e.title}, ${e.organization}`,
                })}
              />
            </>
          ) : (
            <>
              <EducationList items={profile.education} />
              <ExperienceList items={profile.experience} />
            </>
          )}
          <ProjectsGrid
            items={profile.projects}
            onAddProject={profile.isOwner ? () => router.push("/projects/new") : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          {editSections ? (
            <>
              <SkillsEditor skills={profile.skills} onDirtyChange={setSkillsDirty} />
              <SectionEditor
                section="certifications"
                items={profile.certifications as unknown as EditableItem[]}
                empty={t.profile.noCertifications}
                describe={(c) => ({
                  primary: String(c.name),
                  secondary: `${c.issuer} • ${c.date}`,
                  label: `${c.name}, ${c.issuer}`,
                })}
              />
            </>
          ) : (
            <>
              <SkillsChips items={profile.skills} />
              <CertificationsList items={profile.certifications} />
            </>
          )}
        </Grid>
      </Grid>
    </PageContainer>
  );
};
