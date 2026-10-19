import type { Metadata } from "next";
import { IntegrationsError } from "@/components/integrations/IntegrationsError";
import { IntegrationsView } from "@/components/integrations/IntegrationsView";
import { ApiError, getIntegrations } from "@/lib/api/client";
import { loadInboxAction } from "@/lib/integrations/suggestionActions";
import { offerGithubImport } from "@/lib/integrations/importOffer";
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
  // Read with the page so the cards are in the first paint (no jump below them). A failed read
  // is the inbox's own error state in the browser, never an empty list here.
  const suggestionsRead = loadInboxAction();
  try {
    integrations = await getIntegrations();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return <IntegrationsError code={error.code} returnTo="/integrations" />;
  }
  const read = await suggestionsRead;
  const suggestions = read.ok ? { items: read.items, more: read.more } : null;
  const offer = await offerGithubImport(integrations.github.status === "connected");
  return (
    <IntegrationsView integrations={integrations} offerImport={offer} suggestions={suggestions} />
  );
}
