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
import type { ProjectAttachment } from "@/lib/api/types";
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";

export interface AttachmentsGalleryProps {
  items?: ProjectAttachment[];
}

/** The only places an iframe may point (the API computes `embedUrl` for allow-listed hosts). */
const EMBED_PREFIXES = [
  "https://www.youtube-nocookie.com/embed/",
  "https://player.vimeo.com/video/",
];
export const safeEmbedUrl = (url: string | null): string | undefined =>
  url && EMBED_PREFIXES.some((p) => url.startsWith(p)) ? url : undefined;

import { useLanguage } from "@/components/i18n/LanguageContext";

/** An https image, or an empty box: a URL that is not https is never loaded. */
const Pic: FC<{ src: string | null; alt: string; sizes: string; fit: "cover" | "contain" }> = ({
  src,
  alt,
  sizes,
  fit,
}) => {
  const safe = safeHttpsUrl(src);
  if (!safe) return <Box sx={{ width: "100%", height: "100%", bgcolor: "action.hover" }} />;
  return <Image src={safe} alt={alt} fill sizes={sizes} style={{ objectFit: fit }} unoptimized />;
};

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
                      <Pic
                        src={att.thumbnailUrl ?? att.url}
                        alt={att.title || t.common.projectImage}
                        sizes="(max-width: 600px) 100vw, 300px"
                        fit="cover"
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
                    href={safeHttpsUrl(att.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={att.title || t.common.openVideo}
                  >
                    <Box sx={{ position: "relative", aspectRatio: "16 / 9" }}>
                      {safeHttpsUrl(att.thumbnailUrl) ? (
                        <Pic
                          src={att.thumbnailUrl}
                          alt={att.title || t.common.videoThumbnail}
                          sizes="(max-width: 600px) 100vw, 300px"
                          fit="cover"
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
                    <Link href={safeHttpsUrl(att.url)} target="_blank" rel="noopener noreferrer">
                      {att.type === "pdf" ? t.common.openPDF : t.common.link}
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
                    <Pic
                      src={active.url}
                      alt={active.title || t.common.attachmentImage}
                      sizes="100vw"
                      fit="contain"
                    />
                  </Box>
                </Stack>
              ) : active.type === "video" ? (
                <Box sx={{ position: "relative", pt: "56.25%" }}>
                  {safeEmbedUrl(active.embedUrl) ? (
                    <iframe
                      title={active.title || t.common.video}
                      src={safeEmbedUrl(active.embedUrl)}
                      referrerPolicy="strict-origin-when-cross-origin"
                      sandbox="allow-scripts allow-same-origin allow-presentation"
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
