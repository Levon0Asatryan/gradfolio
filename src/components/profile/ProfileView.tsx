"use client";

import { FC, useState } from "react";
import { Alert } from "@mui/material";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
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
import { CompletenessCard } from "./CompletenessCard";
import { PageContainer } from "@/components/layout/PageContainer";

/**
 * A profile as the API returned it (`GET /v1/users/{id}`). `isOwner` comes from
 * the API, which decides it from the token; here it only picks what to show.
 */
export const ProfileView: FC<{ profile: Profile }> = ({ profile }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  // No global edit mode: the owner edits each part where it is (pencil, Add), one part at a time.
  const owner = profile.isOwner;

  return (
    <PageContainer gap={0}>
      {owner && (
        <Alert
          severity="info"
          role="note"
          icon={<EditOutlinedIcon fontSize="small" />}
          sx={{ mb: 2 }}
        >
          {t.profile.ownerHint}
        </Alert>
      )}
      {owner && !editing && (
        <CompletenessCard profile={profile} onEditHeader={() => setEditing(true)} />
      )}

      {editing && owner ? (
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
          privateNotice={owner && !profile.isPublic}
          onEdit={owner ? () => setEditing(true) : undefined}
        />
      )}

      <Grid container spacing={3} columns={{ xs: 12, md: 12 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          {owner ? (
            <>
              <SectionEditor
                section="education"
                icon={<SchoolOutlinedIcon />}
                items={profile.education as unknown as EditableItem[]}
                describe={(e) => ({
                  primary: `${e.degree} • ${e.field}`,
                  secondary: `${e.institution} • ${e.startYear}${e.endYear !== null ? `–${e.endYear}` : ` – ${t.common.present}`}`,
                  label: `${e.degree}, ${e.institution}`,
                })}
              />
              <SectionEditor
                section="experience"
                icon={<WorkOutlineIcon />}
                items={profile.experience as unknown as EditableItem[]}
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
            onAddProject={owner ? () => router.push("/projects/new") : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          {owner ? (
            <>
              <SkillsEditor skills={profile.skills} icon={<BoltOutlinedIcon />} />
              <SectionEditor
                section="certifications"
                icon={<EmojiEventsOutlinedIcon />}
                items={profile.certifications as unknown as EditableItem[]}
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
