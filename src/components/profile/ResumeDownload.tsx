"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { MotionConfig } from "motion/react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { RADIUS } from "@/components/theme/tokens";
import type { Profile, ResumeRequest } from "@/lib/api/types";
import { enabledInOrder, moveAmongEnabled, moveItem, type ResumeSection } from "@/lib/resume/order";
import { RESUME_MAX_PROJECTS, RESUME_SECTIONS } from "@/lib/resume/request";
import { OrderOutline } from "./resume/OrderOutline";
import { ProjectsList } from "./resume/ProjectsList";
import { ReorderList, ReorderRow } from "./resume/ReorderRow";
import { SectionCard } from "./resume/SectionCard";

export function ResumeDownload({ profile }: { profile: Profile }) {
  const { t, language } = useLanguage();
  const copy = t.resume;
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  // Every block, in the order the user arranged them; `enabled` says which are printed.
  const [order, setOrder] = useState<ResumeSection[]>([...RESUME_SECTIONS]);
  const [enabled, setEnabled] = useState<Set<ResumeSection>>(
    new Set(RESUME_SECTIONS.filter((s) => s !== "contact")),
  );
  const candidates = profile.projects.filter(
    (p) => p.role === "owner" || (p.isPublic && !p.isDraft),
  );
  // The projects that will be printed, in the order the user arranged them.
  const [projectIds, setProjectIds] = useState<string[]>(
    candidates
      .filter((p) => p.isPublic && !p.isDraft)
      .slice(0, RESUME_MAX_PROJECTS)
      .map((p) => p.id),
  );
  const [includePrivate, setIncludePrivate] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(!phone);
  const hasPrivate = candidates.some((p) => !p.isPublic || p.isDraft);

  const latest = useRef({ order, enabled, projectIds });
  useEffect(() => {
    latest.current = { order, enabled, projectIds };
  });

  const active = enabledInOrder(order, enabled);
  const names = copy.sections;
  const title = (id: string) => candidates.find((p) => p.id === id)?.title ?? "";
  const announce = (name: string, index: number, total: number) =>
    setStatus(
      copy.moved
        .replace("{name}", name)
        .replace("{n}", String(index + 1))
        .replace("{m}", String(total)),
    );

  function setSection(section: ResumeSection, on: boolean) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (on) next.add(section);
      else next.delete(section);
      return next;
    });
  }
  function moveSection(section: ResumeSection, by: -1 | 1) {
    const next = moveAmongEnabled(order, enabled, section, by);
    setOrder([...next]);
    announce(names[section], enabledInOrder(next, enabled).indexOf(section), active.length);
  }
  function sectionDropped(section: ResumeSection) {
    const { order: o, enabled: e } = latest.current;
    const list = enabledInOrder(o, e);
    announce(names[section], list.indexOf(section), list.length);
  }
  function moveProject(index: number, by: -1 | 1) {
    const next = moveItem(projectIds, index, by);
    if (next === projectIds) return;
    setProjectIds([...next]);
    announce(title(projectIds[index] ?? ""), index + by, projectIds.length);
  }
  function projectDropped(id: string) {
    const ids = latest.current.projectIds;
    announce(title(id), ids.indexOf(id), ids.length);
  }

  async function download() {
    setBusy(true);
    setError("");
    try {
      const body: ResumeRequest = {
        sections: active,
        language,
        projectIds,
        includePrivateProjects: includePrivate,
      };
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(
          response.status === 429
            ? copy.rateLimited
            : response.status === 422
              ? copy.tooLarge
              : response.status === 404
                ? copy.projectUnavailable
                : copy.failed,
        );
        return;
      }
      if (!response.headers.get("content-type")?.startsWith("application/pdf")) {
        setError(copy.failed);
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "gradfolio-resume.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setOpen(false);
    } catch {
      setError(copy.failed);
    } finally {
      setBusy(false);
    }
  }

  const close = () => {
    if (!busy) setOpen(false);
  };

  return (
    <>
      <Button
        size="small"
        variant="contained"
        startIcon={<DownloadOutlinedIcon fontSize="small" />}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        {copy.download}
      </Button>
      <Dialog
        open={open}
        onClose={close}
        fullScreen={phone}
        fullWidth
        maxWidth="md"
        aria-labelledby="resume-title"
      >
        <MotionConfig reducedMotion="user">
          <DialogTitle
            id="resume-title"
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}
          >
            {copy.title}
            {phone && (
              <IconButton aria-label={t.common.close} onClick={close} disabled={busy}>
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Typography color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                {copy.intro}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "inline-block",
                  mt: 1,
                  px: 1.5,
                  py: 0.25,
                  borderRadius: `${RADIUS.pill}px`,
                  fontWeight: 700,
                  color: "primary.main",
                  bgcolor: "action.hover",
                }}
              >
                {copy.summary
                  .replace("{s}", String(active.length))
                  .replace("{p}", String(enabled.has("projects") ? projectIds.length : 0))}
              </Typography>
            </Box>
            <Box aria-live="polite" role="status" sx={{ position: "absolute", left: -9999 }}>
              {status}
            </Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 232px" },
                gap: 3,
                alignItems: "start",
                pt: 1,
              }}
            >
              <ReorderList
                values={order}
                onReorder={(ids) => setOrder(ids as ResumeSection[])}
                label={copy.title}
              >
                {order.map((section) => {
                  const on = enabled.has(section);
                  const index = active.indexOf(section);
                  return (
                    <ReorderRow
                      key={section}
                      value={section}
                      draggable={on && !busy}
                      onDragEnd={() => sectionDropped(section)}
                    >
                      {(handle) => (
                        <SectionCard
                          handle={handle}
                          name={names[section]}
                          position={index + 1}
                          enabled={on}
                          canUp={index > 0}
                          canDown={index < active.length - 1}
                          busy={busy}
                          onToggle={(value) => setSection(section, value)}
                          onMove={(by) => moveSection(section, by)}
                          detail={
                            section === "projects" ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  columnGap: 1,
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  {copy.projectsSelected
                                    .replace("{n}", String(projectIds.length))
                                    .replace("{max}", String(RESUME_MAX_PROJECTS))}
                                </Typography>
                                <Button
                                  size="small"
                                  aria-expanded={projectsOpen}
                                  onClick={() => setProjectsOpen((v) => !v)}
                                >
                                  {projectsOpen ? copy.hideProjects : copy.showProjects}
                                </Button>
                              </Box>
                            ) : undefined
                          }
                        >
                          {section === "projects" && projectsOpen && (
                            <ProjectsList
                              candidates={candidates}
                              picked={projectIds}
                              includePrivate={includePrivate}
                              hasPrivate={hasPrivate}
                              busy={busy}
                              onIncludePrivate={(checked) => {
                                setIncludePrivate(checked);
                                if (!checked)
                                  setProjectIds((ids) =>
                                    ids.filter((id) =>
                                      candidates.some(
                                        (p) => p.id === id && p.isPublic && !p.isDraft,
                                      ),
                                    ),
                                  );
                              }}
                              onToggle={(id, checked) =>
                                setProjectIds((ids) =>
                                  checked
                                    ? [...ids, id].slice(0, RESUME_MAX_PROJECTS)
                                    : ids.filter((x) => x !== id),
                                )
                              }
                              onReorder={setProjectIds}
                              onMove={moveProject}
                              onDragEnd={projectDropped}
                            />
                          )}
                        </SectionCard>
                      )}
                    </ReorderRow>
                  );
                })}
              </ReorderList>
              <Box sx={{ display: { xs: "none", md: "block" }, position: "sticky", top: 0 }}>
                <OrderOutline
                  items={active.map((section) => ({ section, label: names[section] }))}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={busy}>
              {copy.cancel}
            </Button>
            <Button
              variant="contained"
              onClick={() => void download()}
              disabled={
                busy ||
                active.length === 0 ||
                (active.length === 1 && active[0] === "projects" && projectIds.length === 0)
              }
            >
              {busy ? copy.generating : copy.download}
            </Button>
          </DialogActions>
        </MotionConfig>
      </Dialog>
    </>
  );
}
