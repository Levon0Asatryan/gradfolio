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
  const current = useRef(initialQuery);

  useEffect(() => {
    current.current = initialQuery;
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const next = cleanQuery(value);
    if (next === current.current) return;
    const timer = setTimeout(() => {
      current.current = next;
      startTransition(() => router.replace(searchHref({ q: next })));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, router]);

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
