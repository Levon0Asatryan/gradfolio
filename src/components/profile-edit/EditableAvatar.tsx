"use client";

import { FC, memo, useCallback, useState, MouseEvent } from "react";
import { Box, styled } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import Image from "next/image";

export interface EditableAvatarProps {
  src: string;
  alt: string;
  size?: number;
  onUpload?: (newUrl: string) => void;
}

const Overlay = styled(Box)(() => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0,
  transition: "opacity 0.2s",
  cursor: "pointer",
  color: "#fff",
  "&:hover": {
    opacity: 1,
  },
}));

const EditableAvatar: FC<EditableAvatarProps> = ({ src, alt, size = 96, onUpload }) => {
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      // Simulate upload
      const mockNewAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
      if (onUpload) {
        onUpload(mockNewAvatar);
      }
      setCurrentSrc(mockNewAvatar);
    },
    [onUpload],
  );

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        border: "2px solid",
        borderColor: "divider",
      }}
    >
      <Image src={currentSrc} alt={alt} fill sizes={`${size}px`} style={{ objectFit: "cover" }} />
      <Overlay onClick={handleClick}>
        <PhotoCameraIcon />
      </Overlay>
    </Box>
  );
};

export default memo(EditableAvatar);
