"use client";

import { Alert, Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Profile } from "@/lib/api/types";
import { RESUME_MAX_PROJECTS } from "@/lib/resume/request";
import { MoveButtons } from "./MoveButtons";
import { ReorderList, ReorderRow } from "./ReorderRow";

type Project = Profile["projects"][number];

/**
 * The Projects block's content. Picked projects come first, in the order they will be
 * printed (drag them or use the arrows); the rest are listed under "Not included".
 */
export function ProjectsList({
  candidates,
  picked,
  includePrivate,
  hasPrivate,
  busy,
  onIncludePrivate,
  onToggle,
  onReorder,
  onMove,
  onDragEnd,
}: {
  candidates: Project[];
  /** Ids in the order they will be printed. */
  picked: string[];
  includePrivate: boolean;
  hasPrivate: boolean;
  busy: boolean;
  onIncludePrivate: (on: boolean) => void;
  onToggle: (id: string, on: boolean) => void;
  onReorder: (ids: string[]) => void;
  onMove: (index: number, by: -1 | 1) => void;
  onDragEnd: (id: string) => void;
}) {
  const { t } = useLanguage();
  const copy = t.resume;
  const byId = new Map(candidates.map((p) => [p.id, p]));
  const pickedProjects = picked.flatMap((id) => {
    const p = byId.get(id);
    return p ? [p] : [];
  });
  const rest = candidates.filter((p) => !picked.includes(p.id));
  const restricted = (p: Project) => (!p.isPublic || p.isDraft) && !includePrivate;
  const full = picked.length >= RESUME_MAX_PROJECTS;

  const label = (p: Project, on: boolean) => (
    <FormControlLabel
      sx={{ flex: 1, minWidth: 0, m: 0 }}
      label={p.title}
      slotProps={{ typography: { sx: { overflowWrap: "anywhere", fontWeight: 700 } } }}
      control={
        <Checkbox
          checked={on}
          disabled={busy || restricted(p) || (!on && full)}
          onChange={(_, checked) => onToggle(p.id, checked)}
        />
      }
    />
  );
  const badge = (p: Project) =>
    !p.isPublic || p.isDraft ? (
      <Typography
        component="span"
        variant="caption"
        sx={{ flex: "none", fontWeight: 700, color: "secondary.main" }}
      >
        {p.isDraft ? t.profile.draft : t.profile.privateProject}
      </Typography>
    ) : null;

  return (
    <Box sx={{ borderTop: 1, borderColor: "divider", bgcolor: "background.paper", p: 2 }}>
      {hasPrivate && (
        <FormControlLabel
          label={copy.includePrivate}
          control={
            <Checkbox
              checked={includePrivate}
              disabled={busy}
              onChange={(_, checked) => onIncludePrivate(checked)}
            />
          }
        />
      )}
      {includePrivate && (
        <Alert severity="warning" sx={{ my: 1 }}>
          {copy.privateWarning}
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
        {copy.projectLimit.replace("{max}", String(RESUME_MAX_PROJECTS))}
      </Typography>
      {pickedProjects.length > 0 && (
        <ReorderList values={picked} onReorder={onReorder} label={copy.sections.projects}>
          {pickedProjects.map((p, index) => (
            <ReorderRow key={p.id} value={p.id} draggable={!busy} onDragEnd={() => onDragEnd(p.id)}>
              {(handle) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minHeight: 48 }}>
                  {handle}
                  {label(p, true)}
                  {badge(p)}
                  <MoveButtons
                    name={p.title}
                    canUp={index > 0}
                    canDown={index < pickedProjects.length - 1}
                    disabled={busy}
                    onMove={(by) => onMove(index, by)}
                  />
                </Box>
              )}
            </ReorderRow>
          ))}
        </ReorderList>
      )}
      {rest.length > 0 && (
        <>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1.5, fontWeight: 800, textTransform: "uppercase" }}
          >
            {copy.notIncluded}
          </Typography>
          <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
            {rest.map((p) => (
              <Box
                component="li"
                key={p.id}
                sx={{ display: "flex", alignItems: "center", gap: 0.5, minHeight: 48, pl: 4.5 }}
              >
                {label(p, false)}
                {badge(p)}
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
