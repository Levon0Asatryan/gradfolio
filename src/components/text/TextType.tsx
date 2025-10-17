"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Typography, type TypographyProps, Box } from "@mui/material";
import { keyframes } from "@emotion/react";

export type VariableSpeed = { min: number; max: number };

export type TextTypeProps = Omit<TypographyProps, "children"> & {
  text: string | string[];
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string;
  cursorBlinkDuration?: number;
  variableSpeed?: VariableSpeed;
  onSentenceComplete?: (text: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
  gradient?: string;
};

const blinkChar = keyframes`
  0%, 49%   { opacity: 1; }
  50%, 100% { opacity: 0; }
`;

export const TextType: React.FC<TextTypeProps> = ({
  text,
  component = "div",
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = "|",
  cursorBlinkDuration = 0.5,
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  gradient,
  sx,
  ...props
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [typingSpeed, variableSpeed]);

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let timeout: any;
    const currentText = textArray[currentTextIndex] ?? "";
    const processedText = reverseMode ? currentText.split("").reverse().join("") : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === "") {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) {
            if (onSentenceComplete)
              onSentenceComplete(textArray[currentTextIndex] ?? "", currentTextIndex);
            return;
          }

          if (onSentenceComplete)
            onSentenceComplete(textArray[currentTextIndex] ?? "", currentTextIndex);

          setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(
            () => {
              setDisplayedText((prev) => prev + processedText[currentCharIndex]);
              setCurrentCharIndex((prev) => prev + 1);
            },
            variableSpeed ? getRandomSpeed() : typingSpeed,
          );
        } else if (textArray.length > 1) {
          timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === "") {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    onSentenceComplete,
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping &&
    (currentCharIndex < (textArray[currentTextIndex] ?? "").length || isDeleting);

  return (
    <Typography
      ref={containerRef as any}
      {...props}
      component={component as any}
      sx={{
        display: "block",
        fontWeight: 800,
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
        backgroundImage: (theme) =>
          gradient ??
          (theme.palette.mode === "light"
            ? `linear-gradient(90deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`
            : `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.text.primary})`),
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        ...((sx as any) || {}),
      }}
    >
      <Box component="span">{displayedText}</Box>
      {showCursor && (
        <Box
          component="span"
          sx={{
            ml: 0.5,
            display: shouldHideCursor ? "none" : "inline-block",
            whiteSpace: "pre", // keeps spaces/pipe visible
            lineHeight: 1,
            animation: `${blinkChar} ${cursorBlinkDuration ?? 0.8}s steps(1, end) infinite`,
            color: (t) => t.palette.text.primary,
            WebkitTextFillColor: "currentColor",
            backgroundImage: "none",
            backgroundClip: "border-box",
            WebkitBackgroundClip: "border-box",
            // optional: make the glyph less thin
            fontWeight: 500, // adjust as you like
            textRendering: "optimizeLegibility",
          }}
        >
          {cursorCharacter ?? "|"}
        </Box>
      )}
    </Typography>
  );
};
