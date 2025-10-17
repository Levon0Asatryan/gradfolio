export const isNonEmpty = (v: string | null | undefined): boolean => !!(v && v.trim().length > 0);

export const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const value = email.trim();
  // Simple RFC5322-ish check
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
};
