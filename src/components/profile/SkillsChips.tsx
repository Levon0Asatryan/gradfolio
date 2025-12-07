"use client";

import { FC, memo } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import SectionCard from "./shared/SectionCard";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface SkillsChipsProps {
  items: string[];
}

const SkillsChips: FC<SkillsChipsProps> = ({ items }) => {
  const { t } = useLanguage();

  return (
    <SectionCard title={t.profile.skills}>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t.profile.noSkills}
        </Typography>
      ) : (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {items.map((s) => (
            <Chip key={s} label={s} size="small" aria-label={`Skill ${s}`} />
          ))}
        </Stack>
      )}
    </SectionCard>
  );
};

export default memo(SkillsChips);
