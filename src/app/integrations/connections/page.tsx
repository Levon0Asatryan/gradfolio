import type { Metadata } from "next";
import { IntegrationsError } from "@/components/integrations/IntegrationsError";
import { ApiError, getIntegrations } from "@/lib/api/client";
import { requestDictionary } from "@/lib/requestDictionary";
import { ConnectionsContent } from "./ConnectionsContent";

export const dynamic = "force-dynamic";

/** The tab title in the UI language. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await requestDictionary();
  return { title: t.integrations.setup.title };
}

export default async function Page() {
  let integrations;
  try {
    integrations = await getIntegrations();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return <IntegrationsError code={error.code} returnTo="/integrations/connections" />;
  }
  return <ConnectionsContent integrations={integrations} />;
}
