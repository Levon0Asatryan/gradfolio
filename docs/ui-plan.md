# UI plan: design system and migration

Palette C (blue + magenta + amber), chosen by Levon from three options. Type: Nunito
(Latin, Cyrillic) with Noto Sans Armenian. Rounded, friendly, colour carried by a
primary-to-secondary gradient. The prototype this follows was approved before PR1.

## Audit findings the plan answers

- Monochrome theme: `primary` was `#000` / grey-300; nothing carried meaning.
- No shared page header, section card or chip pattern; flat lists without surfaces.
- Roboto has no Armenian glyphs, so am text fell back to a system font.
- `<html lang>` was always `en`; several pages had no `<main>`.
- Sidebar labels truncate in ru/am; the phone sidebar is an unlabelled icon rail.
- Two edit models on the profile (a mode switch and a header button).
- MUI's warning orange is 3.1:1 on white.

## Tokens (`src/components/theme/tokens.ts`)

Every number below is asserted by `tokens.test.ts` (WCAG 2.x, 4.5:1 for text, 3:1 for
control borders). `on` is the label colour on a filled colour: `#FFFFFF` (light),
`#0B0B14` (dark).

|                  | light                 | dark                  |
| ---------------- | --------------------- | --------------------- |
| page / card      | `#F6F8FC` / `#FFFFFF` | `#0B1220` / `#131C2E` |
| text / secondary | `#0F172A` / `#475569` | `#E6EDF8` / `#9FB0C9` |

Contrast, light (text-colour on card, then label on the filled colour; the two are the
same ratio because `on` is white): text/page 16.79, text/card 17.85, secondary/page
7.13, secondary/card 7.58.

| colour    | light     | on card, light | dark      | on card, dark | label on fill, dark |
| --------- | --------- | -------------- | --------- | ------------- | ------------------- |
| primary   | `#1D4ED8` | 6.70           | `#93C5FD` | 9.44          | 10.86               |
| secondary | `#BE185D` | 6.04           | `#F9A8D4` | 9.39          | 10.80               |
| accent    | `#B45309` | 5.02           | `#FCD34D` | 11.81         | 13.58               |
| success   | `#15803D` | 5.02           | `#86EFAC` | 12.13         | 13.95               |
| warning   | `#92400E` | 7.09           | `#FCD34D` | 11.81         | 13.58               |
| error     | `#B91C1C` | 6.47           | `#FCA5A5` | 8.97          | 10.32               |
| info      | `#0369A1` | 5.93           | `#7DD3FC` | 10.21         | 11.75               |

Dark text on page / card: 15.90 / 14.46; secondary 8.49 / 7.73. Primary text on the
selected-row tint: 5.67 light, 7.48 dark.

Category chips (text on its tint), never colour alone: the label stays.

| category  | light fg / bg         | ratio | dark fg / bg          | ratio |
| --------- | --------------------- | ----- | --------------------- | ----- |
| course    | `#1D4ED8` / `#DBEAFE` | 5.49  | `#BFDBFE` / `#1E3A8A` | 7.29  |
| personal  | `#BE185D` / `#FCE7F3` | 5.14  | `#FBCFE8` / `#831843` | 6.98  |
| research  | `#0F766E` / `#CCFBF1` | 4.86  | `#99F6E4` / `#134E4A` | 7.52  |
| hackathon | `#C2410C` / `#FFEDD5` | 4.52  | `#FED7AA` / `#7C2D12` | 6.92  |
| academic  | `#6D28D9` / `#EDE9FE` | 5.98  | `#DDD6FE` / `#4C1D95` | 7.89  |
| other     | `#475569` / `#E2E8F0` | 6.15  | `#CBD5E1` / `#334155` | 6.97  |

Derived surfaces: hairline = text 14% into card; input border = text 50% into card
(3.41 light, 4.58 dark; the prototype's 42% was 2.69 in light and failed 3:1);
selected tint = primary 11% into card; brand gradient = `135deg` primary to
secondary (the label `on` passes 4.5:1 on both ends).

- Type (Nunito 800 headings): h1 40, h2 36, h3 32, h4 30 (page title), h5 24, h6 19
  (card title), body 16, body2 15, caption 13; buttons 800, no uppercase.
- Radius: control 12, button 14, card 20, dialog 24, pill 999. Spacing unit 8.
- Elevation: cards are outlined (1px hairline), shadow only for menus, dialogs, toasts.
- Focus: 3px primary outline, 2px offset, on every `:focus-visible`.
- Touch: 44px buttons; small buttons and icon buttons grow to 44px on coarse pointers.
- Motion: transitions off under `prefers-reduced-motion`.

## Friendly-UX principles

1. One clear primary action per page.
2. Say it in the user's words (no ids, no API talk); every status is text plus colour.
3. Help is inline and always visible, never in a tooltip only.
4. Forgiving forms: keep input on error, explain the fix, warn before losing edits,
   confirm risky actions and name what is affected.
5. Feedback within 100 ms (busy state), a toast on success, an honest failure.
6. Mobile first: 390px is the base layout; wider screens add columns, not content.
7. Same pattern everywhere, so a page can be learned once.

String-length rule for every PR: screenshot en, ru and am at 390 and 1440; no clipped
text, no horizontal scroll.

## Migration (each PR small, shippable, from a fresh branch off `main`)

1. **Theme** (this PR): tokens, `getTheme`, component overrides, fonts, `<html lang>`,
   `<main>` landmark, skip link. No layout change.
2. **Navigation and layout**: labelled nav at every width (sidebar, icon+label rail,
   phone bottom bar with a More sheet), Profile separate from Account, active highlight,
   resize handle name, 44px targets.
3. **Profile edit model**: no global mode; per-section pencil and Add, dialogs with
   Save/Cancel, toast feedback, empty-state prompts, delete confirm naming the entry,
   completeness hint, up/down reorder, guard on in-app navigation.
4. **Account and Settings.**
5. **Dashboard, projects, search**: category chips in category colours, welcome,
   next-step meter.
