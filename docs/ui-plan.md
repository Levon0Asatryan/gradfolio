# UI plan: design system and migration

Palette C (blue + magenta + amber), chosen by Levon from three options, then calmed (muted, low saturation). Type: Nunito
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

Palette C, calm: a muted blue carries the interface; magenta and amber are small
accents (chips, icons, highlights), never large fills or button backgrounds. Buttons
are solid (no gradient); the brand gradient is kept for tiny brand moments (active
navigation pill, avatar, progress meter). Surfaces are low-chroma blue-grey.

Every number below is asserted by `tokens.test.ts` (WCAG 2.x, 4.5:1 for text, 3:1 for
control borders). `on` is the label colour on a filled colour: `#FFFFFF` (light),
`#0B0F18` (dark).

|                  | light                 | dark                  |
| ---------------- | --------------------- | --------------------- |
| page / card      | `#F4F6F9` / `#FFFFFF` | `#0F151F` / `#171F2C` |
| text / secondary | `#1E293B` / `#516072` | `#E4EAF3` / `#9BA8BB` |

Contrast, light: text/page 13.51, text/card 14.63,
secondary/page 5.94, secondary/card 6.43; the label
`on` white sits on each filled colour at the same ratio as the colour on a card.
Dark: text/page 15.13, text/card 13.68, secondary/page
7.59, secondary/card 6.87.

| colour    | light     | on card, light | dark      | on card, dark | label on fill, dark |
| --------- | --------- | -------------- | --------- | ------------- | ------------------- |
| primary   | `#2D4E8A` | 8.18           | `#8FB0E8` | 7.52          | 8.71                |
| secondary | `#8E3B65` | 7.09           | `#D79CBA` | 7.37          | 8.54                |
| accent    | `#8F5A14` | 5.77           | `#DDB36A` | 8.46          | 9.79                |
| success   | `#2E7650` | 5.49           | `#82C99C` | 8.5           | 9.84                |
| warning   | `#855410` | 6.42           | `#DDB36A` | 8.46          | 9.79                |
| error     | `#A33440` | 6.73           | `#EA9CA2` | 7.7           | 8.92                |
| info      | `#2B6A91` | 5.88           | `#8DBAD8` | 8.0           | 9.26                |

Primary text on the selected-row tint: 6.9 light, 6.13 dark. Input border
(text 50% into card): 3.06 light, 4.41 dark (3:1 needed).

Category chips (desaturated tints, dark text), never colour alone: the label stays.

| category  | light fg / bg         | ratio | dark fg / bg          | ratio |
| --------- | --------------------- | ----- | --------------------- | ----- |
| course    | `#2D4E8A` / `#E4EAF4` | 6.76  | `#C5D6F1` / `#26385A` | 7.94  |
| personal  | `#85365D` / `#F4E7EE` | 6.53  | `#EBC4D6` / `#4D2A3F` | 7.8   |
| research  | `#1F6159` / `#E1F0EC` | 6.14  | `#B5E0D8` / `#1F4540` | 7.37  |
| hackathon | `#8A4A1C` / `#F7EADD` | 5.77  | `#F0CDB0` / `#51341C` | 7.57  |
| academic  | `#58429A` / `#EBE7F5` | 6.49  | `#D3C9F0` / `#3B3060` | 7.53  |
| other     | `#4A5565` / `#E9ECF0` | 6.38  | `#CBD3DE` / `#313B4A` | 7.5   |

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
