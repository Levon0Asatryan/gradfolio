"use client";

import { FC, memo, useMemo } from "react";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArticleIcon from "@mui/icons-material/Article";
import { formatDate } from "@/utils/helpers/formatDate";
import type { Publication } from "@/utils/types/dashboard.types";

export interface RecentPublicationsProps {
  items?: Publication[];
  onViewAll?: () => void;
  loading?: boolean;
  onItemClick?: (pub: Publication) => void;
}

const statusToColor = (
  status: Publication["status"],
): "default" | "success" | "warning" | "info" => {
  switch (status) {
    case "published":
      return "success";
    case "inReview":
      return "warning";
    case "draft":
      return "info";
    default:
      return "default";
  }
};

const RecentPublications: FC<RecentPublicationsProps> = ({
  items = [],
  onViewAll,
  loading,
  onItemClick,
}) => {
  const top = useMemo<Publication[]>(() => {
    if (items.length === 0) return [];
    return [...items]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, Math.max(3, Math.min(5, items.length)));
  }, [items]);

  if (loading) {
    return (
      <Card
        component="section"
        aria-label="Recent Publications"
        variant="outlined"
        sx={{ transition: (t) => t.transitions.create("box-shadow"), "&:hover": { boxShadow: 6 } }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">Recent Publications</Typography>
            <Skeleton variant="text" width={60} height={20} />
          </Stack>
          <Stack spacing={1.5}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Stack key={i} direction="row" alignItems="center" spacing={2} sx={{ p: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" height={22} />
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Skeleton variant="rounded" width={80} height={20} />
                    <Skeleton variant="rounded" width={70} height={20} />
                    <Skeleton variant="text" width={90} height={18} />
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Skeleton variant="circular" width={28} height={28} />
                  <Skeleton variant="circular" width={28} height={28} />
                  <Skeleton variant="circular" width={28} height={28} />
                </Stack>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card
        component="section"
        aria-label="Recent Publications"
        variant="outlined"
        sx={{ transition: (t) => t.transitions.create("box-shadow"), "&:hover": { boxShadow: 6 } }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">Recent Publications</Typography>
            <Link
              component="button"
              variant="body2"
              onClick={onViewAll}
              sx={{ textDecoration: "none" }}
            >
              View All
            </Link>
          </Stack>
          <Box sx={{ textAlign: "center", py: 5 }}>
            <ArticleIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No publications yet
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      component="section"
      aria-label="Recent Publications"
      variant="outlined"
      sx={{ transition: (t) => t.transitions.create("box-shadow"), "&:hover": { boxShadow: 6 } }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">Recent Publications</Typography>
          <Link
            component="button"
            variant="body2"
            onClick={onViewAll}
            sx={{ textDecoration: "none" }}
          >
            View All
          </Link>
        </Stack>

        <Grid container spacing={1.5} columns={{ xs: 12 }}>
          {top.map((pub) => (
            <Grid key={pub.id} size={{ xs: 12 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  transition: (t) =>
                    t.transitions.create(["background-color", "box-shadow", "transform"], {
                      duration: 120,
                    }),
                  cursor: onItemClick ? "pointer" : "default",
                  "&:hover": onItemClick ? { bgcolor: "action.hover" } : undefined,
                }}
                role={onItemClick ? "button" : undefined}
                tabIndex={onItemClick ? 0 : undefined}
                onClick={onItemClick ? () => onItemClick(pub) : undefined}
                onKeyDown={
                  onItemClick
                    ? (e) => {
                        if (e.key === "Enter") onItemClick(pub);
                      }
                    : undefined
                }
                aria-label={onItemClick ? `Open ${pub.title}` : undefined}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" noWrap title={pub.title} sx={{ fontWeight: 500 }}>
                    {pub.title}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {pub.journal}
                    </Typography>
                    <Chip
                      size="small"
                      label={pub.status}
                      color={statusToColor(pub.status)}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(pub.date)}
                    </Typography>
                  </Stack>
                </Box>
                <CardActions sx={{ p: 0 }}>
                  <IconButton
                    size="small"
                    aria-label={`View ${pub.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Edit ${pub.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Delete ${pub.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default memo(RecentPublications);
