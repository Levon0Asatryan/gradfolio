import { RESUME_SECTIONS } from "./request";

export type ResumeSection = (typeof RESUME_SECTIONS)[number];

/** `list` with the item at `index` moved by one place; the same array when it cannot move. */
export function moveItem<T>(list: readonly T[], index: number, by: -1 | 1): readonly T[] {
  const to = index + by;
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(index, 1);
  if (moved === undefined) return list;
  next.splice(to, 0, moved);
  return next;
}

/** The blocks that will be printed, in the order the user arranged them. */
export function enabledInOrder(
  order: readonly ResumeSection[],
  enabled: ReadonlySet<ResumeSection>,
): ResumeSection[] {
  return order.filter((section) => enabled.has(section));
}

/**
 * Moves a block one place among the blocks that are on. Blocks that are off keep their
 * slots, so a block never swaps with something that will not be printed.
 */
export function moveAmongEnabled(
  order: readonly ResumeSection[],
  enabled: ReadonlySet<ResumeSection>,
  section: ResumeSection,
  by: -1 | 1,
): readonly ResumeSection[] {
  const active = enabledInOrder(order, enabled);
  const moved = moveItem(active, active.indexOf(section), by);
  if (moved === active) return order;
  let next = 0;
  return order.map((s) => (enabled.has(s) ? (moved[next++] ?? s) : s));
}
