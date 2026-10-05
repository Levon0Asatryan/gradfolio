import type { KeyboardEvent, WheelEvent } from "react";

/**
 * A year is `type="number"`: numeric keypad on phones and the API's bounds on the
 * control. Its two quirks are handled here: the scroll wheel must not change a
 * focused value, and `e`, `+`, `-` and `.` (which a number input accepts) are never
 * a year. `parseEntry` stays the single check: it also catches a pasted value.
 */
export function yearInputProps(min: number, max: number) {
  return {
    min,
    max,
    step: 1,
    inputMode: "numeric" as const,
    onWheel: (event: WheelEvent<HTMLInputElement>) => event.currentTarget.blur(),
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (["e", "E", "+", "-", "."].includes(event.key)) event.preventDefault();
    },
  };
}
