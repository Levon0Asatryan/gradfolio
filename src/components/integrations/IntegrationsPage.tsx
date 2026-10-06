"use client";

import { type FC, memo, useCallback, useMemo, useState } from "react";
import { Box, Typography, type SxProps, type Theme } from "@mui/material";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import IntegrationCard from "@/components/integrations/IntegrationCard";
import ConnectIntegrationDialog from "@/components/integrations/ConnectIntegrationDialog";
import ConfirmDisconnectDialog from "@/components/integrations/ConfirmDisconnectDialog";
import { integrationsMock, type Integration, type IntegrationId } from "@/data/integrations.mock";
import { useLanguage } from "@/components/i18n/LanguageContext";

const infoTextSx: SxProps<Theme> = (theme) => ({
  bgcolor: theme.palette.surface.soft,
  color: theme.palette.text.primary,
  borderRadius: 3,
  px: 2,
  py: 1.5,
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
      <Box key={it.id} sx={{ display: "flex", minWidth: 0 }}>
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
      </Box>
    ),
    [openConnect, openDisconnect, t],
  );

  return (
    <PageContainer maxWidth={900}>
      <PageHeader title={t.integrations.title} subtitle={t.integrations.subtitle} />

      {integrations.length === 0 ? (
        <Box sx={emptyStateSx}>
          <Typography variant="body1" color="text.secondary">
            {t.integrations.emptyState}
          </Typography>
        </Box>
      ) : (
        <>
          {noneConnected && (
            <Box role="status" aria-live="polite" sx={infoTextSx}>
              <Typography variant="body2">{t.integrations.infoText}</Typography>
            </Box>
          )}

          <Box
            component="section"
            aria-label={t.integrations.title}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
              gap: 3,
              alignItems: "stretch",
            }}
          >
            {integrations.map(renderIntegrationItem)}
          </Box>
        </>
      )}

      <ConnectIntegrationDialog
        open={connectOpen}
        name={target?.name ?? ""}
        description={target ? t.integrations.descriptions[target.id] : ""}
        onCancel={closeConnect}
        onConfirm={confirmConnect}
      />

      <ConfirmDisconnectDialog
        open={disconnectOpen}
        name={target?.name ?? ""}
        onCancel={closeDisconnect}
        onConfirm={confirmDisconnect}
      />
    </PageContainer>
  );
};

export default memo(IntegrationsPage);
