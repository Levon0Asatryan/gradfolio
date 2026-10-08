import React, { useCallback } from "react";
import { Box, ButtonBase, SxProps, Theme, Typography } from "@mui/material";
import { motion } from "motion/react";

export type StepIndicatorProps = {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
  label?: string;
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators,
  label,
}) => {
  const status = currentStep === step ? "active" : currentStep < step ? "inactive" : "complete";

  const handleClick = useCallback(() => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step);
  }, [currentStep, disableStepIndicators, onClickStep, step]);

  return (
    <ButtonBase
      onClick={handleClick}
      disabled={disableStepIndicators}
      aria-label={label ?? String(step)}
      aria-current={status === "active" ? "step" : undefined}
      sx={(theme) => ({
        borderRadius: "50%",
        p: 0.5,
        flexShrink: 0,
        // ButtonBase removes the browser outline; keyboard users need to see the focused step.
        "&.Mui-focusVisible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      })}
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
              ? theme.palette.text.secondary
              : theme.palette.getContrastText(theme.palette.primary.main),
          bgcolor:
            status === "inactive" ? theme.palette.action.selected : theme.palette.primary.main,
        })}
      >
        {status === "complete" ? (
          <CheckIcon />
        ) : status === "active" ? (
          <Box
            sx={{
              height: 12,
              width: 12,
              borderRadius: "50%",
              bgcolor: (theme) => theme.palette.primary.contrastText,
            }}
          />
        ) : (
          <Typography variant="body2" component="span" aria-hidden>
            {step}
          </Typography>
        )}
      </Box>
    </ButtonBase>
  );
};

const CheckIcon: React.FC<{ sx?: SxProps<Theme> }> = ({ sx }) => (
  <Box
    component="svg"
    sx={{ height: 16, width: 16, color: "inherit", ...(sx as any) }}
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
