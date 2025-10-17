"use client";

import React, { Children, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Stack, SxProps, Theme, Typography } from "@mui/material";
import { motion, AnimatePresence } from "motion/react";

export type StepperProps = {
  children: React.ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  backButtonProps?: React.ComponentProps<typeof Button>;
  nextButtonProps?: React.ComponentProps<typeof Button>;
  disableStepIndicators?: boolean;
  renderStepIndicator?: (args: {
    step: number;
    currentStep: number;
    onStepClick: (clicked: number) => void;
  }) => React.ReactNode;
  sx?: SxProps<Theme>;
  stepperContainerSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  footerSx?: SxProps<Theme>;
};

export const Stepper: React.FC<StepperProps> = ({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  backButtonText = "Back",
  nextButtonText = "Continue",
  backButtonProps,
  nextButtonProps,
  disableStepIndicators = false,
  renderStepIndicator,
  sx,
  stepperContainerSx,
  contentSx,
  footerSx,
  ...rest
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);

  const stepsArray = useMemo(() => Children.toArray(children), [children]);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = useCallback(
    (newStep: number) => {
      setCurrentStep(newStep);
      if (newStep > totalSteps) {
        onFinalStepCompleted();
      } else {
        onStepChange(newStep);
      }
    },
    [onFinalStepCompleted, onStepChange, totalSteps],
  );

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  }, [currentStep, updateStep]);

  const handleNext = useCallback(() => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  }, [currentStep, isLastStep, updateStep]);

  const handleComplete = useCallback(() => {
    setDirection(1);
    updateStep(totalSteps + 1);
  }, [totalSteps, updateStep]);

  return (
    <Stack alignItems="center" justifyContent="center" sx={sx} {...rest as any}>
      <Box
        sx={(theme) => ({
          width: "100%",
          maxWidth: 448,
          borderRadius: 4,
          boxShadow: theme.shadows[8],
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          ...((stepperContainerSx as any) || {}),
        })}
      >
        {/* Step indicators */}
        <Stack direction="row" alignItems="center" sx={{ width: "100%", p: 2 }}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: (clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    },
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    currentStep={currentStep}
                    disableStepIndicators={disableStepIndicators}
                    onClickStep={(clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                  />
                )}
                {isNotLastStep && (
                  <StepConnector isComplete={currentStep > stepNumber} />
                )}
              </React.Fragment>
            );
          })}
        </Stack>

        {/* Content */}
        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          sx={contentSx}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {/* Footer */}
        {!isCompleted && (
          <Box sx={{ px: 2, pb: 2, ...(footerSx as any) }}>
            <Stack direction="row" mt={2.5} justifyContent={currentStep !== 1 ? "space-between" : "flex-end"}>
              {currentStep !== 1 && (
                <Button
                  variant="text"
                  color="inherit"
                  onClick={handleBack}
                  {...backButtonProps}
                  sx={{
                    ...((backButtonProps as any)?.sx || {}),
                    color: (theme) => theme.palette.text.secondary,
                  }}
                >
                  {backButtonText}
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={isLastStep ? handleComplete : handleNext}
                {...nextButtonProps}
                sx={{ borderRadius: 9999, ...(nextButtonProps as any)?.sx }}
              >
                {isLastStep ? "Complete" : nextButtonText}
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    </Stack>
  );
};

type StepContentWrapperProps = {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

const StepContentWrapper: React.FC<StepContentWrapperProps> = ({ isCompleted, currentStep, direction, children, sx }) => {
  const [parentHeight, setParentHeight] = useState(0);

  return (
    <motion.div
      style={{ position: "relative", overflow: "hidden" }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: "spring", duration: 0.4 }}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={(h) => setParentHeight(h)}>
            <Box sx={{ px: 2, ...(sx as any) }}>{children}</Box>
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SlideTransition: React.FC<{
  children: React.ReactNode;
  direction: number;
  onHeightReady: (h: number) => void;
}> = ({ children, direction, onHeightReady }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) onHeightReady(containerRef.current.offsetHeight);
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4 }}
      style={{ position: "absolute", left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
};

const stepVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? "-100%" : "100%",
    opacity: 0,
  }),
  center: {
    x: "0%",
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? "50%" : "-50%",
    opacity: 0,
  }),
};

export const Step: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ px: 2, py: 0 }}>{children}</Box>
);

const StepIndicator: React.FC<{
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
}> = ({ step, currentStep, onClickStep, disableStepIndicators }) => {
  const status = currentStep === step ? "active" : currentStep < step ? "inactive" : "complete";

  const handleClick = useCallback(() => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step);
  }, [currentStep, disableStepIndicators, onClickStep, step]);

  return (
    <motion.div onClick={handleClick} initial={false} animate={status as any} style={{ cursor: "pointer" }}>
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
            <CheckIcon sx={{ color: (t) => t.palette.common.white }} />
          ) : status === "active" ? (
            <Box sx={{ height: 12, width: 12, borderRadius: "50%", bgcolor: (t) => t.palette.common.white }} />
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

const StepConnector: React.FC<{ isComplete: boolean }> = ({ isComplete }) => {
  const lineVariants = {
    incomplete: { width: 0 },
    complete: { width: "100%" },
  } as const;

  return (
    <Box sx={{ position: "relative", mx: 0.5, height: 2, flex: 1, borderRadius: 0.5, bgcolor: (t) => t.palette.divider }}>
      <Box sx={{ position: "absolute", inset: 0, color: (t) => t.palette.primary.main }}>
        <motion.div
          style={{ position: "absolute", left: 0, top: 0, height: "100%", background: "currentColor" }}
          variants={lineVariants as any}
          initial={false}
          animate={isComplete ? "complete" : "incomplete"}
          transition={{ duration: 0.4 }}
        />
      </Box>
    </Box>
  );
};

const CheckIcon: React.FC<{ sx?: SxProps<Theme> }> = ({ sx }) => (
  <Box component="svg" sx={{ height: 16, width: 16, color: (t) => t.palette.common.white, ...(sx as any) }} fill="none" viewBox="0 0 24 24">
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
