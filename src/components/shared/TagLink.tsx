"use client";

import { FC, memo } from "react";
import Link from "next/link";
import Chip from "@mui/material/Chip";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { tagHref } from "@/lib/discovery/query";

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * A tag that leads to its page. Use it only where it is not inside another link (the
 * project page, the profile): a result card is one link, and its chips stay plain.
 */
const TagLink: FC<{ name: string }> = ({ name }) => {
  const { t } = useLanguage();
  return (
    <Chip
      component={Link}
      href={tagHref(name)}
      clickable
      size="small"
      label={name}
      aria-label={fill(t.tags.openTag, { tag: name })}
      sx={{ minHeight: 32 }}
    />
  );
};

export default memo(TagLink);
