"use client";

import { FC } from "react";
import Chip from "@mui/material/Chip";
import { useLanguage } from "@/components/i18n/LanguageContext";

/** Shown to the owner only (the API answers 404 to everyone else): why nobody else can open this. */
export const OwnerStateChips: FC<{ isDraft: boolean }> = ({ isDraft }) => {
  const { t } = useLanguage();
  return (
    <div>
      <Chip variant="outlined" label={isDraft ? t.projects.draft : t.projects.private} />
    </div>
  );
};
