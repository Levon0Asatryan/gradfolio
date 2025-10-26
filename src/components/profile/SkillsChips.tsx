"use client";

import { FC, memo } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import SectionCard from "./shared/SectionCard";

export interface SkillsChipsProps {
  items: string[];
}

const SkillsChips: FC<SkillsChipsProps> = ({ items }) => {
  return (
    <SectionCard title="Skills">
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No skills yet.
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
