"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@mui/material";
import type { RichTextEditorProps } from "./RichTextEditor";

/** Tiptap is ~130 KB gzip: it loads on the form routes only, in the browser. */
export const RichTextEditorLazy = dynamic<RichTextEditorProps>(() => import("./RichTextEditor"), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={248} />,
});
