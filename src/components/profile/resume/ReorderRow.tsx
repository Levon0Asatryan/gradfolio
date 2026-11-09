"use client";

import type { ReactNode } from "react";
import { Reorder, useDragControls } from "motion/react";
import { Box } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

/**
 * One row of a reorderable list. Dragging starts on the handle only, so text and
 * switches in the row stay usable. The handle is for a pointer or a finger: keyboard
 * and screen-reader users move rows with the arrow buttons the caller renders, so the
 * handle is hidden from them and not a tab stop.
 */
export function ReorderRow({
  value,
  draggable,
  onDragEnd,
  children,
}: {
  value: string;
  draggable: boolean;
  onDragEnd?: () => void;
  children: (handle: ReactNode) => ReactNode;
}) {
  const controls = useDragControls();
  const handle = (
    <Box
      component="button"
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      disabled={!draggable}
      onPointerDown={draggable ? (event) => controls.start(event) : undefined}
      sx={{
        flex: "none",
        width: 32,
        height: 44,
        p: 0,
        border: 0,
        borderRadius: "10px",
        background: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: draggable ? "text.secondary" : "action.disabled",
        cursor: draggable ? "grab" : "default",
        touchAction: "none",
        userSelect: "none",
        "&:active": draggable ? { cursor: "grabbing" } : undefined,
      }}
    >
      <DragIndicatorIcon fontSize="small" />
    </Box>
  );
  return (
    <Reorder.Item
      as="li"
      value={value}
      dragListener={false}
      dragControls={controls}
      tabIndex={-1}
      onDragEnd={onDragEnd}
      style={{ listStyle: "none" }}
    >
      {children(handle)}
    </Reorder.Item>
  );
}

export function ReorderList({
  values,
  onReorder,
  children,
  label,
}: {
  values: string[];
  onReorder: (values: string[]) => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <Reorder.Group
      as="ul"
      axis="y"
      values={values}
      onReorder={onReorder}
      aria-label={label}
      style={{ margin: 0, padding: 0, listStyle: "none" }}
    >
      {children}
    </Reorder.Group>
  );
}
