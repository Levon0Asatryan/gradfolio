"use client";

import { type FC, useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import Badge from "@mui/material/Badge";
import ButtonBase from "@mui/material/ButtonBase";
import Drawer from "@mui/material/Drawer";
import Popover from "@mui/material/Popover";
import type { SxProps, Theme } from "@mui/material/styles";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { NotificationsPanel, PANEL_TITLE_ID } from "./NotificationsPanel";
import { useNotifications } from "./NotificationsProvider";

/** The badge counts up to this, then shows "99+". */
const BADGE_MAX = 99;

/** The bell with its unread badge. The badge is decoration; the button's name carries the count. */
export const BellIcon: FC = () => {
  const { count } = useNotifications();
  return (
    <Badge
      color="error"
      badgeContent={count ?? 0}
      max={BADGE_MAX}
      invisible={!count}
      overlap="circular"
      slotProps={{ badge: { "aria-hidden": true, "data-testid": "bell-badge" } as object }}
    >
      <NotificationsOutlined />
    </Badge>
  );
};

/** "Notifications" or "Notifications, unread: 3": never colour or position alone. */
export function useBellLabel(): string {
  const { t } = useLanguage();
  const { count } = useNotifications();
  return count
    ? t.notifications.bellLabelUnread.replace(
        "{n}",
        count > BADGE_MAX ? `${BADGE_MAX}+` : String(count),
      )
    : t.notifications.bellLabel;
}

/**
 * The sidebar and rail entry: a button styled like the other items that opens the panel in
 * a popover beside it. Escape closes it and focus returns to the button (MUI's focus trap).
 */
export const NotificationsPopoverButton: FC<{ sx: SxProps<Theme> }> = ({ sx }) => {
  const { t } = useLanguage();
  const label = useBellLabel();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = anchor !== null;
  const pathname = usePathname();
  // Navigating (a link, the back button) closes the panel.
  useEffect(() => setAnchor(null), [pathname]);
  // Safari does not focus a button on click, so MUI would have nowhere to return focus to.
  const close = () => {
    anchor?.focus();
    setAnchor(null);
  };
  const id = useId();

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        data-testid="bell-button"
        sx={sx}
      >
        <BellIcon />
        <span className="nav-label">{t.notifications.title}</span>
      </ButtonBase>
      <Popover
        id={id}
        open={open}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-labelledby": PANEL_TITLE_ID,
            sx: {
              width: 380,
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              borderRadius: "16px",
              ml: 1,
            },
          },
        }}
      >
        <NotificationsPanel onClose={close} />
      </Popover>
    </>
  );
};

/** The phone's panel: a bottom sheet, opened from the "More" sheet. */
export const NotificationsSheet: FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => (
  <Drawer
    anchor="bottom"
    open={open}
    onClose={onClose}
    slotProps={{
      paper: {
        role: "dialog",
        "aria-labelledby": PANEL_TITLE_ID,
        sx: {
          borderRadius: "24px 24px 0 0",
          maxWidth: 480,
          mx: "auto",
          width: "100%",
          maxHeight: "80vh",
          pb: "env(safe-area-inset-bottom, 0px)",
        },
      },
    }}
  >
    <NotificationsPanel onClose={onClose} />
  </Drawer>
);
