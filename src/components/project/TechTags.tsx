"use client";

import { FC, memo } from "react";
import { Stack } from "@mui/material";
import TagLink from "@/components/shared/TagLink";
import { Panel } from "@/components/layout/Panel";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface TechTagsProps {
  items: string[];
}

/** The project's technologies; each leads to its tag page. */
const TechTags: FC<TechTagsProps> = ({ items }) => {
  const { t } = useLanguage();

  if (!items || items.length === 0) return null;
  return (
    <Panel title={t.common.technologies}>
      <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
        {items.map((name) => (
          <TagLink key={name} name={name} />
        ))}
      </Stack>
    </Panel>
  );
};

export default memo(TechTags);
