import type { Metadata } from "next";
import { IntegrationsError } from "@/components/integrations/IntegrationsError";
import { IntegrationsView } from "@/components/integrations/IntegrationsView";
import { ApiError, getIntegrations } from "@/lib/api/client";
import { requestDictionary } from "@/lib/requestDictionary";

export const dynamic = "force-dynamic";

/** The tab title in the UI language. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await requestDictionary();
  return { title: t.integrations.title };
}

/**
 * GitHub and LinkedIn status from the API (`GET /v1/me/integrations`). A failed load is an
 * error with Retry, never "not connected": the user would read that and trust it.
 */
export default async function Page() {
  let integrations;
  try {
    integrations = await getIntegrations();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return <IntegrationsError code={error.code} returnTo="/integrations" />;
  }
  return <IntegrationsView integrations={integrations} />;
}
