import React, { useCallback } from "react";
import { Box, SxProps, Theme, Typography } from "@mui/material";
import { motion } from "motion/react";

export type StepIndicatorProps = {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators,
}) => {
  const status = currentStep === step ? "active" : currentStep < step ? "inactive" : "complete";

  const handleClick = useCallback(() => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step);
  }, [currentStep, disableStepIndicators, onClickStep, step]);

  return (
    <motion.div
      onClick={handleClick}
      initial={false}
      animate={status as any}
      style={{ cursor: "pointer" }}
    >
      <motion.div
        variants={{
          inactive: { scale: 1 },
          active: { scale: 1 },
          complete: { scale: 1 },
        }}
        transition={{ duration: 0.3 }}
        style={{ display: "flex", alignItems: "center" }}
      >
        <Box
          sx={(theme) => ({
            height: 32,
            width: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            color:
              status === "inactive"
                ? theme.palette.text.disabled
                : theme.palette.getContrastText(theme.palette.primary.main),
            bgcolor:
              status === "inactive"
                ? theme.palette.action.disabledBackground
                : theme.palette.primary.main,
          })}
        >
          {status === "complete" ? (
            <CheckIcon sx={{ color: (theme) => theme.palette.background.paper }} />
          ) : status === "active" ? (
            <Box
              sx={{
                height: 12,
                width: 12,
                borderRadius: "50%",
                bgcolor: (theme) => theme.palette.background.paper,
              }}
            />
          ) : (
            <Typography variant="body2" component="span">
              {step}
            </Typography>
          )}
        </Box>
      </motion.div>
    </motion.div>
  );
};

export const CheckIcon: React.FC<{ sx?: SxProps<Theme> }> = ({ sx }) => (
  <Box
    component="svg"
    sx={{ height: 16, width: 16, color: (t) => t.palette.common.white, ...(sx as any) }}
    fill="none"
    viewBox="0 0 24 24"
  >
    <motion.path
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.1, type: "tween", ease: "easeOut", duration: 0.3 }}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 13l4 4L19 7"
    />
  </Box>
);
