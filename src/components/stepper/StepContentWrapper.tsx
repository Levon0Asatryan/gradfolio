import React, { useCallback, useState } from "react";
import { Box, SxProps, Theme } from "@mui/material";
import { AnimatePresence } from "motion/react";
import { SlideTransition } from "./SlideTransition";

export type StepContentWrapperProps = {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

export const StepContentWrapper: React.FC<StepContentWrapperProps> = ({
  isCompleted,
  currentStep,
  direction,
  children,
  sx,
}) => {
  const [parentHeight, setParentHeight] = useState(0);
  const handleHeightReady = useCallback((h: number) => setParentHeight(h), []);

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            onHeightReady={handleHeightReady}
          >
            <Box sx={{ px: 2, ...(sx as any) }}>{children}</Box>
          </SlideTransition>
        )}
      </AnimatePresence>
      {/* Maintain height via invisible spacer to avoid parent collapse during animation */}
      <div style={{ height: isCompleted ? 0 : parentHeight }} />
    </div>
  );
};
