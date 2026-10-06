"use client";

import { FC, memo } from "react";
import { Stack } from "@mui/material";
import Tag from "./shared/Tag";
import { Panel } from "@/components/layout/Panel";

export interface TechTagsProps {
  items: string[];
  onTagClick?: (tag: string) => void;
}

import { useLanguage } from "@/components/i18n/LanguageContext";

const TechTags: FC<TechTagsProps> = ({ items, onTagClick }) => {
  const { t } = useLanguage();

  if (!items || items.length === 0) return null;
  return (
    <Panel title={t.common.technologies}>
      <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
        {items.map((t) => (
          <Tag key={t} label={t} onClick={onTagClick} />
        ))}
      </Stack>
    </Panel>
  );
};

export default memo(TechTags);
