import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { signInReturnTo } from "@/lib/auth/signInReturnTo";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return <SignInPrompt returnTo={signInReturnTo(query.returnTo)} />;
}
