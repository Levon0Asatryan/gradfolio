import { LandingSections, type Section } from "@/components/browse/LandingSections";
import { ApiError, browsePeople, browseProjects, getTagCloud } from "@/lib/api/client";

const LANDING_SIZE = 6;
const CLOUD_SIZE = 30;

/** One section's data; an API failure becomes `failed`, anything else is a bug and surfaces. */
async function section<T>(read: () => Promise<T>): Promise<Section<T>> {
  try {
    return { items: await read() };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { failed: true };
  }
}

/** The landing of `/search`: three independent reads, in parallel, none needing a login. */
export async function Landing() {
  const [cloud, projects, people] = await Promise.all([
    section(async () => (await getTagCloud(CLOUD_SIZE)).items),
    section(async () => (await browseProjects({ limit: LANDING_SIZE })).items),
    section(async () => (await browsePeople({ limit: LANDING_SIZE })).items),
  ]);
  return <LandingSections cloud={cloud} projects={projects} people={people} />;
}
