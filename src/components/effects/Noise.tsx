"use client";

import React, { useEffect, useRef } from "react";
import { Box, type SxProps, type Theme, useTheme } from "@mui/material";

export type NoiseProps = {
  patternSize?: number; // currently not used for canvas tile, reserved for future enhancements
  patternScaleX?: number; // reserved
  patternScaleY?: number; // reserved
  patternRefreshInterval?: number; // draw every N frames
  patternAlpha?: number; // 0..255
  sx?: SxProps<Theme>;
};

// Full-screen animated noise/grain overlay rendered to a canvas.
// Style-only via MUI sx. Named export, no default export.
export const Noise: React.FC<NoiseProps> = ({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha,
  sx,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = useTheme();

  const effectiveAlpha = typeof patternAlpha === "number" ? patternAlpha : theme.palette.mode === "dark" ? 22 : 16;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const canvasSize = 1024; // fixed buffer for speed; CSS scales to viewport
    let frame = 0;
    let animationId = 0;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      // CSS size covers viewport
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
    };

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value; // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = effectiveAlpha; // A
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const loop = () => {
      if (frame % Math.max(1, patternRefreshInterval) === 0) {
        drawGrain();
      }
      frame += 1;
      animationId = window.requestAnimationFrame(loop);
    };

    window.addEventListener("resize", resize);
    resize();
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationId) window.cancelAnimationFrame(animationId);
    };
  }, [effectiveAlpha, patternRefreshInterval, patternScaleX, patternScaleY, patternSize]);

  return (
    <Box
      component="canvas"
      ref={canvasRef as any}
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        imageRendering: "pixelated",
        zIndex: (t) => t.zIndex.appBar - 1, // behind fixed UI controls
        ...((sx as any) || {}),
      }}
    />
  );
};
