import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";

const mocks = vi.hoisted(() => ({ set: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/projects/actions", () => ({ setDraftStateAction: mocks.set }));

const { PublishButton } = await import("./PublishButton");

const ID = "0b6f2c1e-1111-4222-8333-444455556666";
const show = (
  props: Partial<React.ComponentProps<typeof PublishButton>> = {},
  lang: "en" | "ru" | "am" = "en",
) => renderInApp(<PublishButton projectId={ID} title="Thesis" isPublic {...props} />, lang);

beforeEach(() => vi.resetAllMocks());

describe("PublishButton", () => {
  it("asks first, and says who can see a public project afterwards; Cancel changes nothing", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    const dialog = screen.getByRole("dialog", { name: "Publish “Thesis”?" });
    expect(dialog).toHaveTextContent("anyone can see it, including visitors who are not signed in");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("a private project says it stays private", () => {
    show({ isPublic: false });
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("stays private");
  });

  it("publishes through the update API, without the edit form, and refreshes", async () => {
    mocks.set.mockResolvedValue({ ok: true, isDraft: false, isPublic: true });
    const onDone = vi.fn();
    show({ onDone });
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Publish" }));
    expect(await screen.findByText("Published.")).toBeVisible();
    expect(mocks.set).toHaveBeenCalledWith({ id: ID, draft: false });
    expect(mocks.refresh).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("moves a published project back to drafts when asked", async () => {
    mocks.set.mockResolvedValue({ ok: true, isDraft: true, isPublic: true });
    show({ mode: "draft" });
    fireEvent.click(screen.getByRole("button", { name: "Move back to drafts" }));
    const dialog = screen.getByRole("dialog", { name: "Move “Thesis” back to drafts?" });
    expect(dialog).toHaveTextContent("Only you will see it again");
    fireEvent.click(within(dialog).getByRole("button", { name: "Move to drafts" }));
    expect(await screen.findByText("Moved back to drafts.")).toBeVisible();
    expect(mocks.set).toHaveBeenCalledWith({ id: ID, draft: true });
  });

  it("a refusal keeps the dialog open with the API's reasons and an Edit link", async () => {
    mocks.set.mockResolvedValue({
      ok: false,
      code: "VALIDATION_FAILED",
      reasons: [{ path: "summary", message: "must not be empty" }],
    });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Publish" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Some fields need fixing");
    expect(alert).toHaveTextContent("summary: must not be empty");
    expect(screen.getByRole("link", { name: "Edit project" })).toHaveAttribute(
      "href",
      `/projects/${ID}/edit`,
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("an unknown code is the generic message, a 404 is not success", async () => {
    mocks.set.mockResolvedValue({ ok: false, code: "SOMETHING_NEW" });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Publish" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.queryByText("Published.")).toBeNull();
  });

  it("a double click sends one request", async () => {
    mocks.set.mockReturnValue(new Promise(() => {}));
    show();
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    const confirm = within(screen.getByRole("dialog")).getByRole("button", { name: "Publish" });
    act(() => {
      confirm.click();
      confirm.click();
    });
    expect(mocks.set).toHaveBeenCalledTimes(1);
  });

  it("is translated", () => {
    show({}, "ru");
    fireEvent.click(screen.getByRole("button", { name: "Опубликовать" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("увидят все");
  });
});
