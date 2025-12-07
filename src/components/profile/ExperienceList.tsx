"use client";

import { FC, memo, useCallback, useMemo, useState } from "react";
import { Box, Button, Chip, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import SectionCard from "./shared/SectionCard";
import DetailDialog from "./shared/DetailDialog";
import type { Experience } from "@/data/profile.mock";

import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ExperienceListProps {
  items: Experience[];
}

const ExperienceList: FC<ExperienceListProps> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const { t } = useLanguage();

  const onOpen = useCallback((id: string) => setOpenId(id), []);
  const onClose = useCallback(() => setOpenId(null), []);

  const active = useMemo(() => items.find((e) => e.id === openId), [items, openId]);

  const formatRange = (start?: string, end?: string) => {
    const fmt = (s?: string) =>
      s ? new Date(s + "-01").toLocaleString(undefined, { year: "numeric", month: "short" }) : "";
    const s = fmt(start);
    const e = end ? fmt(end) : t.common.present;
    return `${s} – ${e}`;
  };

  return (
    <SectionCard title={t.profile.experience}>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t.profile.noExperience}
        </Typography>
      ) : (
        <List sx={{ py: 0 }}>
          {items.map((exp) => (
            <ListItem
              key={exp.id}
              divider
              secondaryAction={
                <Button
                  aria-label={`${t.common.details} for ${exp.title} at ${exp.organization}`}
                  onClick={() => onOpen(exp.id)}
                  size="small"
                >
                  {t.common.details}
                </Button>
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="subtitle1" component="span">
                      {exp.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span">
                      • {exp.organization}
                    </Typography>
                  </Stack>
                }
                secondary={formatRange(exp.start, exp.end)}
              />
            </ListItem>
          ))}
        </List>
      )}

      <DetailDialog
        open={Boolean(active)}
        title={active ? active.title : t.profile.experience}
        onClose={onClose}
      >
        {active && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {active.organization}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {formatRange(active.start, active.end)}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {active.summary}
            </Typography>
            {active.achievements && active.achievements.length > 0 && (
              <Box component="ul" sx={{ pl: 3, m: 0, mb: 2 }}>
                {active.achievements.map((a, i) => (
                  <Typography key={i} component="li" variant="body2" sx={{ mb: 0.5 }}>
                    {a}
                  </Typography>
                ))}
              </Box>
            )}
            {active.skills && active.skills.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {active.skills.map((s) => (
                  <Chip key={s} label={s} size="small" />
                ))}
              </Stack>
            )}
          </Box>
        )}
      </DetailDialog>
    </SectionCard>
  );
};

export default memo(ExperienceList);
