import React, { FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Tooltip, TooltipProps, Typography, TypographyProps } from "@mui/material";

export interface TypographyWithTooltipProps extends Omit<TypographyProps, "title"> {
  title: TooltipProps["title"];
  tooltipMaxHeight?: number | string;
  placement?: TooltipProps["placement"];
  tooltipProps?: Omit<TooltipProps, "title" | "placement" | "children">;
}

export const TypographyWithTooltip: FC<TypographyWithTooltipProps> = ({
  title,
  placement = "bottom",
  tooltipMaxHeight,
  tooltipProps,
  children,
  ...props
}) => {
  const elRef = useRef<HTMLSpanElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const measure = useCallback(() => {
    const el = elRef.current;
    if (!el) {
      return;
    }

    setIsTruncated(el.scrollWidth > el.clientWidth + 1);
  }, []);

  // Measure on mount and when children change
  useLayoutEffect(() => {
    measure();
  }, [children, title, measure]);

  // Re-measure on element resize
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [measure]);

  return (
    <Tooltip
      arrow
      placement={placement}
      title={<div style={{ maxHeight: tooltipMaxHeight ?? 100, overflowY: "auto" }}>{title}</div>}
      disableHoverListener={!isTruncated}
      disableFocusListener={!isTruncated}
      disableTouchListener={!isTruncated}
      {...tooltipProps}
    >
      <Typography
        ref={elRef as React.Ref<any>}
        {...props}
        component="div"
        sx={{
          ...props.sx,
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {children ?? title}
      </Typography>
    </Tooltip>
  );
};
