"use client";

import { type FC } from "react";
import Image from "next/image";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import TruncatedText from "@/components/shared/TruncatedText";
import type { SuggestionAcceptOverrides, SuggestionItem } from "@/lib/api/types";
import { needsOverrides } from "@/lib/integrations/suggestionKinds";
import { safeHttpsUrl } from "@/utils/helpers/safeHttpUrl";
import { describe } from "./describe";
import { OverridesForm } from "./OverridesForm";

export const titleId = (id: string) => `suggestion-title-${id}`;
export const acceptId = (id: string) => `suggestion-accept-${id}`;

const Value: FC<{ text: string | null; image: boolean; label: string }> = ({
  text,
  image,
  label,
}) => {
  const { t } = useLanguage();
  const empty = t.suggestions.emptyNow;
  if (image) {
    const src = safeHttpsUrl(text);
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
    <TruncatedText text={text ?? empty} variant="body2" lines={3}>
      {text ?? empty}
    </TruncatedText>
  );
};

/**
 * One suggestion: what it is, the value now beside the suggested one, Accept and Dismiss. Used
 * by the inbox and by the strips on the profile. Nothing is pre-accepted: a `fill` is as much a
 * click as a `replace`. While a call is out the buttons stay in the tab order (`aria-disabled`),
 * so focus is never dropped mid-answer.
 */
export const SuggestionCard: FC<{
  item: SuggestionItem;
  busy: boolean;
  /** The form for an education or experience entry is open. */
  formOpen: boolean;
  /** The API's refusal of the form, shown with it. */
  formError: string | null;
  onAccept: (overrides?: SuggestionAcceptOverrides) => void;
  onDismiss: () => void;
  onOpenForm: () => void;
  onCloseForm: () => void;
}> = ({ item, busy, formOpen, formError, onAccept, onDismiss, onOpenForm, onCloseForm }) => {
  const { t } = useLanguage();
  const s = t.suggestions;
  const d = describe(item, t);
  const form = needsOverrides(item.kind);
  const modeText =
    item.mode === "fill" ? s.modeFill : item.mode === "replace" ? s.modeReplace : null;

  return (
    <Box
      component="li"
      aria-busy={busy}
      sx={{
        listStyle: "none",
        p: 1.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        minWidth: 0,
      }}
    >
      <Typography
        id={titleId(item.id)}
        component="h4"
        tabIndex={-1}
        sx={{ fontWeight: 700, overflowWrap: "anywhere", outlineOffset: 2 }}
      >
        {d.title}
      </Typography>
      {modeText && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {modeText}
        </Typography>
      )}
      {d.detail && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, overflowWrap: "anywhere" }}
        >
          {d.detail}
        </Typography>
      )}
      {d.compare && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            mt: 1,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {s.now}
            </Typography>
            <Value text={d.current} image={d.image} label={`${d.title}: ${s.now}`} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {s.suggested}
            </Typography>
            <Value text={d.proposed} image={d.image} label={`${d.title}: ${s.suggested}`} />
          </Box>
        </Box>
      )}
      {formOpen && form ? (
        <OverridesForm
          kind={item.kind as "education.add" | "experience.add"}
          busy={busy}
          error={formError}
          idPrefix={`suggestion-form-${item.id}`}
          onSubmit={onAccept}
          onCancel={onCloseForm}
        />
      ) : (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
          <Button
            id={acceptId(item.id)}
            size="small"
            variant="contained"
            aria-disabled={busy}
            aria-label={`${form ? s.fillIn : s.accept}: ${d.title}`}
            onClick={() => {
              if (busy) return;
              if (form) onOpenForm();
              else onAccept();
            }}
            sx={{ minHeight: 40 }}
          >
            {form ? s.fillIn : s.accept}
          </Button>
          <Button
            size="small"
            variant="outlined"
            aria-disabled={busy}
            aria-label={`${s.dismiss}: ${d.title}`}
            onClick={() => {
              if (!busy) onDismiss();
            }}
            sx={{ minHeight: 40 }}
          >
            {s.dismiss}
          </Button>
        </Stack>
      )}
    </Box>
  );
};
