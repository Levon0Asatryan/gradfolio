export interface FormatDateOptions {
  withTime?: boolean;
}

export const formatDate = (iso: string, options?: FormatDateOptions): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const datePart = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  if (options?.withTime) {
    const timePart = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} ${timePart}`;
  }
  return datePart;
};

export type FormatDate = typeof formatDate;
