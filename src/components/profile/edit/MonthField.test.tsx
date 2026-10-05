import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { MonthField } from "./MonthField";

function Harness({
  initial = "",
  onChange = vi.fn(),
}: {
  initial?: string;
  onChange?: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <LanguageProvider>
      <MonthField
        label="Start"
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange(v);
        }}
      />
      <output data-testid="value">{value}</output>
    </LanguageProvider>
  );
}

const pickMonth = (name: string) => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: /Month/ }));
  fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name }));
};

describe("MonthField", () => {
  it("builds the API's YYYY-MM string from a month and a year", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: "2024" } });
    expect(screen.getByTestId("value")).toHaveTextContent("2024-");
    pickMonth("June");
    expect(onChange).toHaveBeenLastCalledWith("2024-06");
  });

  it("shows an existing value as month and year", () => {
    render(<Harness initial="2023-09" />);
    expect(screen.getByLabelText(/Year/)).toHaveValue(2023);
    expect(screen.getByRole("combobox", { name: /Month/ })).toHaveTextContent("September");
  });

  it("passes a half-filled value up as typed, so the check can say so", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    pickMonth("March");
    expect(onChange).toHaveBeenLastCalledWith("-03");
  });

  it("is empty when both are cleared", () => {
    const onChange = vi.fn();
    render(<Harness initial="2024-" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("has a year number input with the API's bounds", () => {
    render(<Harness />);
    const year = screen.getByLabelText(/Year/);
    expect([year.getAttribute("type"), year.getAttribute("min"), year.getAttribute("max")]).toEqual(
      ["number", "1900", "2100"],
    );
  });
});

describe("MonthField names", () => {
  it("has twelve month names in every language, in order", async () => {
    const { en } = await import("@/data/locales/en");
    const { ru } = await import("@/data/locales/ru");
    const { am } = await import("@/data/locales/am");
    for (const d of [en, ru, am]) {
      expect(d.sectionEdit.months).toHaveLength(12);
      expect(new Set(d.sectionEdit.months).size).toBe(12);
    }
    expect(en.sectionEdit.months[5]).toBe("June");
  });
});
