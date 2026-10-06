"use client";

import { type FC } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Dictionary } from "@/data/locales/types";
import type { Profile } from "@/lib/api/types";

type ItemKey =
  "Headline" | "Bio" | "Location" | "Photo" | "Education" | "Experience" | "Skills" | "Project";

/** The things that make a profile worth opening, in the order to suggest them. */
function completenessChecks(profile: Profile): { key: ItemKey; done: boolean }[] {
  return [
    { key: "Headline", done: profile.headline.trim() !== "" },
    { key: "Bio", done: (profile.bio ?? "").trim() !== "" },
    { key: "Location", done: (profile.location ?? "").trim() !== "" },
    { key: "Photo", done: Boolean(profile.avatarUrl) },
    { key: "Education", done: profile.education.length > 0 },
    { key: "Experience", done: profile.experience.length > 0 },
    { key: "Skills", done: profile.skills.length >= 3 },
    { key: "Project", done: profile.projects.length > 0 },
  ];
}

const HEADER_ITEMS: ItemKey[] = ["Headline", "Bio", "Location", "Photo"];

/**
 * The owner's nudge: how complete the profile is and the one next step. Gone at
 * 100%. A step that lives in the header opens the header editor.
 */
export const CompletenessCard: FC<{ profile: Profile; onEditHeader: () => void }> = ({
  profile,
  onEditHeader,
}) => {
  const { t } = useLanguage();
  const checks = completenessChecks(profile);
  const done = checks.filter((c) => c.done).length;
  const next = checks.find((c) => !c.done);
  if (!next) return null;
  const p = t.profile;
  const itemText = p[`completeness${next.key}` as keyof Dictionary["profile"]] as string;
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: "20px", mb: 3 }}>
      <Stack spacing={1.25}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
          flexWrap="wrap"
          columnGap={2}
        >
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800 }}>
            {p.completenessTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {p.completenessDone
              .replace("{done}", String(done))
              .replace("{total}", String(checks.length))}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={(done / checks.length) * 100}
          aria-label={p.completenessTitle}
          sx={(theme) => ({
            height: 10,
            borderRadius: 5,
            bgcolor: theme.palette.surface.soft,
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
              backgroundImage: theme.palette.surface.gradient,
            },
          })}
        />
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="body2">{p.completenessNext.replace("{item}", itemText)}</Typography>
          {HEADER_ITEMS.includes(next.key) && (
            <Button size="small" onClick={onEditHeader}>
              {t.common.edit}
            </Button>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};
