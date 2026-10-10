"use client";

import { FC, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { MAX_QUERY_LENGTH, cleanQuery, searchHref } from "@/lib/discovery/query";

const DEBOUNCE_MS = 300;

/**
 * The search box. It is a plain GET form to `/search` (works without JavaScript, Enter
 * submits); the script adds results that follow the typing, 300 ms after the last key, by
 * replacing the URL with `/search?q=...`. The target is always `/search`: `/projects` is the
 * owner's protected list.
 */
export const SearchBox: FC<{ initialQuery: string }> = ({ initialQuery }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  /** The query the URL shows, as far as this box knows. */
  const shown = useRef(initialQuery);
  /** Queries this box put in the URL that the page has not echoed back yet, oldest first. */
  const inFlight = useRef<string[]>([]);
  /** An input method is composing: the text is not final, so nothing is searched yet. */
  const composing = useRef(false);
  const [composedTick, setComposedTick] = useState(0);

  // The page re-rendered with `initialQuery`. If it is the echo of a search this box started,
  // the box already shows (or has moved past) it: writing it back would erase what was typed
  // while the search was in flight. Anything else is a navigation from outside (Back, a link):
  // then the box follows the URL.
  useEffect(() => {
    const echoed = inFlight.current.indexOf(initialQuery);
    if (echoed !== -1) {
      inFlight.current.splice(0, echoed + 1);
      shown.current = initialQuery;
      return;
    }
    if (initialQuery === shown.current) return;
    inFlight.current = [];
    shown.current = initialQuery;
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (composing.current) return;
    const next = cleanQuery(value);
    if (next === shown.current) return;
    const timer = setTimeout(() => {
      shown.current = next;
      inFlight.current.push(next);
      startTransition(() => router.replace(searchHref({ q: next })));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, composedTick, router]);

  return (
    <Box
      component="form"
      role="search"
      method="get"
      action="/search"
      sx={{ display: "flex", gap: 1, alignItems: "stretch", position: "relative" }}
    >
      <TextField
        fullWidth
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onBlur={() => {
          // A keyboard that never ends its composition must not leave the search stuck.
          if (composing.current) {
            composing.current = false;
            setComposedTick((n) => n + 1);
          }
        }}
        onCompositionEnd={(e) => {
          composing.current = false;
          setValue((e.target as HTMLInputElement).value);
          // The text may equal the last value: run the debounce for it all the same.
          setComposedTick((n) => n + 1);
        }}
        placeholder={t.search.placeholder}
        slotProps={{
          htmlInput: {
            "aria-label": t.search.searchLabel,
            maxLength: MAX_QUERY_LENGTH * 2,
            enterKeyHint: "search",
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
      />
      <Button type="submit" variant="contained" sx={{ minHeight: 44, flex: "none" }}>
        {t.search.searchButton}
      </Button>
      {pending && (
        <LinearProgress
          aria-label={t.search.loading}
          sx={{ position: "absolute", left: 0, right: 0, bottom: -8, height: 3 }}
        />
      )}
    </Box>
  );
};
