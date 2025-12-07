import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard",
};

export default function Page() {
  redirect("/");
  return null;
}
