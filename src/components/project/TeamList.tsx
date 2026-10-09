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
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";
import { Panel } from "@/components/layout/Panel";
import type { ProjectTeamMember } from "@/lib/api/types";

export interface TeamListProps {
  members?: ProjectTeamMember[];
}

import { useLanguage } from "@/components/i18n/LanguageContext";

const TeamList: FC<TeamListProps> = ({ members = [] }) => {
  const { t } = useLanguage();

  if (!members || members.length === 0) return null;

  return (
    <Panel title={t.common.teamMembers}>
      <List disablePadding>
        {members.map((m) => (
          <ListItem key={m.id} divider>
            <ListItemAvatar>
              <Avatar sx={{ width: 36, height: 36 }} aria-hidden>
                {/* Next/Image doesn't fit inside Avatar src; we rely on Avatar img fallback */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={safeHttpsUrl(m.avatarUrl) ?? "/light_logo.png"}
                  alt=""
                  width={36}
                  height={36}
                />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                m.userId ? (
                  <MuiLink href={`/profile/${m.userId}`} underline="hover">
                    {m.name}
                  </MuiLink>
                ) : (
                  <Typography component="span" variant="subtitle2">
                    {m.name}
                  </Typography>
                )
              }
              secondary={m.role ?? undefined}
            />
          </ListItem>
        ))}
      </List>
    </Panel>
  );
};

export default memo(TeamList);
