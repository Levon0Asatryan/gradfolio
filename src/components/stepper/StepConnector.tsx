import React from "react";
import { Box } from "@mui/material";
import { motion } from "motion/react";

export type StepConnectorProps = { isComplete: boolean };

export const StepConnector: React.FC<StepConnectorProps> = ({ isComplete }) => {
  const lineVariants = {
    incomplete: { width: 0 },
    complete: { width: "100%" },
  } as const;

  return (
    <Box
      sx={{
        position: "relative",
        mx: 0.5,
        height: 2,
        flex: 1,
        borderRadius: 0.5,
        bgcolor: (t) => t.palette.divider,
      }}
    >
      <Box sx={{ position: "absolute", inset: 0, color: (t) => t.palette.primary.main }}>
        <motion.div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            background: "currentColor",
          }}
          variants={lineVariants as any}
          initial={false}
          animate={isComplete ? "complete" : "incomplete"}
          transition={{ duration: 0.4 }}
        />
      </Box>
    </Box>
  );
};
