"use client";

import { useMemo, useState, useCallback } from "react";
import ProjectsList from "@/components/projects/ProjectsList";
import ProjectsListToolbar from "@/components/projects/ProjectsListToolbar";
import { projectsMock } from "@/data/project.mock";
import { profileMock } from "@/data/profile.mock";
import Link from "next/link";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function ProjectsContent() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  const filteredProjects = useMemo(() => {
    // Get valid project IDs for the current user
    const userProjectIds = new Set(profileMock.projects.map((p) => p.id));

    let result = projectsMock.filter((p) => {
      // Only show projects that belong to the user
      if (!userProjectIds.has(p.id)) return false;

      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.technologies.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = category ? p.metadata?.category === category : true;
      return matchesSearch && matchesCategory;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "newest":
          return (
            new Date(b.metadata?.startDate || 0).getTime() -
            new Date(a.metadata?.startDate || 0).getTime()
          );
        case "oldest":
          return (
            new Date(a.metadata?.startDate || 0).getTime() -
            new Date(b.metadata?.startDate || 0).getTime()
          );
        case "name_asc":
          return a.title.localeCompare(b.title);
        case "name_desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [search, category, sort]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategory("");
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title={t.common.projects}
        subtitle={t.projects.subtitle}
        action={
          <Button component={Link} href="/projects/new" variant="contained" startIcon={<AddIcon />}>
            {t.common.addNewProject}
          </Button>
        }
      />
      <ProjectsListToolbar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
      />
      <ProjectsList
        projects={filteredProjects}
        searchQuery={search}
        filtered={search !== "" || category !== ""}
        onClearFilters={clearFilters}
      />
    </PageContainer>
  );
}
