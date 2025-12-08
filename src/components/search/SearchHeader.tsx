"use client";

import { FC, memo } from "react";
import { Box, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const headerContainerSx = {
  textAlign: "center" as const,
  maxWidth: 800,
  mx: "auto",
  mb: 4,
  px: 2,
};

const searchFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    backgroundColor: "background.paper",
    boxShadow: 1, // subtle shadow
    transition: "box-shadow 0.2s ease-in-out",
    "&:hover": {
      boxShadow: 2,
    },
    "&.Mui-focused": {
      boxShadow: 3,
    },
  },
};

const SearchHeader: FC<SearchHeaderProps> = ({ searchQuery, onSearchChange }) => {
  const { t } = useLanguage();

  return (
    <Box component="section" sx={headerContainerSx}>
      <Stack spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <Typography component="h1" variant="h3" fontWeight="bold">
          {t.search.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600 }}>
          {t.search.subtitle}
        </Typography>
      </Stack>

      <TextField
        fullWidth
        placeholder={t.search.placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        variant="outlined"
        sx={searchFieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};

export default memo(SearchHeader);
