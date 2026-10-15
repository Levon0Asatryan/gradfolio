"use client";

import type { FC } from "react";
import { Typography } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Integrations } from "@/lib/api/types";
import IntegrationCard from "./IntegrationCard";

/**
 * LinkedIn has no token to connect or revoke (Q8): "connected" means the account signs in with
 * LinkedIn. The history arrives by uploading the member's own data export (a later step), so
 * this card has no connect button and does not pretend to sync.
 */
export const LinkedinCard: FC<{ linkedin: Integrations["linkedin"] }> = ({ linkedin }) => {
  const { t } = useLanguage();
  const text = t.integrations;
  const connected = linkedin.status === "connected";
  return (
    <IntegrationCard
      id="linkedin"
      name="LinkedIn"
      description={text.linkedin.description}
      connected={connected}
      syncLabel={linkedin.lastSyncedAt ? text.linkedin.lastImport : undefined}
      syncedAt={linkedin.lastSyncedAt}
      detail={
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {connected ? text.linkedin.viaSignIn : text.linkedin.notViaSignIn}
        </Typography>
      }
    />
  );
};
