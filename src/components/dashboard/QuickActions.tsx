"use client";

import { FC, memo } from "react";
import Link from "next/link";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ExploreIcon from "@mui/icons-material/Explore";
import ExtensionIcon from "@mui/icons-material/Extension";
import { Panel } from "@/components/layout/Panel";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface QuickActionsProps {
  editProfileHref: string;
}

const QuickActions: FC<QuickActionsProps> = ({ editProfileHref }) => {
  const { t } = useLanguage();
  const actions = [
    { href: "/projects/new", icon: <AddIcon />, label: t.common.addNewProject },
    { href: editProfileHref, icon: <EditIcon />, label: t.common.editProfile },
    { href: "/search", icon: <ExploreIcon />, label: t.common.explorePortfolios },
    { href: "/integrations", icon: <ExtensionIcon />, label: t.common.integrations },
  ];

  return (
    <Panel title={t.dashboard.quickActions}>
      <Stack spacing={1}>
        {actions.map((a) => (
          <Button
            key={a.href}
            component={Link}
            href={a.href}
            variant="outlined"
            color="inherit"
            startIcon={a.icon}
            sx={{
              justifyContent: "flex-start",
              textAlign: "left",
              py: 1,
              borderWidth: 1,
              borderColor: "divider",
              "&:hover": { borderWidth: 1, borderColor: "primary.main" },
            }}
          >
            {a.label}
          </Button>
        ))}
      </Stack>
    </Panel>
  );
};

export default memo(QuickActions);
