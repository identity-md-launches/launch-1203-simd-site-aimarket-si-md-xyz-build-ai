# AI Market design system

## Overview

AI Market is a compact research dashboard for readers moving between crypto, DEX tokens, futures, equities and gold. The implemented direction is a black and neon-green command center with a custom Pepe console illustration, subtle CRT texture, dashed data paths and digital rain. Dense financial data stays on opaque surfaces; decorative effects stay inside the hero.

The overview combines a fixed desktop sidebar, utility header, an explicit data-mode bar, a short illustrated hero, four quote cards, a price chart and watchlist, ranked research cards and source/status panels. Other routes reuse the shell and begin directly with their research tools. Traditional Chinese is the default. English and every market use the same visual system.

Source of truth: `web/src/styles.css`, with components in `web/src/components/` and the application shell in `web/src/App.tsx`. The source is formatted rather than generated from a design-system library.

## Colors

Canonical UI tokens are defined at `web/src/styles.css:13` using an sRGB hex neutral ramp, green accent ramp and explicit status colors.

| Semantic token | Value | Implemented role |
| --- | --- | --- |
| `--bg` | `#080b09` | Page canvas, inputs, segmented-control base |
| `--surface` | `#0e1310` | Main panels and cards |
| `--surface-raised` | `#121914` | Fields/groups, search overlay, secondary surfaces |
| `--hover` | `#18211b` | Hovered interactive surfaces and small counters |
| `--border` | `#2a382e` | Panel structure, separators and controls |
| `--text` | `#e4ebe6` | Primary copy and numbers |
| `--muted` | `#9aaa9e` | Secondary labels and body explanations |
| `--subtle` | `#7f9183` | Supporting metadata |
| `--accent`, `--positive`, `--focus` | `#b4f65b` | Primary action, active navigation, positive conditions and focus perimeter |
| `--negative` | `#f09485` | Negative changes, errors, unavailable/stale states |
| `--warning` | `#e7c681` | Unknown risk, delayed/cached states and setup-required context |

The sidebar is `#0b100d`. Primary action text is `#132007` on the lime fill. Status badges use opaque green, amber or red-brown backgrounds and explicit status text; color is never their sole meaning. Positive and negative numbers retain signs, and strategy directions retain arrows and names.

The chart SVG uses `#b4fb50` and `#eb8275` for rising/falling demo candles; volume repeats those hues at 23% opacity. Illustration-specific greens, shading and screen textures live inside `ConsoleArt.tsx`; they are decorative and not data states.

Measured solid pairs in the final browser run: muted text on panel **7.70:1**, subtle metadata on panel **5.61:1**, positive text on panel **14.54:1**, primary button text/fill **13.15:1**, and the focus ring against the sidebar **14.87:1**. These are specific opaque rendered pairs, not a claim about all illustration/gradient pixels. See `artifacts/browser-results.json` and `artifacts/validation.md` for exact measurements and coverage. No light theme is implemented.

## Typography

- Interface: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif`. These are system fallbacks, not externally fetched fonts. A particular installed Chinese face is not guaranteed.
- Numeric/terminal roles: **IBM Plex Mono**, then `ui-monospace, SFMono-Regular, Consolas, monospace`. Local Latin WOFF2 Regular 400 and Medium 500 live in `web/src/assets/`. Both faces were observed loaded in Chromium. CSS does not assert that the static Medium file supplies additional physical weights.
- Root UI size is 14px. General headings are 32px / 16px / 15px for h1/h2/h3; component headers use 14–16px. The overview hero uses 42px at the standard desktop width, 46px above 1550px, and 33–39px across smaller breakpoints.
- Core price figures use 17–24px monospace. Explanatory paragraphs use 13–14px, generally with 1.7–1.85 line height. General body line height is 1.7; headings use 1.2–1.4.
- Dense secondary metadata ranges from 9–12px; small decorative terminal labels can reach 7–10px at narrow widths. Those sizes are for secondary chrome/illustration, not form input or long-form reading. Main card values increase to 14px on narrow phones. Native input and select text becomes 16px at 760px and below.
- Numbers use `font-variant-numeric: tabular-nums`. Headings use `text-wrap: balance`; prose uses `pretty`. Research prose stays near 55–85ch depending on context. Full wallet addresses wrap with `overflow-wrap: anywhere`.
- `lang` changes between `zh-Hant` and `en`. No RTL locale is implemented. No text is globally unselectable.

## Layout

The spacing vocabulary declared in the stylesheet is 4, 8, 12, 16, 20, 24 and 32px. Components use that progression with smaller optical adjustments for dense chart and terminal chrome. Standard desktop page gutters are 30px, panel insets 18–24px and grid gaps 14–24px. Mobile page gutters are 16px, falling to 12px below 360px.

| Breakpoint | Actual behavior |
| --- | --- |
| Above 1550px | Larger hero, illustration, quote values and chart cap |
| 1250px and below | Sidebar narrows from 220px to 195px; gutters and condensed metadata tighten |
| 1030px and below | Sidebar narrows to 180px; chart and lower panels stack; the research grid moves to two columns |
| 760px and below | Sidebar is replaced by a native navigation dialog; quote cards use two columns; form inputs become 16px |
| 530px and below | Research cards and dashboard side panels stack; search expands from its icon; hero text and art layer vertically; forms and detailed level grids stack |
| 359px and below | Final gutter/type adjustments retain the 320px reflow layout |

Main content is capped at 1700px. The standard chart/sidebar split is approximately 1.9:1, with `min-width: 0` on major grid children. The illustration is intentionally clipped to the hero; text and primary controls are not clipped. Secondary source and journal rows wrap. Forms use native flow rather than fixed-height text containers.

Observed reflow: 320, 390, 760, 1024 and 1440 CSS pixels; document scroll width matched viewport width. A 720px zoom-equivalent viewport was also viewed. Native browser zoom and physical-device behavior were not tested. The mobile screenshot uses a fresh demo session, so it does not contain the backend mock tests' local data.

## Elevation & Depth

Panels use one-pixel structural borders and small tonal changes. Glow is limited to the brand/terminal illustration and active dot. Search results use `0 16px 45px #0009`; modal elevation is `0 30px 100px #000b`; toast elevation is `0 12px 45px #0008`.

The desktop sidebar is fixed at z-index 20, search results at 30, and toast at 60. Native `<dialog>` uses the browser top layer and a dark blurred backdrop. Modal headings stay visible during internal scrolling; background scrolling is locked while the dialog is open. There is no persistent overlay over chart data.

## Shapes

The main radius token is `--radius: 10px`. Hero and panels use 8–10px corners; dialogs use 12px; fields and buttons use 6px; smaller controls and tags use 3–5px. Token markers and status dots are circular. The terminal mark uses a lime 37px square with a 9px radius. Outline icons are from one Lucide family, usually 16–20px with `currentColor`; navigation/panel icons are optically softened to 1.6px strokes.

## Components

| Component / pattern | Source | Reuse and states |
| --- | --- | --- |
| Shell, navigation, mode bar | `web/src/App.tsx` | One hash route per research board; native links; active `aria-current`; persistent language toggle; explicit Demo / Research / Setup required states |
| `ConsoleArt` | `components/ConsoleArt.tsx` | Code-native decorative SVG; panoramic screens, Pepe, console, CRT texture, dashed paths and digital rain; excluded from accessibility tree |
| `Chart` / `Sparkline` | `components/Chart.tsx` | Asset select, 1H/4H/1D/1W controls, candle/line toggle, native range input; unavailable history state for external snapshots; synthetic series only when labeled Demo |
| `SetupCard` / `SetupDetail` | `components/Research.tsx` | Conditional direction, matched checks, watch toggle, source/expiry detail; suppresses trade levels for neutral, stale, cached and unavailable states |
| `ResearchGrid` | `components/Research.tsx` | Search, explicit direction/timeframe labels, result count, clear-filter recovery; filters reset on market-route changes |
| `RiskCalculator` | `components/Research.tsx` | Numeric capital/risk inputs and cost-aware result; invalid input explanation; no action that places a trade |
| `MemePanel`, `Wallets` | `components/Workspace.tsx` | Adjustable windows/thresholds; unknown-risk list; public-address import with inline validation; duplicate detection and native removal confirmation |
| `Watchlists` | `components/Workspace.tsx` | Local saved assets, inactive alert drafts, JSON export and pending journal outcomes; helpful empty states |
| `SettingsPanel` | `components/Workspace.tsx` | HTTPS form, visible connection/loading/error state, native checkbox switches, provider-readiness descriptions |
| `StatusBadge`, `TokenIcon` | `components/ui.tsx` | Shared state vocabulary and token identity; do not replace status text with color alone |
| `Modal` | `components/ui.tsx` | Native modal focus containment, Escape close, explicit close button, focus restoration, scroll lock; use `wide` for research detail |
| `External`, `Empty`, `ResearchNotice` | `components/ui.tsx` | Descriptive HTTPS source links; recovery-oriented empty states; repeated research-only scope |
| `.button`, `.text-button`, `.icon-button` | `styles.css` | One filled primary action per local task; neutral secondary actions; explicit icon labels; focus, hover, active and disabled states |

`:focus-visible` draws a 2px lime perimeter with 4px offset. Forced-color mode uses `Highlight`. Desktop navigation targets are at least 44px high; important mobile actions are 40–44px; small utility targets remain at least 24px without overlapping extensions. Native dialogs handle the top-layer focus boundary and the reusable component restores the trigger when closing.

Motion exists only inside `prefers-reduced-motion: no-preference`. Background data dashes run for 3 seconds per loop and rain for 14 seconds. The explicit pause control disables both. High-frequency hover/color transitions are 120ms; filled buttons compress to 0.96 on press. Reduced motion disables these decorative animations. Autoplay motion never communicates a data update.

## Do's and Don'ts

- Start a new board with the current page heading, `panel`, filter and research-card patterns; preserve the same main-content edge and local spacing.
- Keep every quote and setup's status and timestamp visible. Never relabel Demo or Cached data as Live to make a panel look complete.
- Use a single lime-filled primary action per task region; use neutral borders for peers. Retain text and signs on every status/direction.
- Put animated ornament inside the hero, not underneath candles or research copy. Respect both the system preference and explicit pause setting.
- Use the local numeric fonts and existing Lucide icons; do not add remote fonts, trackers or unrelated icon families.
- For a new page, add its localized label and copy in `data.ts`, route it through the existing hash shell, reuse the relevant components, then check both languages, an empty state, keyboard focus and 320px reflow. Extend the backend contract explicitly when adding real data, rather than manufacturing a chart or silently treating unknown fields as verified.
