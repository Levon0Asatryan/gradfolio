"use client";

import { type FC, type ReactNode } from "react";
import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import TruncatedText from "@/components/shared/TruncatedText";
import type { SuggestionItem } from "@/lib/api/types";
import type { Dictionary } from "@/data/locales/types";
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";

/** The translated name of the field a suggestion would change. */
export function fieldLabel(
  item: SuggestionItem,
  fields: Dictionary["integrations"]["import"]["profile"]["fields"],
): string {
  switch (item.kind) {
    case "profile.name":
      return fields.name;
    case "profile.headline":
      return fields.headline;
    case "profile.bio":
      return fields.bio;
    case "profile.location":
      return fields.location;
    case "profile.avatarUrl":
      return fields.avatarUrl;
    case "profile.links.github":
      return fields.linksGithub;
    case "profile.links.website":
      return fields.linksWebsite;
    default:
      return item.kind;
  }
}

export interface ProfileState {
  items: SuggestionItem[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  /** The refresh failed but the stored suggestions are shown. */
  refreshError: string | null;
}

/** A value as the student reads it: an image for a photo, text (never markup) for the rest. */
const Value: FC<{ item: SuggestionItem; value: string | null; label: string }> = ({
  item,
  value,
  label,
}) => {
  const { t } = useLanguage();
  const empty = t.integrations.import.profile.emptyNow;
  if (item.kind === "profile.avatarUrl") {
    const src = safeHttpsUrl(value);
    return src ? (
      <Image
        src={src}
        alt={label}
        width={48}
        height={48}
        unoptimized
        style={{ borderRadius: "50%", objectFit: "cover" }}
      />
    ) : (
      <Typography variant="body2">{empty}</Typography>
    );
  }
  return (
    <TruncatedText text={value ?? empty} variant="body2" lines={3}>
      {value ?? empty}
    </TruncatedText>
  );
};

/**
 * The profile data GitHub offers, one row per field: what it holds now beside what GitHub has,
 * and its own checkbox. A field that is empty now is pre-ticked (a fill); one that would replace
 * something is not. Nothing is written until the dialog's Save.
 */
export const ProfileTab: FC<{
  state: ProfileState;
  checked: Set<string>;
  onToggle: (id: string) => void;
  onDismiss: (id: string) => void;
  onRetry: () => void;
  errorText: (code: string) => ReactNode;
  dismissError: string | null;
}> = ({ state, checked, onToggle, onDismiss, onRetry, errorText, dismissError }) => {
  const { t } = useLanguage();
  const text = t.integrations.import.profile;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {text.intro}
      </Typography>
      {state.refreshError && <Alert severity="warning">{errorText(state.refreshError)}</Alert>}
      {dismissError && (
        <Alert severity="error" role="alert">
          {dismissError}
        </Alert>
      )}
      {state.error && (
        <Alert
          severity="error"
          role="alert"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              {t.integrations.retry}
            </Button>
          }
        >
          {errorText(state.error)}
        </Alert>
      )}
      {state.loading && (
        <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 3 }}>
          <CircularProgress size={20} />
          <Typography>{text.loading}</Typography>
        </Box>
      )}
      {state.loaded && !state.error && state.items.length === 0 && (
        <Typography sx={{ py: 3 }}>{text.empty}</Typography>
      )}
      {state.items.length > 0 && (
        <List
          disablePadding
          aria-label={t.integrations.import.tabProfile}
          sx={{ display: "grid", gap: 1 }}
        >
          {state.items.map((item) => {
            const label = fieldLabel(item, text.fields);
            const labelId = `profile-${item.id}-label`;
            return (
              <ListItem
                key={item.id}
                disablePadding
                sx={{
                  alignItems: "flex-start",
                  gap: 1,
                  p: 1.5,
                  border: 1,
                  borderColor: checked.has(item.id) ? "primary.main" : "divider",
                  borderRadius: 2,
                }}
              >
                <Checkbox
                  checked={checked.has(item.id)}
                  onChange={() => onToggle(item.id)}
                  slotProps={{ input: { "aria-labelledby": labelId } }}
                  sx={{ p: 0.5 }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography id={labelId} sx={{ fontWeight: 700 }}>
                    {label}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                      mt: 0.5,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        {text.now}
                      </Typography>
                      <Value item={item} value={item.current} label={`${label}: ${text.now}`} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        {text.github}
                      </Typography>
                      <Value item={item} value={item.proposed} label={`${label}: ${text.github}`} />
                    </Box>
                  </Box>
                  <Button size="small" onClick={() => onDismiss(item.id)} sx={{ mt: 1, px: 0 }}>
                    {text.dismiss}
                  </Button>
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}
    </Stack>
  );
};
