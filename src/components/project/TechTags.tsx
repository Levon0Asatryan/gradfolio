"use client";

import { FC, memo } from "react";
import { Stack } from "@mui/material";
import Tag from "./shared/Tag";
import SectionCard from "./SectionCard";

export interface TechTagsProps {
  items: string[];
  onTagClick?: (tag: string) => void;
}

const TechTags: FC<TechTagsProps> = ({ items, onTagClick }) => {
  if (!items || items.length === 0) return null;
  return (
    <SectionCard title="Technologies / Skills">
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {items.map((t) => (
          <Tag key={t} label={t} onClick={onTagClick} />
        ))}
      </Stack>
    </SectionCard>
  );
};

export default memo(TechTags);
