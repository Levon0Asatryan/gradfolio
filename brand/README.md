# Brand archive

Every logo asset, kept for later use. **Not served and not bundled**: this
directory is outside `public/` and `src/`. Do not import from here; copy a file
into `public/brand/` or `src/app/` when the app needs it.

## Chosen logo: option A, "Cap"

A mortarboard whose base reads as an open folder (education plus portfolio), with
an amber tassel. Palette C. Wordmark: "Grad" in text colour, "folio" in the
gradient, Nunito ExtraBold (800).

## Layout

| Path                    | What                                                                           |
| ----------------------- | ------------------------------------------------------------------------------ |
| `final-a-cap/`          | The chosen logo, every shipped file (below).                                   |
| `concepts/a-cap/`       | Concept A as first drawn (tassel slightly thinner than the final). |
| `concepts/b-g-spark/`   | Concept B: rounded G monogram with an amber spark.                             |
| `concepts/c-open-folio/`| Concept C: open book with a cap floating above.                                |
| `source/concepts.html`  | The comparison page the three concepts came from (live SVG, loads Nunito from Google Fonts). |
| `source/work_white_lockup.svg` | White lockup (mark and wordmark in white, amber tassel), for use on colour. |
| `tools/build.py`        | Generates the `final-a-cap` SVGs and the white lockup.                         |
| `tools/concepts.py`     | Generates `concepts/*` SVGs from the geometry in `concepts.html`.              |

Each concept folder holds: `mark.svg` (gradient, light), `mark-dark.svg`
(gradient, dark-theme colours), `mark-flat.svg` (one colour), `tile.svg` (white
mark on a gradient app tile), `horizontal.svg` and `horizontal-dark.svg`
(lockups). Concept wordmarks are **outlined paths**, not text: no font is needed
to view them.

### `final-a-cap/`

| File                                    | Use                                              |
| --------------------------------------- | ------------------------------------------------ |
| `logo-mark.svg` / `logo-mark-flat.svg`  | Mark, gradient / one colour (`#1D4ED8`).         |
| `logo-horizontal.svg` / `-dark.svg`     | Lockup for light / dark backgrounds.             |
| `favicon.svg`, `favicon.ico`, `favicon-16/32/48.png` | Browser tab icons (white cap on gradient tile). |
| `apple-touch-icon.png`                  | iOS home screen.                                 |
| `icon-192.png`, `icon-512.png`          | PWA manifest icons.                              |
| `icon-maskable-512.png`                 | PWA maskable icon (safe-zone padding).           |
| `og-image.png`                          | Open Graph / Twitter card, 1200x630.             |
| `auth0-logo-512.png`                    | Logo for the Auth0 login page / tenant branding. |

## Colour tokens (palette C, from `docs/ui-plan.md`)

| Token     | Light     | Dark      |
| --------- | --------- | --------- |
| primary   | `#1D4ED8` | `#93C5FD` |
| secondary | `#BE185D` | `#F9A8D4` |
| tassel    | `#D97706` | `#FCD34D` |
| wordmark text | `#0F172A` | `#E6EDF8` |
| page bg   | `#F6F8FC` | `#0B1220` |

Gradient: primary to secondary, diagonal. The tile and the white lockup use
`#FCD34D` for the tassel on the gradient.

## Font

Nunito (ExtraBold 800 for the wordmark), SIL Open Font License 1.1:
<https://fonts.google.com/specimen/Nunito>. The app loads it via `next/font`.
Fonts are not copied here; `tools/build.py` expects `Nunito-800.ttf` in its
working directory (download it from the link above). `source/concepts.html` uses
live Nunito text.

## Where the files are in the app

| App file                                       | Source in `final-a-cap/`   |
| ---------------------------------------------- | -------------------------- |
| `public/brand/logo-mark.svg`, `logo-mark-flat.svg`, `logo-horizontal.svg`, `logo-horizontal-dark.svg` | same names |
| `public/brand/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `auth0-logo-512.png` | same names |
| `src/app/icon.svg`                             | `favicon.svg`              |
| `src/app/favicon.ico`                          | `favicon.ico`              |
| `src/app/apple-icon.png`                       | `apple-touch-icon.png`     |
| `src/app/opengraph-image.png`, `twitter-image.png` | `og-image.png`         |

`favicon-16/32/48.png` are not used by the app (the `.ico` bundles them).

## Regenerating

SVGs: needs Python 3 and `fonttools` (`pip install fonttools`). Copy
`tools/build.py` next to `Nunito-800.ttf`, create a `final/` directory beside it,
and run `python3 build.py` (it writes the three lockup/mark SVGs it defines;
the favicon is in the same script). `python3 tools/concepts.py <out-dir>` writes
the concept SVGs (needs `Nunito-800.ttf` in the working directory and
`a-cap/`, `b-g-spark/`, `c-open-folio/` under `<out-dir>`).

PNGs and `.ico`: the build script does not produce them. Rasterise the SVGs:
`favicon.svg` to 16/32/48 px (pack into the `.ico`); the larger icons and
`og-image.png` were rendered from the same shapes and are kept as binaries (no
script was saved). Any rasteriser works (Chromium, `rsvg-convert`, ImageMagick).
