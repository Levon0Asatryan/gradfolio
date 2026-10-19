"use client";

import { type FC, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Link as MuiLink, Menu, MenuItem, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { GithubImportModal } from "@/components/github-import/GithubImportModal";
import { useLanguage } from "@/components/i18n/LanguageContext";

/**
 * Projects → Add. With GitHub connected it offers two choices: "Create manually" (the form) and
 * "Import from GitHub" (the one import dialog, on the repos tab). Without it, Add goes straight
 * to the form, with a small link to connect. `github` is the API's answer, read on the server; a
 * failed read is "unknown" (said so, with Retry), never "not connected".
 */
export type GithubStatus = "connected" | "not_connected" | "unknown";

export const AddProjectButton: FC<{ github: GithubStatus }> = ({ github }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const text = t.projects.addChoices;
  const trigger = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menu = anchor !== null;
  const [importing, setImporting] = useState(false);

  if (github !== "connected") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
        <Button component={Link} href="/projects/new" variant="contained" startIcon={<AddIcon />}>
          {t.common.addNewProject}
        </Button>
        {github === "unknown" ? (
          <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
            <Typography variant="caption" color="text.secondary" role="status">
              {text.statusUnavailable}
            </Typography>
            <MuiLink
              component="button"
              type="button"
              variant="caption"
              onClick={() => router.refresh()}
            >
              {text.retry}
            </MuiLink>
          </Box>
        ) : (
          <MuiLink component={Link} href="/integrations" variant="caption">
            {text.connectToImport}
          </MuiLink>
        )}
      </Box>
    );
  }

  return (
    <>
      <Button
        ref={trigger}
        variant="contained"
        startIcon={<AddIcon />}
        aria-haspopup="menu"
        aria-expanded={menu}
        aria-controls={menu ? "add-project-menu" : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {t.common.addNewProject}
      </Button>
      <Menu id="add-project-menu" open={menu} anchorEl={anchor} onClose={() => setAnchor(null)}>
        <MenuItem component={Link} href="/projects/new" onClick={() => setAnchor(null)}>
          {text.createManually}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            setImporting(true);
          }}
        >
          {text.importFromGithub}
        </MenuItem>
      </Menu>
      <GithubImportModal
        open={importing}
        onClose={() => setImporting(false)}
        returnFocusTo={() => trigger.current}
      />
    </>
  );
};
