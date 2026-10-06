import type { Metadata, Viewport } from "next";
import { Nunito, Noto_Sans_Armenian } from "next/font/google";
import { SideBarWrapper } from "@/components/sidebar/SideBarWrapper";
import { SidebarVisibilityProvider } from "@/components/layout/SidebarVisibilityContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { htmlLang, isLanguage } from "@/components/i18n/language";
import { SkipLink } from "@/components/layout/SkipLink";
import { cookies } from "next/headers";
import { type ReactNode } from "react";
import type { ThemeMode } from "@/components/theme/utils/types/types";
import { cookiesLanguageKey, cookiesThemeKey } from "@/utils/constants/constants";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ThemeRegistry from "@/components/theme/ThemeRegistry";
import type { NavUser } from "@/components/navigation/AppNavigation";
import { auth0 } from "@/lib/auth0";
import { safeHttpUrl } from "@/utils/helpers/safeHttpUrl";

// Nunito has no Armenian glyphs: Noto Sans Armenian fills them in (see FONT_STACK).
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const notoArmenian = Noto_Sans_Armenian({
  variable: "--font-noto-armenian",
  subsets: ["armenian"],
  display: "swap",
});

const DESCRIPTION =
  "Gradfolio is a student portfolio platform: projects, skills and achievements, each backed by evidence.";
// Provisional tagline: Levon confirms it.
const TAGLINE = "Your projects, backed by evidence.";

export const metadata: Metadata = {
  title: { default: "Gradfolio", template: "%s | Gradfolio" },
  description: DESCRIPTION,
  applicationName: "Gradfolio",
  openGraph: {
    type: "website",
    siteName: "Gradfolio",
    title: "Gradfolio",
    description: TAGLINE,
  },
  twitter: { card: "summary_large_image", title: "Gradfolio", description: TAGLINE },
};

/** The browser chrome takes the brand blue (palette C primary). */
export const viewport: Viewport = { themeColor: "#1D4ED8" };

/**
 * The signed-in user for the navigation, or null for a visitor. Display only:
 * which pages need a login is decided in proxy.ts, which fails closed. If the
 * session cannot be read here, the menu shows the signed-out state.
 */
async function navUser(): Promise<NavUser | null> {
  try {
    const session = await auth0.getSession();
    if (!session) return null;
    const { name, email, picture } = session.user;
    return {
      name: typeof name === "string" && name ? name : typeof email === "string" ? email : "",
      picture: typeof picture === "string" ? safeHttpUrl(picture) : undefined,
    };
  } catch (error) {
    console.error("layout: session unreadable", {
      error: error instanceof Error ? error.name : typeof error,
    });
    return null;
  }
}

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: Readonly<RootLayoutProps>) {
  const cookieStore = await cookies();

  const initialMode = cookieStore.get(cookiesThemeKey)?.value as ThemeMode | undefined;
  const savedLanguage = cookieStore.get(cookiesLanguageKey)?.value;
  const language = isLanguage(savedLanguage) ? savedLanguage : "en";
  const user = await navUser();

  return (
    <html lang={htmlLang(language)}>
      <body
        className={`${nunito.variable} ${notoArmenian.variable}`}
        style={{ padding: 0, margin: 0 }}
      >
        <ThemeRegistry>
          <ThemeWrapper initialMode={initialMode}>
            <LanguageProvider initialLanguage={language}>
              <SkipLink />
              <SidebarVisibilityProvider>
                <SideBarWrapper user={user}>{children}</SideBarWrapper>
              </SidebarVisibilityProvider>
            </LanguageProvider>
          </ThemeWrapper>
        </ThemeRegistry>

        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
