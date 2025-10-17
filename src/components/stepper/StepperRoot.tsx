"use client";

import React, { Children, FC, Fragment, useCallback, useMemo, useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import type { StepperProps } from "./types";
import { StepIndicator } from "./StepIndicator";
import { StepConnector } from "./StepConnector";
import { StepContentWrapper } from "./StepContentWrapper";

export const Stepper: FC<StepperProps> = ({
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
  canProceed,
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

  const onClickStep = useCallback(
    (clicked: number) => {
      setDirection(clicked > currentStep ? 1 : -1);
      updateStep(clicked);
    },
    [currentStep, updateStep],
  );

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  }, [currentStep, updateStep]);

  const handleNext = useCallback(() => {
    if (!isLastStep) {
      if (canProceed && !canProceed(currentStep)) return;
      setDirection(1);
      updateStep(currentStep + 1);
    }
  }, [canProceed, currentStep, isLastStep, updateStep]);

  const handleComplete = useCallback(() => {
    setDirection(1);
    updateStep(totalSteps + 1);
  }, [totalSteps, updateStep]);

  const isNextDisabled = useMemo(() => {
    if (isLastStep) return false;
    if (!canProceed) return false;
    return !canProceed(currentStep);
  }, [canProceed, currentStep, isLastStep]);

  return (
    <Stack alignItems="center" justifyContent="center" sx={sx} {...(rest as any)}>
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
        <Stack direction="row" alignItems="center" sx={{ width: "100%", p: 2 }}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            const indicator = renderStepIndicator ? (
              renderStepIndicator({ step: stepNumber, currentStep, onStepClick: onClickStep })
            ) : (
              <StepIndicator
                step={stepNumber}
                currentStep={currentStep}
                disableStepIndicators={disableStepIndicators}
                onClickStep={onClickStep}
              />
            );
            return (
              <Fragment key={stepNumber}>
                {indicator}
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </Fragment>
            );
          })}
        </Stack>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          sx={contentSx}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <Box sx={{ px: 2, pb: 2, ...(footerSx as any) }}>
            <Stack
              direction="row"
              mt={2.5}
              justifyContent={currentStep !== 1 ? "space-between" : "flex-end"}
            >
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
                disabled={isNextDisabled}
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
