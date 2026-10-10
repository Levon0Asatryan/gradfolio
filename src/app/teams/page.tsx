import { ProjectsError } from "@/components/projects/ProjectsError";
import { TeamsView } from "@/components/teams/TeamsView";
import { ApiError, getMe, getMyTeams } from "@/lib/api/client";
import { parseTeamsQuery, teamsHref, toApiQuery } from "@/lib/teams/query";

export const dynamic = "force-dynamic";
export const metadata = { title: "Teams" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The caller's teams (`GET /v1/me/teams`): invitations in and out, teams of their projects, projects
 * they joined. Login required (proxy). Each list pages on its own cursor, kept in the URL, so a page
 * can be reloaded and shared. A failed load is an error, never "no teams yet".
 */
export default async function TeamsPage({ searchParams }: PageProps) {
  const cursors = parseTeamsQuery(await searchParams);
  let teams;
  try {
    teams = await getMyTeams(toApiQuery(cursors));
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return <ProjectsError what="teams" code={error.code} returnTo="/teams" />;
  }

  // Only a joined project needs the viewer's id (to offer Leave on their own row). If it cannot be
  // read, Leave is simply not offered: the API still refuses a stranger's call.
  let viewerUserId: string | null = null;
  if (teams.member.items.length > 0) {
    try {
      viewerUserId = (await getMe()).id;
    } catch {
      viewerUserId = null;
    }
  }

  const more = {
    owned: teams.owned.nextCursor
      ? teamsHref({ ...cursors, owned: teams.owned.nextCursor })
      : undefined,
    member: teams.member.nextCursor
      ? teamsHref({ ...cursors, member: teams.member.nextCursor })
      : undefined,
    incoming: teams.incoming.nextCursor
      ? teamsHref({ ...cursors, incoming: teams.incoming.nextCursor })
      : undefined,
    outgoing: teams.outgoing.nextCursor
      ? teamsHref({ ...cursors, outgoing: teams.outgoing.nextCursor })
      : undefined,
  };
  const firstHref = Object.keys(cursors).length > 0 ? "/teams" : null;

  return <TeamsView teams={teams} viewerUserId={viewerUserId} more={more} firstHref={firstHref} />;
}
