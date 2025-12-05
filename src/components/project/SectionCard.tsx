"use client";

import { Card, CardContent, CardHeader, SxProps, Typography } from "@mui/material";
import { FC, ReactNode, memo } from "react";

export interface SectionCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps;
  subheader?: ReactNode;
}

const SectionCard: FC<SectionCardProps> = ({ title, action, children, sx, subheader }) => {
  return (
    <Card component="section" sx={{ mb: 3, ...(sx as object) }} aria-label={title}>
      <CardHeader
        title={
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
        }
        action={action}
        subheader={subheader}
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default memo(SectionCard);
