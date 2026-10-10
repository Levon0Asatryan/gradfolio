"use client";

import { FC } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { UserFacets } from "@/lib/api/types";
import type { PeopleBrowseQuery } from "@/lib/discovery/browse";

/**
 * School, major and graduation year, from the values that exist. A plain GET form to the
 * same page: it works without JavaScript and the URL holds the filters. A chosen value the
 * facets no longer list (a stale link) is still shown, so the form never lies about the URL.
 */
export const PeopleFilters: FC<{ facets: UserFacets | null; query: PeopleBrowseQuery }> = ({
  facets,
  query,
}) => {
  const { t } = useLanguage();
  const b = t.browse;
  const withCurrent = <T extends string | number>(values: T[], current: T | undefined) =>
    current !== undefined && !values.includes(current) ? [current, ...values] : values;
  const schools = withCurrent(facets?.schools.map((f) => f.value) ?? [], query.school);
  const majors = withCurrent(facets?.majors.map((f) => f.value) ?? [], query.major);
  const years = withCurrent(facets?.years.map((f) => f.value) ?? [], query.gradYear);
  const active = Boolean(query.school || query.major || query.gradYear);

  const select = (
    name: string,
    label: string,
    values: Array<string | number>,
    value: string | number | undefined,
  ) => (
    <TextField
      select
      fullWidth
      size="small"
      name={name}
      label={label}
      defaultValue={value ?? ""}
      slotProps={{ select: { native: false }, htmlInput: { "aria-label": label } }}
    >
      <MenuItem value="">{b.any}</MenuItem>
      {values.map((v) => (
        <MenuItem key={v} value={v}>
          {v}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Box
      component="form"
      method="get"
      action="/browse/people"
      aria-label={b.filters}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr) auto" },
        gap: 2,
        alignItems: "center",
      }}
    >
      {select("school", b.school, schools, query.school)}
      {select("major", b.major, majors, query.major)}
      {select("gradYear", b.gradYear, years, query.gradYear)}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button type="submit" variant="contained" sx={{ minHeight: 44 }}>
          {b.apply}
        </Button>
        {active && (
          <Button component={Link} href="/browse/people" variant="text" sx={{ minHeight: 44 }}>
            {b.clear}
          </Button>
        )}
      </Box>
    </Box>
  );
};
