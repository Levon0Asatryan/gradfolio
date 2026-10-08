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
  /** Label of the next button on the last step. */
  completeButtonText?: string;
  /** Shown in place of the steps once the last one is completed. */
  completedContent?: React.ReactNode;
  /** Accessible name of each step indicator ("Step 2 of 4"). */
  stepLabel?: (step: number, total: number) => string;
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
