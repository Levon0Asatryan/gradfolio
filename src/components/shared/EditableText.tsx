"use client";

import { FC, memo, useCallback, useState, useEffect, KeyboardEvent } from "react";
import {
  Box,
  TextField,
  Typography,
  TypographyVariant,
  useTheme,
  SxProps,
  Theme,
} from "@mui/material";

export interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  variant?: TypographyVariant;
  multiline?: boolean;
  label?: string;
  placeholder?: string;
  component?: React.ElementType;
  sx?: SxProps<Theme>;
  textSx?: SxProps<Theme>;
}

const EditableText: FC<EditableTextProps> = ({
  value,
  onChange,
  variant = "body1",
  multiline = false,
  label,
  placeholder,
  component,
  sx,
  textSx,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const theme = useTheme();

  // Sync internal state if prop changes while not editing
  useEffect(() => {
    if (!isEditing) {
      setTempValue(value);
    }
  }, [value, isEditing]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setTempValue(value);
  }, [value]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    if (tempValue !== value) {
      onChange(tempValue);
    }
  }, [tempValue, value, onChange]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setTempValue(value);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && !multiline) {
        handleSave();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel, multiline],
  );

  if (isEditing) {
    return (
      <TextField
        variant="outlined"
        size="small"
        fullWidth
        multiline={multiline}
        minRows={multiline ? 3 : 1}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        label={label}
        placeholder={placeholder}
        sx={{
          "& .MuiInputBase-root": {
            fontSize: theme.typography[variant].fontSize,
            fontWeight: theme.typography[variant].fontWeight,
            lineHeight: theme.typography[variant].lineHeight,
            fontFamily: theme.typography[variant].fontFamily,
          },
          ...sx,
        }}
      />
    );
  }

  return (
    <Box
      onClick={handleStartEdit}
      sx={{
        cursor: "pointer",
        borderRadius: 1,
        p: 0.5,
        mx: -0.5,
        minWidth: "2rem",
        minHeight: "1.5em", // Ensure empty state is clickable
        "&:hover": {
          bgcolor: "action.hover",
          outline: `1px dashed ${theme.palette.text.secondary}`,
        },
        display: "inline-block",
        ...sx,
      }}
    >
      <Typography
        variant={variant}
        {...(component && { component })}
        color={!value ? "text.secondary" : "text.primary"}
        sx={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontStyle: !value ? "italic" : "normal",
          ...textSx,
        }}
      >
        {value || placeholder || "Click to edit"}
      </Typography>
    </Box>
  );
};

export default memo(EditableText);
