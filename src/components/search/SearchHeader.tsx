"use client";

import { FC, memo } from "react";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const SearchHeader: FC<SearchHeaderProps> = ({ searchQuery, onSearchChange }) => {
  const { t } = useLanguage();

  return (
    <>
      <PageHeader title={t.search.title} subtitle={t.search.subtitle} />
      <TextField
        fullWidth
        placeholder={t.search.placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{
          htmlInput: { "aria-label": t.search.placeholder },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
      />
    </>
  );
};

export default memo(SearchHeader);
