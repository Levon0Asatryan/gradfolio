import React, { useEffect, useLayoutEffect, useRef } from "react";
import { motion } from "motion/react";

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

export type SlideTransitionProps = {
  children: React.ReactNode;
  direction: number;
  onHeightReady: (h: number) => void;
};

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  direction,
  onHeightReady,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) onHeightReady(containerRef.current.offsetHeight);
  }, [children, onHeightReady]);

  // A step whose own content grows (an error shown after an action) is not a new `children`
  // prop: without this the spacer keeps the first height and the content is clipped.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => onHeightReady(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [onHeightReady]);

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
