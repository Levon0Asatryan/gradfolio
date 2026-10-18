"use client";

import { type FC, useCallback, useEffect, useRef, useState } from "react";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@/components/i18n/LanguageContext";

/**
 * What a quick publish says, kept somewhere that outlives the button. Publishing flips the
 * project's state, and the button (with its confirm dialog and any toast inside it) is then
 * removed: the focused element and the announcement would go with it. So the parent owns a
 * `role="status"` line, renders it whatever the project's state, and the focus moves to it.
 */
export function usePublishStatus() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<{ text: string; n: number } | null>(null);
  const line = useRef<HTMLElement | null>(null);
  const counter = useRef(0);

  // After the render that shows the message (and removes the button), not before.
  useEffect(() => {
    if (status) line.current?.focus();
  }, [status]);

  const onDone = useCallback(
    ({ isDraft }: { isDraft: boolean }) => {
      counter.current += 1;
      setStatus({
        text: isDraft ? t.projects.publish.doneDraft : t.projects.publish.done,
        n: counter.current,
      });
    },
    [t],
  );
  return { status: status?.text ?? null, line, onDone };
}

/** The live region itself: present (and empty) before the first message, so it is announced. */
export const PublishStatus: FC<{
  text: string | null;
  lineRef: React.MutableRefObject<HTMLElement | null>;
}> = ({ text, lineRef }) => (
  <Typography
    role="status"
    tabIndex={-1}
    variant="body2"
    ref={(el: HTMLElement | null) => {
      lineRef.current = el;
    }}
    sx={{ fontWeight: 700, outlineOffset: 2 }}
  >
    {text}
  </Typography>
);
