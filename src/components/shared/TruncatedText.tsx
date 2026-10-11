"use client";

import {
  type ElementType,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Tooltip from "@mui/material/Tooltip";
import Typography, { type TypographyProps } from "@mui/material/Typography";

/**
 * A control that already owns the focus and the tap: text inside it takes no tab stop of its
 * own (focusable content inside a link is invalid HTML; inside an option, axe's
 * nested-interactive). Its keyboard focus reveals the tooltip instead.
 */
const CONTROL =
  'a[href], button, summary, label, [role="button"], [role="link"], [role="option"], [role="menuitem"], [role="tab"], [tabindex]:not([tabindex="-1"])';

export type TruncatedTextProps = Omit<
  TypographyProps<"span", { component?: ElementType }>,
  "children" | "noWrap" | "title"
> & {
  /** The full text: what the tooltip shows, and what is measured again when it changes. */
  text: string;
  /** How the text is drawn when it is more than plain text (a highlighted match). */
  children?: ReactNode;
  /** 1: one line ending in an ellipsis. More: clamped to that many lines. */
  lines?: number;
};

/**
 * Text that may be cropped (one line with an ellipsis, or a line clamp). Only when it really is
 * cropped (measured after mount, on resize, when the text or the fonts change) does it get a
 * tooltip with the full text, opened by hover, a long press (a tap when it is not inside a
 * control), and keyboard focus: its own focus when standalone, else its control's.
 *
 * The full string is in the DOM either way, so a screen reader already reads all of it: the
 * tooltip adds no accessible name or description to the text, and its popup is hidden from the
 * accessibility tree, so nothing is announced twice. Nothing is measured on the server; the
 * first client render matches it (no tooltip, no tab stop).
 */
const TruncatedText: FC<TruncatedTextProps> = ({ text, children, lines = 1, sx, ...rest }) => {
  const ref = useRef<HTMLElement>(null);
  const [cropped, setCropped] = useState(false);
  const [insideControl, setInsideControl] = useState(false);
  const [open, setOpen] = useState(false);
  const [controlFocused, setControlFocused] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCropped(lines > 1 ? el.scrollHeight > el.clientHeight : el.scrollWidth > el.clientWidth);
  }, [lines]);

  // The text changed: its box may not have (a clamped box keeps its height), so measure again.
  useEffect(() => measure(), [measure, text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    // A web font that arrives later changes the text's width without resizing its box.
    void document.fonts?.ready.then(() => alive && measure());
    if (typeof ResizeObserver === "undefined") return () => void (alive = false);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    const control = ref.current?.parentElement?.closest<HTMLElement>(CONTROL);
    setInsideControl(Boolean(control));
    if (!control) return;
    const onFocusIn = (event: FocusEvent) =>
      setControlFocused((event.target as Element).matches(":focus-visible"));
    const onFocusOut = () => setControlFocused(false);
    control.addEventListener("focusin", onFocusIn);
    control.addEventListener("focusout", onFocusOut);
    return () => {
      control.removeEventListener("focusin", onFocusIn);
      control.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const own = sx === undefined ? [] : Array.isArray(sx) ? sx : [sx];
  return (
    <Tooltip
      title={cropped ? text : ""}
      open={cropped && (open || controlFocused)}
      onOpen={() => setOpen(true)}
      onClose={() => {
        setOpen(false);
        setControlFocused(false);
      }}
      disableHoverListener={!cropped}
      disableFocusListener={!cropped}
      disableTouchListener={!cropped}
      // Inside a link a tap navigates, so MUI's long press (700 ms) stays; alone, a tap opens it.
      enterTouchDelay={insideControl ? undefined : 0}
      slotProps={{ popper: { "aria-hidden": true } }}
    >
      <Typography
        ref={ref}
        {...rest}
        // MUI's Tooltip names its child after a string title; the text already says it.
        aria-label={rest["aria-label"]}
        tabIndex={cropped && !insideControl ? 0 : undefined}
        noWrap={lines === 1}
        sx={[
          lines > 1 && {
            display: "-webkit-box",
            WebkitLineClamp: lines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          },
          {
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
              borderRadius: 0.5,
            },
          },
          ...own,
        ]}
      >
        {children ?? text}
      </Typography>
    </Tooltip>
  );
};

export default TruncatedText;
