import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider, useLanguage } from "./LanguageContext";
import { htmlLang, isLanguage } from "./language";

const Probe = () => {
  const { language, setLanguage } = useLanguage();
  return <button onClick={() => setLanguage("am")}>{language}</button>;
};

beforeEach(() => {
  localStorage.clear();
  document.cookie = "language=; max-age=0; path=/";
  document.documentElement.lang = "en";
});

describe("language and <html lang>", () => {
  it("maps the UI language to a BCP 47 tag (Armenian is hy)", () => {
    expect(htmlLang("en")).toBe("en");
    expect(htmlLang("ru")).toBe("ru");
    expect(htmlLang("am")).toBe("hy");
  });

  it("accepts only the three languages", () => {
    expect(isLanguage("ru")).toBe(true);
    expect(isLanguage("de")).toBe(false);
    expect(isLanguage(null)).toBe(false);
  });

  it("starts in the language the server read from the cookie", () => {
    render(
      <LanguageProvider initialLanguage="ru">
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("ru");
    expect(document.documentElement.lang).toBe("ru");
  });

  it("keeps a choice saved before the cookie existed, and mirrors it into the cookie", () => {
    localStorage.setItem("language", "ru");
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("ru");
    expect(document.cookie).toContain("language=ru");
  });

  it("retitles the dashboard tab when it migrates a saved language the server did not see", () => {
    localStorage.setItem("language", "ru");
    document.title = "Dashboard | Gradfolio";
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(document.title).toBe("Дашборд | Gradfolio");
  });

  it("leaves another page's tab title alone when it migrates", () => {
    localStorage.setItem("language", "ru");
    document.title = "Settings | Gradfolio";
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(document.title).toBe("Settings | Gradfolio");
  });

  it("lets the cookie win over an older localStorage value", () => {
    localStorage.setItem("language", "en");
    document.cookie = "language=am; path=/";
    render(
      <LanguageProvider initialLanguage="am">
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("am");
    expect(document.documentElement.lang).toBe("hy");
  });

  it("changing the language updates <html lang>, the cookie and localStorage", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    act(() => screen.getByRole("button").click());
    expect(document.documentElement.lang).toBe("hy");
    expect(document.cookie).toContain("language=am");
    expect(localStorage.getItem("language")).toBe("am");
  });
});
