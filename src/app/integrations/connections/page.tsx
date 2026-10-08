import type { Metadata } from "next";
import { requestDictionary } from "@/lib/requestDictionary";
import { ConnectionsContent } from "./ConnectionsContent";

/** The tab title in the UI language. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await requestDictionary();
  return { title: t.integrations.setup.title };
}

export default function Page() {
  return <ConnectionsContent />;
}
