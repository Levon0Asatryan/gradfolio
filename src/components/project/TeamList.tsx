"use client";

import { FC, memo } from "react";
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import SectionCard from "./SectionCard";
import type { TeamMember } from "@/data/project.mock";

export interface TeamListProps {
  members?: TeamMember[];
}

import { useLanguage } from "@/components/i18n/LanguageContext";

const TeamList: FC<TeamListProps> = ({ members = [] }) => {
  const { t } = useLanguage();

  if (!members || members.length === 0) return null;

  return (
    <SectionCard title={t.common.teamMembers}>
      <List sx={{ py: 0 }}>
        {members.map((m) => (
          <ListItem key={m.id} divider>
            <ListItemAvatar>
              <Avatar sx={{ width: 36, height: 36 }} aria-hidden>
                {/* Next/Image doesn't fit inside Avatar src; we rely on Avatar img fallback */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.avatarUrl || "/light_logo.png"}
                  alt={m.name + " avatar"}
                  width={36}
                  height={36}
                />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                m.profileUrl ? (
                  <MuiLink href={m.profileUrl} underline="hover">
                    {m.name}
                  </MuiLink>
                ) : (
                  <Typography component="span" variant="subtitle2">
                    {m.name}
                  </Typography>
                )
              }
              secondary={m.role}
            />
          </ListItem>
        ))}
      </List>
    </SectionCard>
  );
};

export default memo(TeamList);
