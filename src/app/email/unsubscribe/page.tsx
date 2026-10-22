import { EmailUnsubscribe } from "@/components/settings/EmailUnsubscribe";

export const metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function Page() {
  return <EmailUnsubscribe />;
}
