"use client";

import { Box, Card, CardContent, CardHeader, SxProps, Typography } from "@mui/material";
import { FC, ReactNode, memo } from "react";

export interface SectionCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps;
  subheader?: ReactNode;
  /** A small icon in a tinted tile before the title. */
  icon?: ReactNode;
}

const SectionCard: FC<SectionCardProps> = ({ title, action, children, sx, subheader, icon }) => {
  return (
    <Card component="section" sx={{ mb: 3, ...((sx as object) || {}) }} aria-label={title}>
      <CardHeader
        avatar={
          icon ? (
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                width: 40,
                height: 40,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                bgcolor: theme.palette.surface.soft,
                color: theme.palette.primary.main,
              })}
            >
              {icon}
            </Box>
          ) : undefined
        }
        title={
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
        }
        action={action}
        subheader={subheader}
        sx={{ "& .MuiCardHeader-action": { alignSelf: "center", m: 0 } }}
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default memo(SectionCard);
