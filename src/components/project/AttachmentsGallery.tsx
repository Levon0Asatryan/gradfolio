"use client";

import { FC, memo, useCallback, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { Panel } from "@/components/layout/Panel";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import type { ProjectAttachment } from "@/data/project.mock";

export interface AttachmentsGalleryProps {
  items?: ProjectAttachment[];
}

const isYouTube = (url: string) => /youtube\.com|youtu\.be/.test(url);

import { useLanguage } from "@/components/i18n/LanguageContext";

const AttachmentsGallery: FC<AttachmentsGalleryProps> = ({ items = [] }) => {
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const active = useMemo(() => items.find((i) => i.id === lightboxId), [items, lightboxId]);
  const { t } = useLanguage();

  const open = useCallback((id: string) => setLightboxId(id), []);
  const close = useCallback(() => setLightboxId(null), []);

  if (!items || items.length === 0) {
    return (
      <Panel title={t.common.attachments}>
        <Typography variant="body2" color="text.secondary">
          {t.common.noAttachments}
        </Typography>
      </Panel>
    );
  }

  return (
    <>
      <Panel title={t.common.attachmentsEvidence}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
            gap: 2,
          }}
        >
          {items.map((att) => (
            <Box key={att.id} sx={{ display: "flex", minWidth: 0 }}>
              {att.type === "image" ? (
                <Card variant="outlined" sx={{ width: "100%" }}>
                  <CardActionArea
                    aria-label={att.title || t.common.openImage}
                    onClick={() => open(att.id)}
                  >
                    <Box sx={{ position: "relative", aspectRatio: "16 / 10" }}>
                      <Image
                        src={att.thumbnailUrl || att.url}
                        alt={att.title || t.common.projectImage}
                        fill
                        sizes="(max-width: 600px) 100vw, 300px"
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    </Box>
                    {att.title && (
                      <CardContent>
                        <Typography variant="body2">{att.title}</Typography>
                      </CardContent>
                    )}
                  </CardActionArea>
                </Card>
              ) : att.type === "video" ? (
                <Card variant="outlined" sx={{ width: "100%" }}>
                  <CardActionArea
                    component="a"
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={att.title || t.common.openVideo}
                  >
                    <Box sx={{ position: "relative", aspectRatio: "16 / 9" }}>
                      {att.thumbnailUrl ? (
                        <Image
                          src={att.thumbnailUrl}
                          alt={att.title || t.common.videoThumbnail}
                          fill
                          sizes="(max-width: 600px) 100vw, 300px"
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />
                      ) : (
                        <Box sx={{ width: "100%", height: "100%", bgcolor: "action.hover" }} />
                      )}
                    </Box>
                    {att.title && (
                      <CardContent>
                        <Typography variant="body2">{att.title}</Typography>
                      </CardContent>
                    )}
                  </CardActionArea>
                </Card>
              ) : (
                <Card variant="outlined" sx={{ width: "100%" }}>
                  <CardContent>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {att.title || att.url}
                    </Typography>
                    <Link href={att.url} target="_blank" rel="noopener noreferrer">
                      {att.type === "pdf"
                        ? t.common.openPDF
                        : isYouTube(att.url)
                          ? t.common.openVideo
                          : t.common.link}
                    </Link>
                  </CardContent>
                </Card>
              )}
            </Box>
          ))}
        </Box>
      </Panel>

      <Dialog
        open={Boolean(active)}
        onClose={close}
        aria-labelledby="lightbox-title"
        maxWidth="lg"
        fullWidth
      >
        {active && (
          <>
            <DialogTitle id="lightbox-title" sx={{ pr: 6 }}>
              {active.title || t.common.preview}
              <IconButton
                onClick={close}
                aria-label={t.common.close}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {active.type === "image" ? (
                <Stack sx={{ alignItems: "center" }}>
                  <Box sx={{ position: "relative", width: "100%", aspectRatio: "16 / 9" }}>
                    <Image
                      src={active.url}
                      alt={active.title || t.common.attachmentImage}
                      fill
                      sizes="100vw"
                      style={{ objectFit: "contain" }}
                      unoptimized
                    />
                  </Box>
                </Stack>
              ) : active.type === "video" ? (
                <Box sx={{ position: "relative", pt: "56.25%" }}>
                  {/* Simple embed for YouTube */}
                  {isYouTube(active.url) ? (
                    <iframe
                      title={active.title || t.common.video}
                      src={active.url.replace("watch?v=", "embed/")}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        border: 0,
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <Typography>
                      {t.common.videoNotEmbedded} {t.common.openExternally}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography>{t.common.useLinkToOpen}</Typography>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
};

export default memo(AttachmentsGallery);
