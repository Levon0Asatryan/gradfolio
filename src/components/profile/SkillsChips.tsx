"use client";

import { FC, memo } from "react";
import { Stack, Typography } from "@mui/material";
import TagLink from "@/components/shared/TagLink";
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
            <TagLink key={s} name={s} />
          ))}
        </Stack>
      )}
    </SectionCard>
  );
};

export default memo(SkillsChips);
