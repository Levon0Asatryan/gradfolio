"use client";

import { FC, memo, useCallback, useMemo, useState } from "react";
import { Box, Button, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import SectionCard from "./shared/SectionCard";
import DetailDialog from "./shared/DetailDialog";
import type { Education } from "@/data/profile.mock";

export interface EducationListProps {
  items: Education[];
}

const EducationList: FC<EducationListProps> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const onOpen = useCallback((id: string) => setOpenId(id), []);
  const onClose = useCallback(() => setOpenId(null), []);

  const active = useMemo(() => items.find((e) => e.id === openId), [items, openId]);

  return (
    <SectionCard title="Education">
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No education entries yet.
        </Typography>
      ) : (
        <List sx={{ py: 0 }}>
          {items.map((edu) => {
            const primary = `${edu.degree} • ${edu.field}`;
            const secondary = `${edu.institution} • ${edu.startYear}${edu.endYear ? "–" + edu.endYear : " – Present"}`;
            return (
              <ListItem
                key={edu.id}
                divider
                secondaryAction={
                  <Button
                    aria-label={`View details for ${primary} at ${edu.institution}`}
                    aria-haspopup="dialog"
                    aria-expanded={openId === edu.id}
                    onClick={() => onOpen(edu.id)}
                    size="small"
                  >
                    Details
                  </Button>
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="subtitle1" component="span">
                        {primary}
                      </Typography>
                    </Stack>
                  }
                  secondary={secondary}
                />
              </ListItem>
            );
          })}
        </List>
      )}

      <DetailDialog open={Boolean(active)} title={active ? active.institution : "Education"} onClose={onClose}>
        {active && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {active.degree} • {active.field}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {active.startYear}
              {active.endYear ? `–${active.endYear}` : " – Present"}
            </Typography>
            {active.description && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                {active.description}
              </Typography>
            )}
            {active.highlights && active.highlights.length > 0 && (
              <Box component="ul" sx={{ pl: 3, m: 0 }}>
                {active.highlights.map((h, i) => (
                  <Typography component="li" key={i} variant="body2" sx={{ mb: 0.5 }}>
                    {h}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DetailDialog>
    </SectionCard>
  );
};

export default memo(EducationList);
