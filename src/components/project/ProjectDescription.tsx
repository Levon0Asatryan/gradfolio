"use client";

import { FC, memo, useMemo } from "react";
import { Box } from "@mui/material";
import SectionCard from "./SectionCard";

export interface ProjectDescriptionProps {
  html: string;
}

// Minimal sanitizer: strips <script>, javascript: URLs, and inline event handlers.
function sanitize(html: string): string {
  let out = html;
  // Remove script/style tags entirely
  out = out.replace(/<\/(?:script|style)>/gi, "");
  out = out.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  // Remove on* attributes (onclick, onerror, etc.)
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");
  // Disallow javascript: in href/src
  out = out.replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"');
  out = out.replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'");
  return out;
}

import { useLanguage } from "@/components/i18n/LanguageContext";

const ProjectDescription: FC<ProjectDescriptionProps> = ({ html }) => {
  const safeHtml = useMemo(() => sanitize(html), [html]);
  const { t } = useLanguage();

  return (
    <SectionCard title={t.common.description}>
      <Box
        component="div"
        sx={{
          // content styling
          "& h3, & h4": { mt: 2, mb: 1 },
          "& p": { mb: 2 },
          "& ul, & ol": { pl: 3, mb: 2 },
          "& li": { mb: 0.5 },
          "& a": { color: "primary.main" },
        }}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
        aria-label={t.common.description}
      />
    </SectionCard>
  );
};

export default memo(ProjectDescription);
