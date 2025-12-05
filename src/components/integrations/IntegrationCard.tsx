"use client";

import { memo, type FC, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import GitHub from "@mui/icons-material/GitHub";
import LinkedIn from "@mui/icons-material/LinkedIn";
import type { IntegrationId, IntegrationStatus } from "@/data/integrations.mock";

export interface IntegrationCardProps {
  id: IntegrationId;
  name: string;
  description: string;
  status: IntegrationStatus;
  lastSyncedAt?: string;
  onConnect: (id: IntegrationId) => void;
  onDisconnect: (id: IntegrationId) => void;
}

const cardSx: SxProps<Theme> = (theme) => ({
  p: 1,
  bgcolor: theme.palette.background.paper,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
});

const contentSx: SxProps<Theme> = () => ({
  flexGrow: 1,
});

const headerRowSx: SxProps<Theme> = (theme) => ({
  alignItems: "center",
  justifyContent: "space-between",
  mb: 0.5,
  gap: theme.spacing(1),
});

const descriptionSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.text.secondary,
});

const actionsRowSx: SxProps<Theme> = (theme) => ({
  px: 2,
  pb: 1.5,
  pt: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
});

const iconBoxSx: SxProps<Theme> = (theme) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: 1,
  bgcolor: theme.palette.action.hover,
  color: theme.palette.text.primary,
});

/**
 * IntegrationCard
 * Renders a single integration entry with status and actions to connect/disconnect.
 */
const IntegrationCard: FC<IntegrationCardProps> = ({
  id,
  name,
  description,
  status,
  lastSyncedAt,
  onConnect,
  onDisconnect,
}) => {
  const isConnected = status === "connected";

  const StatusChip = useMemo(() => {
    const color = isConnected ? "success" : "default";
    const label = isConnected ? "Connected" : "Not connected";
    return <Chip size="small" color={color} label={label} />;
  }, [isConnected]);

  const handlePrimaryClick = useCallback(() => {
    if (isConnected) {
      onDisconnect(id);
    } else {
      onConnect(id);
    }
  }, [id, isConnected, onConnect, onDisconnect]);

  const ProviderIcon = useMemo(() => {
    if (id === "github") return <GitHub fontSize="small" />;
    if (id === "linkedin") return <LinkedIn fontSize="small" />;
    return null;
  }, [id]);

  const lastSyncText = useMemo(() => {
    if (!lastSyncedAt) return null;
    const d = new Date(lastSyncedAt);
    const formatted = isNaN(d.getTime()) ? lastSyncedAt : d.toLocaleString();
    return (
      <Typography variant="caption" color="text.secondary">
        Last synced: {formatted}
      </Typography>
    );
  }, [lastSyncedAt]);

  return (
    <Card component="section" variant="outlined" sx={cardSx}>
      <CardContent sx={contentSx}>
        <Stack direction="row" sx={headerRowSx}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box sx={iconBoxSx}>{ProviderIcon}</Box>
            <Typography component="h3" variant="h6">
              {name}
            </Typography>
          </Stack>
          {StatusChip}
        </Stack>

        <Typography variant="body2" sx={descriptionSx}>
          {description}
        </Typography>

        <Box mt={1}>{lastSyncText}</Box>
      </CardContent>

      <CardActions sx={actionsRowSx}>
        <Stack direction="row" spacing={1}>
          <Button
            variant={isConnected ? "outlined" : "contained"}
            color={isConnected ? "inherit" : "primary"}
            onClick={handlePrimaryClick}
          >
            {isConnected ? "Disconnect" : "Connect"}
          </Button>
          <Button variant="text" color="secondary" size="small">
            Learn more
          </Button>
        </Stack>
        {/* Placeholder for potential secondary actions or badges */}
        <span />
      </CardActions>
    </Card>
  );
};

export default memo(IntegrationCard);
