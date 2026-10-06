"use client";

import { type FC, useContext } from "react";
import Image from "next/image";
import { DarkModeContext } from "@/components/theme/ThemeWrapper";

/** The files in `public/brand/`; the dark wordmark has lighter gradient and ink. */
const BRAND = {
  mark: "/brand/logo-mark.svg",
  horizontal: "/brand/logo-horizontal.svg",
  horizontalDark: "/brand/logo-horizontal-dark.svg",
} as const;

/**
 * The Gradfolio logo. `mark` is the cap alone (collapsed navigation, small
 * spaces); otherwise the horizontal wordmark in the colours of the current
 * theme. The name is a brand, not a translation: the alt text is the same in
 * every language.
 */
export const BrandLogo: FC<{ variant?: "mark" | "horizontal"; height?: number }> = ({
  variant = "horizontal",
  height = 36,
}) => {
  const { mode } = useContext(DarkModeContext);
  if (variant === "mark") {
    return <Image src={BRAND.mark} alt="Gradfolio" width={height} height={height} unoptimized />;
  }
  return (
    <Image
      src={mode === "dark" ? BRAND.horizontalDark : BRAND.horizontal}
      alt="Gradfolio"
      width={Math.round((height * 234) / 64)}
      height={height}
      unoptimized
    />
  );
};
