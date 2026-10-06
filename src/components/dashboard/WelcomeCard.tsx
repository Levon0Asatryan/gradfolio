"use client";

import { type FC } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { COMPLETENESS_STEPS, type Completeness } from "@/lib/profile/completeness";

export interface WelcomeCardProps {
  /** The user's first name, or null when the API could not be read. */
  firstName: string | null;
  /** Null when the API could not be read: the meter is left out, not faked. */
  completeness: Completeness | null;
  /** Where the next step is done. */
  editHref: string;
}

const STEP_LABEL = { basics: "stepBasics", contact: "stepContact", photo: "stepPhoto" } as const;
const NEXT_LABEL = { basics: "nextBasics", contact: "nextContact", photo: "nextPhoto" } as const;

/** The friendly top of the dashboard: a welcome, how complete the profile is, one next step. */
export const WelcomeCard: FC<WelcomeCardProps> = ({ firstName, completeness, editHref }) => {
  const { t } = useLanguage();
  const d = t.dashboard;
  const title = firstName ? d.welcomeBack.replace("{name}", firstName) : d.welcomeBackAnon;
  const done = completeness ? COMPLETENESS_STEPS.filter((s) => completeness.steps[s]).length : 0;

  return (
    <Card
      component="section"
      aria-labelledby="welcome-title"
      sx={({ palette }) => ({
        p: { xs: 3, md: 4 },
        bgcolor: palette.surface.soft,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: completeness ? "1fr 1fr" : "1fr" },
        gap: { xs: 3, md: 4 },
        alignItems: "start",
      })}
    >
      <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography
          id="welcome-title"
          variant="h4"
          component="h1"
          sx={{ fontSize: { xs: "1.5625rem", sm: "1.875rem" }, overflowWrap: "anywhere" }}
        >
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: "52ch" }}>
          {!completeness
            ? d.welcomeSub
            : completeness.next
              ? d.completenessHelp.replace("{percent}", String(completeness.percent))
              : d.completenessDone}
        </Typography>
        {completeness?.next && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="overline" color="text.secondary" component="p">
              {d.nextStep}
            </Typography>
            <Button component={Link} href={editHref} variant="contained" sx={{ mt: 0.5 }}>
              {d[NEXT_LABEL[completeness.next]]}
            </Button>
          </Box>
        )}
      </Box>

      {completeness && (
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <Typography variant="subtitle2" component="h2" id="completeness-title">
              {d.completeness}
            </Typography>
            <Typography variant="h5" component="p" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {completeness.percent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completeness.percent}
            aria-labelledby="completeness-title"
            sx={{ height: 12, borderRadius: 999, my: 2, bgcolor: "background.paper" }}
          />
          <Typography variant="caption" color="text.secondary">
            {d.stepsDone
              .replace("{done}", String(done))
              .replace("{total}", String(COMPLETENESS_STEPS.length))}
          </Typography>
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mt: 1 }}>
            {COMPLETENESS_STEPS.map((step) => {
              const ok = completeness.steps[step];
              return (
                <Box
                  component="li"
                  key={step}
                  sx={{ display: "flex", alignItems: "center", gap: 1.5, minHeight: 44 }}
                >
                  <Box
                    aria-hidden
                    sx={({ palette }) => ({
                      width: 24,
                      height: 24,
                      flex: "none",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      border: 2,
                      borderColor: ok ? palette.success.main : palette.surface.lineStrong,
                      bgcolor: ok ? palette.success.main : "transparent",
                      color: palette.success.contrastText,
                    })}
                  >
                    {ok && <CheckIcon sx={{ fontSize: 16 }} />}
                  </Box>
                  <Typography color={ok ? "text.secondary" : "text.primary"}>
                    {d[STEP_LABEL[step]]}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Card>
  );
};
