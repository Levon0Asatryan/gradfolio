import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import { AddTeammateDialog } from "./AddTeammateDialog";

const actions = vi.hoisted(() => ({ invite: vi.fn(), external: vi.fn() }));
vi.mock("@/lib/team/actions", () => ({
  inviteAction: actions.invite,
  addExternalAction: actions.external,
}));

const P = "0b6f2c1e-1111-4222-8333-444455556601";
const ANI = {
  id: "0b6f2c1e-1111-4222-8333-444455556611",
  name: "Ani Karapetyan",
  headline: "Frontend",
  avatarUrl: null,
};
const ARA = {
  id: "0b6f2c1e-1111-4222-8333-444455556612",
  name: "Ara Petrosyan",
  headline: null,
  avatarUrl: null,
};

let fetchMock: ReturnType<typeof vi.fn>;
const lookups = () => fetchMock.mock.calls.map((c) => String(c[0]));

const onDone = vi.fn();
const onClose = vi.fn();
const show = (props: { isDraft?: boolean } = {}) =>
  renderInApp(
    <AddTeammateDialog
      open
      projectId={P}
      isDraft={props.isDraft ?? false}
      onClose={onClose}
      onDone={onDone}
    />,
  );

const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByRole("combobox", { name: label }), { target: { value } });

beforeEach(() => {
  vi.resetAllMocks();
  fetchMock = vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify({ items: [ANI, ARA] }), { status: 200 })),
  );
  vi.stubGlobal("fetch", fetchMock);
  actions.invite.mockResolvedValue({ ok: true });
  actions.external.mockResolvedValue({ ok: true });
});
afterEach(() => vi.unstubAllGlobals());

describe("finding a user", () => {
  it("asks nothing below 3 characters, then once, after the pause", async () => {
    show();
    type(/Search by name/, "An");
    await act(async () => new Promise((r) => setTimeout(r, 450)));
    expect(fetchMock).not.toHaveBeenCalled();
    type(/Search by name/, "Ani");
    type(/Search by name/, "Anit");
    expect(fetchMock).not.toHaveBeenCalled(); // debounced
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1), { timeout: 2000 });
    expect(lookups()[0]).toBe("/api/users/lookup?q=Anit");
  });

  it("lists people with their headline, picks one, and sends the invitation with the role", async () => {
    show();
    type(/Search by name/, "Ani");
    const option = await screen.findByRole("option", { name: /Ani Karapetyan/ }, { timeout: 2000 });
    expect(within(option).getByText("Frontend")).toBeVisible();
    expect(screen.getByRole("button", { name: "Send invitation" })).toBeDisabled();
    fireEvent.click(option);
    fireEvent.change(screen.getByLabelText("Role (optional)"), { target: { value: "Lead" } });
    fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
    await waitFor(() => expect(actions.invite).toHaveBeenCalledWith(P, ANI.id, "Lead"));
    expect(onDone).toHaveBeenCalledWith("Invitation sent to Ani Karapetyan");
  });

  it("drops a slow answer to an older query", async () => {
    const resolvers: Array<(r: Response) => void> = [];
    fetchMock.mockImplementation(() => new Promise<Response>((r) => resolvers.push(r)));
    show();
    type(/Search by name/, "Ani");
    await waitFor(() => expect(resolvers).toHaveLength(1), { timeout: 2000 });
    type(/Search by name/, "Ara");
    await waitFor(() => expect(resolvers).toHaveLength(2), { timeout: 2000 });
    await act(async () => resolvers[1]?.(new Response(JSON.stringify({ items: [ARA] }))));
    await act(async () => resolvers[0]?.(new Response(JSON.stringify({ items: [ANI] }))));
    expect(await screen.findByRole("option", { name: /Ara Petrosyan/ })).toBeVisible();
    expect(screen.queryByRole("option", { name: /Ani Karapetyan/ })).toBeNull();
  });

  it("says when no one is found, when the search fails, and when it is rate limited", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ items: [] })));
    show();
    type(/Search by name/, "Zzz");
    expect(await screen.findByText(/No one found/, {}, { timeout: 2000 })).toBeVisible();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: "RATE_LIMITED" }), { status: 429 }),
    );
    type(/Search by name/, "Zzzz");
    expect(await screen.findByText(/Too many requests/, {}, { timeout: 2000 })).toBeVisible();
    fetchMock.mockRejectedValueOnce(new TypeError("net"));
    type(/Search by name/, "Zzzzz");
    expect(
      await screen.findByText("The search failed. Try again.", {}, { timeout: 2000 }),
    ).toBeVisible();
  });

  it("keeps the form and shows the reason when the invitation is refused", async () => {
    actions.invite.mockResolvedValue({ ok: false, code: "ALREADY_MEMBER" });
    show();
    type(/Search by name/, "Ani");
    fireEvent.click(
      await screen.findByRole("option", { name: /Ani Karapetyan/ }, { timeout: 2000 }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("already on the team");
    expect(screen.getByRole("combobox", { name: /Search by name/ })).toHaveValue("Ani Karapetyan");
    expect(onDone).not.toHaveBeenCalled();
  });

  it("will not invite from a draft project, even with someone picked, and says to publish first", async () => {
    show({ isDraft: true });
    expect(screen.getByText(/Publish the project before inviting people/)).toBeVisible();
    type(/Search by name/, "Ani");
    fireEvent.click(
      await screen.findByRole("option", { name: /Ani Karapetyan/ }, { timeout: 2000 }),
    );
    expect(screen.getByRole("button", { name: "Send invitation" })).toBeDisabled();
    fireEvent.click(screen.getByRole("tab", { name: "Add by name" }));
    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
  });
});

describe("adding a name", () => {
  const open = () => {
    show();
    fireEvent.click(screen.getByRole("tab", { name: "Add by name" }));
  };

  it("adds a name and role, and explains nobody is notified", async () => {
    open();
    expect(screen.getByText(/won’t be notified/)).toBeVisible();
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "  Ext Person " } });
    fireEvent.change(screen.getByLabelText("Role (optional)"), { target: { value: "Mentor" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() =>
      expect(actions.external).toHaveBeenCalledWith(P, "  Ext Person ", "Mentor"),
    );
    expect(onDone).toHaveBeenCalledWith("Ext Person added");
  });

  it("shows the field error the action names, on that field, and keeps the dialog", async () => {
    actions.external.mockResolvedValue({
      ok: false,
      code: "VALIDATION_FAILED",
      field: "name",
      error: "required",
    });
    open();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Enter a name.")).toBeVisible();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("Cancel closes without calling anything", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    expect(actions.external).not.toHaveBeenCalled();
  });
});
