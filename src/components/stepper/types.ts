import type React from "react";
import type { SxProps, Theme, ButtonProps } from "@mui/material";

export type RenderStepIndicatorArgs = {
  step: number;
  currentStep: number;
  onStepClick: (clicked: number) => void;
};

export type StepperProps = {
  children: React.ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  backButtonProps?: ButtonProps;
  nextButtonProps?: ButtonProps;
  disableStepIndicators?: boolean;
  renderStepIndicator?: (args: RenderStepIndicatorArgs) => React.ReactNode;
  canProceed?: (currentStep: number) => boolean;
  sx?: SxProps<Theme>;
  stepperContainerSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  footerSx?: SxProps<Theme>;
};
