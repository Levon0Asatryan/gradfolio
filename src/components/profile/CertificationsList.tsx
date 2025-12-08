"use client";

import { FC, memo } from "react";
import { Link as MuiLink, List, ListItem, ListItemText, Typography } from "@mui/material";
import SectionCard from "./shared/SectionCard";
import type { Certification } from "@/data/profile.mock";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface CertificationsListProps {
  items: Certification[];
}

const CertificationsList: FC<CertificationsListProps> = ({ items }) => {
  const { t } = useLanguage();

  return (
    <SectionCard title={t.profile.certifications}>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t.profile.noCertifications}
        </Typography>
      ) : (
        <List sx={{ py: 0 }}>
          {items.map((c) => (
            <ListItem key={c.id} divider>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" component="span">
                    {c.name}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.secondary">
                      {c.issuer} • {c.date}
                    </Typography>
                    {c.credentialUrl && (
                      <>
                        {" "}
                        —{" "}
                        <MuiLink href={c.credentialUrl} target="_blank" rel="noopener noreferrer">
                          {t.profile.verify}
                        </MuiLink>
                      </>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </SectionCard>
  );
};

export default memo(CertificationsList);
