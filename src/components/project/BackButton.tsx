"use client";

import { FC } from "react";
import { Button } from "@mui/material";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLanguage } from "@/components/i18n/LanguageContext";

const BackButton: FC = () => {
  const { t } = useLanguage();

  return (
    <Button
      component={Link}
      href="/projects"
      variant="text"
      startIcon={<ArrowBackIcon />}
      aria-label={t.common.backToProjects}
      sx={{ mb: 1 }}
    >
      {t.common.backToProjects}
    </Button>
  );
};

export default BackButton;
