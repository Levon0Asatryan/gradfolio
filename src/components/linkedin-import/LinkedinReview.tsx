"use client";

import { type FC, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { LinkedinPreview } from "@/lib/api/types";
import {
  ENTRY_SECTIONS,
  canSelect,
  rowErrors,
  type EntryRow,
  type ReviewModel,
  type SkillRow,
} from "@/lib/linkedin/model";
import { ItemEditor } from "./ItemEditor";

const rowTitle = (row: EntryRow): string => {
  const v = row.values;
  if (row.section === "experience") return [v.title, v.organization].filter(Boolean).join(" · ");
  if (row.section === "education") return [v.degree, v.institution].filter(Boolean).join(" · ");
  return [v.name, v.issuer].filter(Boolean).join(" · ");
};

const rowDates = (row: EntryRow, present: string): string => {
  const v = row.values;
  if (row.section === "experience") return [v.start, v.end || present].filter(Boolean).join(" – ");
  if (row.section === "education")
    return [v.startYear, v.endYear || present].filter(Boolean).join(" – ");
  return v.date ?? "";
};

/**
 * The review step: every proposed item with its own checkbox, a select-all per section, the
 * ones already on the profile shown but not selectable, and the broken ones editable. Nothing
 * here is saved; the parent builds the confirm from what is ticked.
 */
export const LinkedinReview: FC<{
  model: ReviewModel;
  selected: ReadonlySet<string>;
  onToggle: (ids: string[], on: boolean) => void;
  onEdit: (id: string, values: Record<string, string>) => void;
  preview: Pick<LinkedinPreview, "skippedColumns" | "missingFiles" | "skippedFileCount">;
}> = ({ model, selected, onToggle, onEdit, preview }) => {
  const { t } = useLanguage();
  const text = t.linkedinImport.review;
  const [editing, setEditing] = useState<string | null>(null);

  const groups: { key: string; title: string; entries: EntryRow[]; skills: SkillRow[] }[] = [
    ...ENTRY_SECTIONS.map((section) => ({
      key: section,
      title: text.sections[section],
      entries: model.entries.filter((r) => r.section === section),
      skills: [],
    })),
    { key: "skills", title: text.sections.skills, entries: [], skills: model.skills },
  ];

  const hasSkipped =
    preview.skippedColumns.length > 0 ||
    preview.missingFiles.length > 0 ||
    preview.skippedFileCount > 0;

  return (
    <Stack spacing={3}>
      <Typography>{text.intro}</Typography>
      {groups.map((group) => {
        const rows: (EntryRow | SkillRow)[] = [...group.entries, ...group.skills];
        const selectable = rows.filter(canSelect).map((r) => r.id);
        const ticked = selectable.filter((id) => selected.has(id)).length;
        const legendId = `linkedin-${group.key}`;
        return (
          <Box
            key={group.key}
            component="fieldset"
            sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
            aria-labelledby={legendId}
          >
            <Typography
              id={legendId}
              component="legend"
              variant="h6"
              sx={{ fontSize: "1.1rem", mb: 1 }}
            >
              {group.title}
            </Typography>
            {rows.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {text.empty}
              </Typography>
            ) : (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectable.length > 0 && ticked === selectable.length}
                      indeterminate={ticked > 0 && ticked < selectable.length}
                      disabled={selectable.length === 0}
                      onChange={(e) => onToggle(selectable, e.target.checked)}
                    />
                  }
                  label={`${text.selectAll}: ${group.title}`}
                  sx={{ mb: 0.5 }}
                />
                <Stack component="ul" spacing={1} sx={{ listStyle: "none", p: 0, m: 0 }}>
                  {group.entries.map((row) => {
                    const errors = rowErrors(row);
                    const open = editing === row.id;
                    const duplicate = row.status === "duplicate";
                    const title = rowTitle(row) || "—";
                    return (
                      <Box
                        component="li"
                        key={row.id}
                        sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}
                      >
                        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                          <Checkbox
                            checked={selected.has(row.id) && canSelect(row)}
                            disabled={!canSelect(row)}
                            onChange={(e) => onToggle([row.id], e.target.checked)}
                            slotProps={{ input: { "aria-label": title } }}
                            sx={{ mt: -0.5 }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                              {title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {rowDates(row, text.present)}
                            </Typography>
                            {duplicate && (
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {text.alreadyOnProfile}
                              </Typography>
                            )}
                            {!duplicate && errors && (
                              <Typography
                                variant="body2"
                                color="warning.main"
                                sx={{ fontWeight: 600 }}
                              >
                                {row.section === "education" && errors.field
                                  ? text.educationFieldHint
                                  : text.needsFixing}
                              </Typography>
                            )}
                          </Box>
                          {!duplicate && (
                            <Button
                              size="small"
                              aria-expanded={open}
                              aria-label={`${open ? text.doneEditing : text.edit}: ${title}`}
                              onClick={() => setEditing(open ? null : row.id)}
                            >
                              {open ? text.doneEditing : text.edit}
                            </Button>
                          )}
                        </Stack>
                        <Collapse in={open} unmountOnExit>
                          <ItemEditor
                            row={row}
                            errors={errors}
                            onChange={(values) => onEdit(row.id, values)}
                          />
                        </Collapse>
                      </Box>
                    );
                  })}
                  {group.skills.map((skill) => (
                    <Box component="li" key={skill.id}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selected.has(skill.id) && canSelect(skill)}
                            disabled={!canSelect(skill)}
                            onChange={(e) => onToggle([skill.id], e.target.checked)}
                          />
                        }
                        label={
                          skill.status === "duplicate"
                            ? `${skill.name} (${text.alreadyOnProfile})`
                            : skill.name
                        }
                      />
                    </Box>
                  ))}
                </Stack>
              </>
            )}
          </Box>
        );
      })}
      {hasSkipped && (
        <Alert severity="info" icon={false}>
          <Typography variant="subtitle2" component="h3">
            {text.skippedTitle}
          </Typography>
          {preview.skippedColumns.length > 0 &&
            Object.entries(
              preview.skippedColumns.reduce<Record<string, string[]>>((acc, c) => {
                (acc[c.file] ??= []).push(c.column);
                return acc;
              }, {}),
            ).map(([file, columns]) => (
              <Typography key={file} variant="body2">
                {text.skippedColumns
                  .replace("{file}", file)
                  .replace("{columns}", columns.join(", "))}
              </Typography>
            ))}
          {preview.missingFiles.length > 0 && (
            <Typography variant="body2">
              {text.missingFiles.replace("{files}", preview.missingFiles.join(", "))}
            </Typography>
          )}
          {preview.skippedFileCount > 0 && (
            <Typography variant="body2">
              {text.skippedFiles.replace("{count}", String(preview.skippedFileCount))}
            </Typography>
          )}
        </Alert>
      )}
    </Stack>
  );
};
