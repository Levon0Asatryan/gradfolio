export const cookiesThemeKey = "theme";

/** Mirror of the UI language (localStorage `language`), so the server renders the right `<html lang>`. */
export const cookiesLanguageKey = "language";

export type ProfileForm = {
  fullName: string;
  email: string;
  birthday: string;
  githubUrl: string;
  linkedinUrl: string;
  phone: string;
  website: string;
  experience: string;
  education: string;
  repos: string;
};

export const initialProfileForm: ProfileForm = {
  fullName: "",
  email: "",
  birthday: "",
  githubUrl: "",
  linkedinUrl: "",
  phone: "",
  website: "",
  experience: "",
  education: "",
  repos: "",
};
