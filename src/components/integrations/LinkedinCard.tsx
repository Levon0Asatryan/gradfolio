"use client";

import { type FC, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mui/material";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { LinkedinImportModal } from "@/components/linkedin-import/LinkedinImportModal";
import type { Integrations } from "@/lib/api/types";
import IntegrationCard from "./IntegrationCard";

/**
 * LinkedIn has no token to connect or revoke (Q8), so the card shows no connection status. The history arrives by uploading the member's own data export, in the dialog this
 * card opens. The card is also step two of onboarding, so both places import the same way.
 */
export const LinkedinCard: FC<{ linkedin: Integrations["linkedin"] }> = ({ linkedin }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const text = t.integrations;
  const [open, setOpen] = useState(false);
  return (
    <>
      <IntegrationCard
        id="linkedin"
        name="LinkedIn"
        description={text.linkedin.description}
        syncLabel={linkedin.lastSyncedAt ? text.linkedin.lastImport : undefined}
        syncedAt={linkedin.lastSyncedAt}
      >
        <Button
          variant="outlined"
          startIcon={<FileUploadOutlined />}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          {t.linkedinImport.open}
        </Button>
      </IntegrationCard>
      <LinkedinImportModal
        open={open}
        onClose={() => setOpen(false)}
        onImported={() => router.refresh()}
      />
    </>
  );
};
