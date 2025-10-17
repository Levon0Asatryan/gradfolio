export const cookiesThemeKey = "theme";

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
