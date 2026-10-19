"use client";

import { type FC, useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

const KEY_PREFIX = "gradfolio:import-prompt:";

const read = (key: string): boolean => {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

const write = (key: string) => {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Without storage the prompt is simply shown again next time.
  }
};

/**
 * A standing offer to import from a connected integration. "Not now" is remembered in this
 * browser under `storageKey`; the page works without storage. It renders nothing until the
 * browser has been asked, so a dismissed prompt never flashes. Importing is the owner's
 * action: `onImport` only opens the dialog. Generic on purpose: LinkedIn reuses it (M7-T43).
 */
export const ImportPrompt: FC<{
  storageKey: string;
  title: string;
  body: string;
  importLabel: string;
  dismissLabel: string;
  onImport: (trigger: HTMLElement) => void;
  /** Where focus goes when the prompt is dismissed and takes its own buttons away. */
  onDismissed?: () => void;
}> = ({ storageKey, title, body, importLabel, dismissLabel, onImport, onDismissed }) => {
  const key = KEY_PREFIX + storageKey;
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const titleId = `import-prompt-${storageKey.replace(/[^a-z0-9]/gi, "-")}`;

  useEffect(() => setDismissed(read(key)), [key]);

  if (dismissed !== false) return null;
  return (
    <Box
      component="section"
      aria-labelledby={titleId}
      sx={{ mt: 2, p: 2, borderRadius: 2, border: 1, borderColor: "divider" }}
    >
      <Typography id={titleId} variant="subtitle2" component="h3">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {body}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
        <Button size="small" variant="contained" onClick={(event) => onImport(event.currentTarget)}>
          {importLabel}
        </Button>
        <Button
          size="small"
          color="inherit"
          onClick={() => {
            write(key);
            setDismissed(true);
            onDismissed?.();
          }}
        >
          {dismissLabel}
        </Button>
      </Stack>
    </Box>
  );
};
