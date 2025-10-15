"use server";

import { cookies } from "next/headers";
import { cookiesThemeKey } from "@/utils/constants/constants";

export async function setThemeCookie(mode: "light" | "dark") {
  const cookieStore = await cookies();
  cookieStore.set(cookiesThemeKey, mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
