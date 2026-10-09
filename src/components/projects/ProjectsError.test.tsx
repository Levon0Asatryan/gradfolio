import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ProjectsError } from "./ProjectsError";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const show = (code: string, what?: "list" | "project") =>
  render(
    <LanguageProvider>
      <ProjectsError code={code} returnTo="/projects?q=a%26b" what={what} />
    </LanguageProvider>,
  );

describe("ProjectsError", () => {
  it.each([
    ["API_UNREACHABLE", /not responding/],
    ["API_NOT_CONFIGURED", /not connected/],
    ["WHATEVER", /Something went wrong/],
  ])("%s is an error with a retry, not an empty list", (code, text) => {
    show(code);
    expect(screen.getByRole("alert")).toHaveTextContent(text);
    expect(screen.getByRole("alert")).toHaveTextContent("Projects could not be loaded");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText("No projects yet")).toBeNull();
  });

  it("names the project, not the list, on a detail page", () => {
    show("API_UNREACHABLE", "project");
    expect(screen.getByRole("alert")).toHaveTextContent("This project could not be loaded");
  });

  it("sends an expired session back to the same page after login", () => {
    show("UNAUTHENTICATED");
    expect(screen.getByRole("link", { name: "Auth0 Login" })).toHaveAttribute(
      "href",
      "/auth/login?returnTo=%2Fprojects%3Fq%3Da%2526b",
    );
  });
});
