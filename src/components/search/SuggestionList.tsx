"use client";

import { FC } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";

export interface SuggestionOption {
  key: string;
  group: "people" | "projects" | "tags" | "search";
  label: string;
  secondary: string;
  /** People only. */
  avatarUrl?: string | null;
  href: string;
}

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

/**
 * The listbox of a combobox (WAI-ARIA 1.2): the input keeps the focus and names the chosen
 * option with `aria-activedescendant`; the options are `role=option` in labelled groups. The
 * count is announced politely in a separate live region (it is also in the DOM while the list
 * is closed, so the first announcement is not lost). Mouse use never moves focus out of the
 * field (`onMouseDown` is prevented).
 */
export const SuggestionList: FC<{
  id: string;
  open: boolean;
  options: SuggestionOption[];
  active: number;
  onChoose: (href: string) => void;
  announcement: string;
}> = ({ id, open, options, active, onChoose, announcement }) => {
  const { t } = useLanguage();
  const groupLabel: Record<SuggestionOption["group"], string> = {
    people: t.search.people,
    projects: t.search.projects,
    tags: t.tags.tagsOf,
    search: t.search.searchButton,
  };
  // Consecutive options of one group share one labelled group element.
  const groups: Array<{
    group: SuggestionOption["group"];
    items: Array<[SuggestionOption, number]>;
  }> = [];
  options.forEach((option, index) => {
    const last = groups[groups.length - 1];
    if (last && last.group === option.group) last.items.push([option, index]);
    else groups.push({ group: option.group, items: [[option, index]] });
  });

  return (
    <>
      <Box role="status" aria-live="polite" sx={visuallyHidden}>
        {announcement}
      </Box>
      <Box
        id={id}
        role="listbox"
        aria-label={t.search.suggestionsLabel}
        hidden={!open}
        onMouseDown={(e) => e.preventDefault()}
        sx={({ palette, zIndex }) => ({
          display: open ? "block" : "none",
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          mt: 0.5,
          zIndex: zIndex.modal,
          maxHeight: 360,
          overflowY: "auto",
          bgcolor: palette.background.paper,
          border: 1,
          borderColor: palette.surface.lineStrong,
          borderRadius: 2,
          boxShadow: 4,
          py: 0.5,
        })}
      >
        {groups.map((g) => (
          <Box
            key={g.group + g.items[0]?.[1]}
            role="group"
            aria-label={groupLabel[g.group]}
            sx={{ py: 0.5 }}
          >
            {g.group !== "search" && (
              <Typography
                aria-hidden
                variant="overline"
                color="text.secondary"
                sx={{ px: 2, display: "block" }}
              >
                {groupLabel[g.group]}
              </Typography>
            )}
            {g.items.map(([option, index]) => (
              <Box
                key={option.key}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={index === active}
                onClick={() => onChoose(option.href)}
                sx={({ palette }) => ({
                  minHeight: 44,
                  px: 2,
                  py: 0.75,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  cursor: "pointer",
                  bgcolor: index === active ? palette.surface.soft : "transparent",
                  outline: index === active ? `2px solid ${palette.primary.main}` : "none",
                  outlineOffset: -2,
                  "&:hover": { bgcolor: palette.surface.soft },
                })}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                  {option.group === "people" && (
                    <Avatar
                      src={safeHttpsUrl(option.avatarUrl)}
                      alt=""
                      sx={{ width: 28, height: 28, flex: "none", fontSize: 14 }}
                    >
                      {option.label.trim().charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                  <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                    {option.label}
                  </Typography>
                </Box>
                {option.secondary && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {option.secondary}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </>
  );
};
