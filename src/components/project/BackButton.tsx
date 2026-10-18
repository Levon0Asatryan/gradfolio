"use client";

import { FC } from "react";
import { Button } from "@mui/material";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLanguage } from "@/components/i18n/LanguageContext";

const BackButton: FC<{ isOwner: boolean }> = ({ isOwner }) => {
  const { t } = useLanguage();

  return (
    <Button
      component={Link}
      href={isOwner ? "/projects" : "/browse/projects"}
      variant="text"
      startIcon={<ArrowBackIcon />}
      sx={{ alignSelf: "flex-start", ml: -1.5 }}
    >
      {t.common.backToProjects}
    </Button>
  );
};

export default BackButton;
