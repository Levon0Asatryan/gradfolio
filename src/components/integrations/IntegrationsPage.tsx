"use client";

import { type FC, memo, useCallback, useMemo, useState } from "react";
import { Box, Container, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import Grid from "@mui/material/Grid";
import IntegrationCard from "@/components/integrations/IntegrationCard";
import ConnectIntegrationDialog from "@/components/integrations/ConnectIntegrationDialog";
import ConfirmDisconnectDialog from "@/components/integrations/ConfirmDisconnectDialog";
import { integrationsMock, type Integration, type IntegrationId } from "@/data/integrations.mock";
import { useLanguage } from "@/components/i18n/LanguageContext";

const containerSx: SxProps<Theme> = (theme) => ({
  py: 3,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
});

const headerSx: SxProps<Theme> = (theme) => ({
  gap: theme.spacing(1),
});

const infoTextSx: SxProps<Theme> = (theme) => ({
  bgcolor: theme.palette.action.hover,
  color: theme.palette.text.secondary,
  borderRadius: 1,
  px: 1.5,
  py: 1,
});

const emptyStateSx: SxProps<Theme> = () => ({
  minHeight: 240,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

/**
 * IntegrationsPage
 * Renders the Integrations settings screen, listing LinkedIn and GitHub with
 * mock local state for connecting/disconnecting and informational context.
 */
const IntegrationsPage: FC = () => {
  const { t } = useLanguage();
  const [integrations, setIntegrations] = useState<Integration[]>(integrationsMock);
  const [connectOpen, setConnectOpen] = useState<boolean>(false);
  const [disconnectOpen, setDisconnectOpen] = useState<boolean>(false);
  const [target, setTarget] = useState<Integration | null>(null);

  const noneConnected = useMemo(() => {
    return integrations.length > 0 && integrations.every((i) => i.status === "not_connected");
  }, [integrations]);

  const performConnect = useCallback((id: IntegrationId) => {
    setIntegrations((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              status: "connected",
              lastSyncedAt: new Date().toISOString(),
            }
          : it,
      ),
    );
  }, []);

  const performDisconnect = useCallback((id: IntegrationId) => {
    setIntegrations((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, status: "not_connected", lastSyncedAt: undefined } : it,
      ),
    );
  }, []);

  const openConnect = useCallback(
    (id: IntegrationId) => {
      setTarget(integrations.find((i) => i.id === id) ?? null);
      setConnectOpen(true);
    },
    [integrations],
  );

  const closeConnect = useCallback((): void => {
    setConnectOpen(false);
    setTarget(null);
  }, []);

  const confirmConnect = useCallback((): void => {
    const id = target?.id;
    if (id) {
      performConnect(id);
    }
    closeConnect();
  }, [performConnect, target, closeConnect]);

  const openDisconnect = useCallback(
    (id: IntegrationId) => {
      setTarget(integrations.find((i) => i.id === id) ?? null);
      setDisconnectOpen(true);
    },
    [integrations],
  );

  const closeDisconnect = useCallback((): void => {
    setDisconnectOpen(false);
    setTarget(null);
  }, []);

  const confirmDisconnect = useCallback((): void => {
    const id = target?.id;
    if (id) {
      performDisconnect(id);
    }
    closeDisconnect();
  }, [performDisconnect, target, closeDisconnect]);

  const renderIntegrationItem = useCallback(
    (it: Integration) => (
      <Grid key={it.id} size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
        <IntegrationCard
          id={it.id}
          name={it.name}
          description={t.integrations.descriptions[it.id]}
          status={it.status}
          lastSyncedAt={it.lastSyncedAt}
          onConnect={openConnect}
          onDisconnect={openDisconnect}
          docUrl={it.docUrl}
        />
      </Grid>
    ),
    [openConnect, openDisconnect, t],
  );

  if (!integrations || integrations.length === 0) {
    return (
      <Container maxWidth="md" sx={containerSx}>
        <Stack sx={headerSx}>
          <Typography component="h1" variant="h4">
            {t.integrations.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t.integrations.subtitle}
          </Typography>
        </Stack>
        <Box sx={emptyStateSx}>
          <Typography variant="body1" color="text.secondary">
            {t.integrations.emptyState}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={containerSx}>
      <Stack sx={headerSx}>
        <Typography component="h1" variant="h4">
          {t.integrations.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t.integrations.subtitle}
        </Typography>
      </Stack>

      {noneConnected && (
        <Box role="status" aria-live="polite" sx={infoTextSx}>
          <Typography variant="body2">{t.integrations.infoText}</Typography>
        </Box>
      )}

      <Grid
        container
        spacing={2}
        component="section"
        alignItems="stretch"
        columns={{ xs: 12, md: 12 }}
      >
        {integrations.map(renderIntegrationItem)}
      </Grid>

      <ConnectIntegrationDialog
        open={connectOpen}
        name={target?.name ?? ""}
        description={target?.description ?? ""}
        onCancel={closeConnect}
        onConfirm={confirmConnect}
      />

      <ConfirmDisconnectDialog
        open={disconnectOpen}
        name={target?.name ?? ""}
        onCancel={closeDisconnect}
        onConfirm={confirmDisconnect}
      />
    </Container>
  );
};

export default memo(IntegrationsPage);
