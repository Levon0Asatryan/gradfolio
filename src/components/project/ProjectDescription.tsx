import { Box } from "@mui/material";
import { Panel } from "@/components/layout/Panel";
import { sanitizeDescription } from "@/lib/sanitize";

export interface ProjectDescriptionProps {
  html: string | null;
  title: string;
}

/**
 * The author's description. A server component on purpose: the HTML goes through
 * the allow-list sanitizer here, on the server (F1, tracker 4.8), and only the
 * sanitized markup reaches the browser. The API sanitized it on write as well.
 */
export default function ProjectDescription({ html, title }: ProjectDescriptionProps) {
  const safeHtml = sanitizeDescription(html);
  if (!safeHtml) return null;
  return (
    <Panel title={title}>
      <Box
        component="div"
        sx={{
          "& h2, & h3, & h4": { mt: 2, mb: 1 },
          "& p": { mb: 2 },
          "& ul, & ol": { pl: 3, mb: 2 },
          "& li": { mb: 0.5 },
          "& a[href]": { color: "primary.main" },
          "& pre": { overflowX: "auto", p: 1.5, borderRadius: 1, bgcolor: "action.hover" },
          "& blockquote": { m: 0, mb: 2, pl: 2, borderLeft: 3, borderColor: "divider" },
          overflowWrap: "anywhere",
        }}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </Panel>
  );
}
