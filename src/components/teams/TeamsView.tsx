"use client";

import { type FC, type ReactNode, useId, useState } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { FlashToast } from "@/components/shared/FlashToast";
import { TeamSection } from "@/components/team/TeamSection";
import type { MyTeams } from "@/lib/api/types";
import { IncomingRow, OutgoingRow } from "./InviteLists";

export interface TeamsViewProps {
  teams: MyTeams;
  /** The caller's account id, to offer "Leave" on their own row of a joined project. */
  viewerUserId: string | null;
  /** The link to the next page of each list (the others keep their page); absent on the last page. */
  more: Partial<Record<"owned" | "member" | "incoming" | "outgoing", string>>;
  /** `/teams` without cursors, when any list is past its first page. */
  firstHref: string | null;
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const Section: FC<{ title: string; level?: 2 | 3; children: ReactNode }> = ({
  title,
  level = 2,
  children,
}) => {
  const id = useId();
  return (
    <Box
      component="section"
      aria-labelledby={id}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Typography
        id={id}
        variant={level === 2 ? "h5" : "h6"}
        component={`h${level}`}
        sx={{ fontWeight: 800 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};

const Empty: FC<{ title: string; hint?: string; action?: ReactNode }> = ({
  title,
  hint,
  action,
}) => (
  <Box
    sx={(theme) => ({
      p: 2,
      borderRadius: 2,
      border: `2px dashed ${theme.palette.divider}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 1,
    })}
  >
    <Typography variant="subtitle2">{title}</Typography>
    {hint && (
      <Typography variant="body2" color="text.secondary">
        {hint}
      </Typography>
    )}
    {action}
  </Box>
);

const ShowMore: FC<{ href?: string }> = ({ href }) => {
  const { t } = useLanguage();
  return href ? (
    <Button component={NextLink} href={href} sx={{ alignSelf: "flex-start", minHeight: 44 }}>
      {t.teamsPage.nextPage}
    </Button>
  ) : null;
};

const list = { listStyle: "none", m: 0, p: 0 } as const;

/**
 * The teams page: invitations in and out, the team of each of my projects (the same section as the
 * project page, one implementation), and the projects I joined, where I can leave.
 */
export const TeamsView: FC<TeamsViewProps> = ({ teams, viewerUserId, more, firstHref }) => {
  const { t } = useLanguage();
  const text = t.teamsPage;
  const [toast, setToast] = useState<string | null>(null);

  return (
    <PageContainer maxWidth={1000}>
      <FlashToast />
      <PageHeader title={text.title} subtitle={text.subtitle} />
      {firstHref && (
        <Link
          component={NextLink}
          href={firstHref}
          underline="hover"
          sx={{ alignSelf: "flex-start" }}
        >
          {text.firstPage}
        </Link>
      )}

      <Section title={text.invitesTitle}>
        <Section title={text.incomingTitle} level={3}>
          {teams.incoming.items.length === 0 ? (
            <Empty title={text.incomingEmpty} />
          ) : (
            <Box component="ul" sx={list}>
              {teams.incoming.items.map((invite) => (
                <IncomingRow key={invite.id} invite={invite} onDone={setToast} />
              ))}
            </Box>
          )}
          <ShowMore href={more.incoming} />
        </Section>
        <Section title={text.outgoingTitle} level={3}>
          {teams.outgoing.items.length === 0 ? (
            <Empty title={text.outgoingEmpty} />
          ) : (
            <Box component="ul" sx={list}>
              {teams.outgoing.items.map((invite) => (
                <OutgoingRow key={invite.id} invite={invite} onDone={setToast} />
              ))}
            </Box>
          )}
          <ShowMore href={more.outgoing} />
        </Section>
      </Section>

      <Section title={text.ownedTitle}>
        {teams.owned.items.length === 0 ? (
          <Empty
            title={text.ownedEmpty}
            hint={text.ownedEmptyHint}
            action={
              <Button
                component={NextLink}
                href="/projects"
                variant="outlined"
                sx={{ minHeight: 44 }}
              >
                {text.goToProjects}
              </Button>
            }
          />
        ) : (
          teams.owned.items.map((project) => (
            <TeamSection
              key={project.id}
              projectId={project.id}
              projectTitle={project.title}
              title={project.title}
              note={
                <Link
                  component={NextLink}
                  href={`/projects/${project.id}`}
                  underline="hover"
                  sx={{ alignSelf: "flex-start" }}
                >
                  {text.openProject}
                </Link>
              }
              isOwner
              isDraft={project.isDraft}
              members={[]}
              managed={project.members}
              viewerUserId={null}
            />
          ))
        )}
        <ShowMore href={more.owned} />
      </Section>

      <Section title={text.memberTitle}>
        {teams.member.items.length === 0 ? (
          <Empty title={text.memberEmpty} hint={text.memberEmptyHint} />
        ) : (
          teams.member.items.map((project) => (
            <TeamSection
              key={project.id}
              projectId={project.id}
              projectTitle={project.title}
              title={project.title}
              note={
                <Typography variant="body2" color="text.secondary">
                  {fill(text.ownerLabel, { name: project.owner.name })}
                  {project.role ? ` · ${fill(text.yourRole, { role: project.role })}` : ""}
                  {" · "}
                  <Link component={NextLink} href={`/projects/${project.id}`} underline="always">
                    {text.openProject}
                  </Link>
                </Typography>
              }
              isOwner={false}
              isDraft={false}
              members={project.team}
              managed={null}
              viewerUserId={viewerUserId}
              leaveRedirect="/teams?flash=left"
            />
          ))
        )}
        <ShowMore href={more.member} />
      </Section>

      <Snackbar
        open={toast !== null}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setToast(null)} closeText={t.team.close}>
          {toast}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};
