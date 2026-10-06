import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import type { Language } from "@/data/locales/types";

/** Renders inside the real theme and language providers, as the app does. */
export function renderInApp(ui: ReactElement, language: Language = "en") {
  return render(
    <ThemeWrapper initialMode="light">
      <LanguageProvider initialLanguage={language}>{ui}</LanguageProvider>
    </ThemeWrapper>,
  );
}
