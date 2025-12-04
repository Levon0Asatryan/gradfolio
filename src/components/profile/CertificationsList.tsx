"use client";

import { FC, memo } from "react";
import { Link as MuiLink, List, ListItem, ListItemText, Typography } from "@mui/material";
import SectionCard from "./shared/SectionCard";
import type { Certification } from "@/data/profile.mock";

export interface CertificationsListProps {
  items: Certification[];
}

const CertificationsList: FC<CertificationsListProps> = ({ items }) => {
  return (
    <SectionCard title="Certifications">
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No certifications listed.
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
                          Verify
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
