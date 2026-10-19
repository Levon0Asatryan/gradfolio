import type { Dictionary } from "@/data/locales/types";
import type { SuggestionItem } from "@/lib/api/types";

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** What the student reads of a suggestion: a heading, and the two values when there are two. */
export interface Described {
  title: string;
  /** Show Now / Suggested side by side (a field that already exists). */
  compare: boolean;
  current: string | null;
  proposed: string | null;
  /** The value is an image address (a photo), drawn as an image. */
  image: boolean;
  /** One line under the heading, if the kind has one. */
  detail: string | null;
}

/**
 * README text arrives as sanitized HTML. It is shown as plain text, never as markup: the
 * parser builds an inert document, so nothing in it runs or loads.
 */
function plainText(html: string): string {
  // A space at each block's end, so "<h1>New</h1><p>Text" does not read "NewText".
  const spaced = html.replace(/<\/(p|h[1-6]|li|div|pre|blockquote|tr)>|<br\s*\/?>/gi, " $&");
  if (typeof DOMParser === "undefined") return spaced.replace(/<[^>]*>/g, "").trim();
  const body = new DOMParser().parseFromString(spaced, "text/html").body;
  body.querySelectorAll("script, style").forEach((node) => node.remove());
  return (body.textContent ?? "").replace(/\s+/g, " ").trim();
}

const FIELD_OF_KIND: Partial<
  Record<SuggestionItem["kind"], keyof Dictionary["suggestions"]["fields"]>
> = {
  "profile.name": "name",
  "profile.headline": "headline",
  "profile.bio": "bio",
  "profile.location": "location",
  "profile.avatarUrl": "avatarUrl",
  "profile.links.github": "linksGithub",
  "profile.links.website": "linksWebsite",
  "profile.links.linkedin": "linksLinkedin",
  "profile.links.twitter": "linksTwitter",
};

export function describe(item: SuggestionItem, t: Dictionary): Described {
  const s = t.suggestions;
  const none = { compare: false, current: null, proposed: null, image: false, detail: null };
  switch (item.kind) {
    case "skill.add": {
      const e = item.evidence;
      return {
        ...none,
        title: fill(s.titles.skill, { skill: item.skill ?? "" }),
        detail: e
          ? fill(s.evidence, { repositories: String(e.repositories), projects: String(e.projects) })
          : null,
      };
    }
    case "project.update": {
      const html = item.field === "descriptionHtml";
      const label = html ? s.fields.descriptionHtml : s.fields.summary;
      return {
        ...none,
        title: fill(s.titles.projectUpdate, { project: item.project?.title ?? "", field: label }),
        compare: true,
        current: item.current === null ? null : html ? plainText(item.current) : item.current,
        proposed: item.proposed === null ? null : html ? plainText(item.proposed) : item.proposed,
      };
    }
    case "education.add":
      return {
        ...none,
        title: fill(s.titles.education, { institution: item.proposed ?? "" }),
        detail: s.form.needsDetails,
      };
    case "experience.add":
      return {
        ...none,
        title: fill(s.titles.experience, { organization: item.proposed ?? "" }),
        detail: s.form.needsDetails,
      };
    default: {
      const key = FIELD_OF_KIND[item.kind];
      return {
        ...none,
        title: key ? s.fields[key] : item.kind,
        compare: true,
        current: item.current,
        proposed: item.proposed,
        image: item.kind === "profile.avatarUrl",
      };
    }
  }
}
