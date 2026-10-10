export interface FormatDateOptions {
  withTime?: boolean;
  /** A fixed locale and zone make server and browser agree (no hydration mismatch). */
  locale?: string;
  timeZone?: string;
}

export const formatDate = (iso: string, options?: FormatDateOptions): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const datePart = d.toLocaleDateString(options?.locale, {
    timeZone: options?.timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  if (options?.withTime) {
    const timePart = d.toLocaleTimeString(options?.locale, {
      timeZone: options?.timeZone,
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} ${timePart}`;
  }
  return datePart;
};
