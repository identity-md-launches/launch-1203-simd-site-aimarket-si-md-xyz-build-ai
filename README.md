# AI Market — Pepe Intelligence Terminal

A responsive, Traditional Chinese / English research terminal for **aimarket.si-md.xyz**. The static site combines a custom vector Pepe command center, market charts, conditional research, wallet research tools, watchlists and local alert drafts.

**Default mode is explicitly labeled Demo. No market provider, AI service or alert delivery service is connected.** All displayed prices, charts, wallet statistics and setups in that mode are synthetic examples. Research and alerts only; no wallet connection, signing, orders, brokerage or automatic trading.

## Run and rebuild

Requires Node 22.12+ and npm. Source is in `web/`; the complete production export is in `dist/`. Every runtime asset is bundled locally, and Vite's base is `./`.

```sh
cd web
npm ci
npm run typecheck
npm test
npm run build
npm run preview
```

Open the local URL printed by Vite. `npm run build` replaces repository-root `dist/`. For development, run `npm run dev`. Network access is needed for a first dependency installation; a subsequent `npm ci --offline` works only if your npm cache already contains the lockfile's packages. No dependency registry or `node_modules` directory is included in this deliverable.

Optional browser validation:

```sh
cd web
npx playwright install chromium
npm run test:browser
```

The foreground browser script serves the actual `dist/` under `/preview/`, opens an isolated Chromium context, checks interactions and accessibility, writes results to `artifacts/`, and closes both browser and server. `CHROMIUM_PATH` may select an existing Chromium binary. `SITE_DIST` and `VALIDATION_DIR` optionally override the site and report directories. All test backend responses are intercepted fixtures; they do not contact a market provider.

## What works

- Nine hash-routed sections: Overview, Crypto Spot, Meme Radar, Futures, US Stocks, Gold, Wallets, Watchlists/Alerts and Settings. Direct hash links and back/forward navigation work at a gateway subpath.
- Traditional Chinese initially; English toggle persists locally. All displayed data timestamps use **Asia/Taipei, UTC+8**, formatted `YYYY-MM-DD HH:mm`. The footer clock is the device clock, separate from data timestamps.
- Demo candles and line charts with asset selection, four candle intervals, volume and keyboard-accessible candle inspection. All chart series are generated deterministically from explicit demo fixtures.
- Strategy search, direction/timeframe filters, accumulation research, complete setup dialogs, dated source links, rule versions, invalidation, targets and net reward/risk calculations.
- Configurable wallet co-buy windows and thresholds using synthetic transactions. Grouping uses chain + contract, unique wallet addresses and transitive known-wallet clusters. The displayed amount is **gross buys**, explicitly distinguished from net buying.
- Public Ethereum, Base and Solana address imports, address validation and chain-specific deduplication. Addresses remain in this browser; they are not uploaded.
- Persistent watchlists; editable creation and removal of inactive local alert drafts; JSON exports of alert drafts and the paper journal.
- Cost-aware futures position sizing with a user-entered research capital and risk percentage.
- Optional, manually refreshed HTTPS snapshot connection. The client validates the versioned response, strips unknown fields, differentiates all six data states, and hides trade levels for stale, cached, unavailable or neutral research.
- Reduced-motion support, a visible animation pause control, native dialogs, keyboard navigation, visible focus indicators and mobile navigation.

## Data and backend setup

In **Settings → Data backend**, enter an HTTPS base URL for an independently deployed service. The frontend calls `GET <base>/v1/snapshot` only on **Connect & validate** or **Refresh snapshot**. The base must not contain credentials, query strings or fragments. Credentials are omitted from requests. Cross-origin requests require your backend to permit the site's origin through CORS. Never put API secrets in this frontend, a URL, build-time public environment variables, IPFS files or browser storage.

The full contract, freshness behavior, data rules and server responsibilities are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The TypeScript contract lives in `web/src/data.ts`; `validateSnapshot()` in `web/src/engine.ts` is the executable boundary. The app does not silently use demo prices if a real connection fails. On reload, a saved backend address is retained, but reconnecting is an explicit action.

**Not implemented externally:** live feed adapters, market-wide scheduled scanning, OHLC history for a connected backend, licensed stock/gold quotes, filings ingestion, token unlock/adoption/news feeds, GMGN/FOMO integration, actual wallet transaction indexing or relationship discovery, AI summaries, durable immutable logs, fill/outcome evaluation, background alerts and cross-device synchronization. These require a deployed backend and appropriate access rights. Their absence is visible in the UI. The site does not imply that local alert drafts are active.

See [docs/PROVIDERS.md](docs/PROVIDERS.md) for verified documentation, licensing constraints, unsupported integrations and recurring operating costs. Provider documentation links are research resources; they are not evidence for synthetic demo numbers.

## Paper evaluation and local storage

On first receipt, research is logged using mode + setup ID + source timestamp as an immutable-in-the-app key. Live/Delayed directional setups are eligible for connected-mode logging; Demo fixtures are separately labeled. No backfilled profit, calibrated win rate or fabricated evaluation is shown. Outcomes remain `pending`.

Storage uses `aimarket:v1:*` keys on this origin. Watchlists, public addresses, preferences, drafts and journal entries stay on this device. The journal stops accepting new entries at 2,000 and shows a visible capacity warning; export it before moving to durable backend logging. A storage failure is announced and leaves changes in memory only. Browser clearing, another gateway origin or another device will not share these records. Local records can be changed by the browser user and are not an audit-grade log.

## Publish

Publish **the contents of `dist/`** to static hosting or add that directory to IPFS with your normal deployer. The network publisher should use the delivered export rather than rebuilding it. There are no absolute runtime asset paths, external font requests, tracking pixels or analytics. Routing uses hashes, so no SPA server rewrite is required.

For an existing IPFS installation, an operator can add the directory and pin the returned CID:

```sh
ipfs add -r dist
```

Serve it through your gateway, or configure the requested `aimarket.si-md.xyz` domain using the gateway's documented DNSLink/custom-domain mechanism. No DNS or account configuration is included, and this assignment does not claim a deployed domain or pinned CID. Use an HTTPS gateway/custom domain for the optional external HTTPS API. Keep the backend separately hosted and its secrets out of the IPFS export.

## Verification and design record

[artifacts/validation.md](artifacts/validation.md) records the actual production build, typecheck, interaction checks, six-domain Better Interface review, fixes and limitations. [artifacts/browser-results.json](artifacts/browser-results.json) contains the browser assertions and measured results. [DESIGN.md](DESIGN.md) documents the implemented tokens, typography, layout and reusable components.

Actual results on 2026-10-09: production build and strict typecheck passed; **12 unit tests and 19 browser scenarios passed**; **13 axe accessibility scans reported zero violations**. The six-file production export is 380,806 bytes. A fresh offline install from the populated npm cache produced a byte-identical export. No native screen-reader session, physical-device test, native browser zoom or deployed-provider integration was performed; those limits are recorded with the review.

The worker used an isolated dependency/build directory under `/tmp` because repository dependency directories were protected. Source and lockfile are complete; the normal commands above are the supported rebuild workflow. The isolated build uses the same source, lockfile and scripts, with only `--outDir` overridden to this repository's `dist/`.

## Attribution

Research-desk inspiration: **https://aimarket.trade/**. The terminal visual design, vector Pepe console composition and implementation were created for this brief; no page assets or source were copied from the reference.

Design review uses the pinned Better Interface guide, adapted from Jakub Krehel (MIT). Design-documentation guidance is adapted from Paul Bakaus's Impeccable (Apache-2.0). Attribution and both licenses are retained in [docs/GUIDE-LICENSES.txt](docs/GUIDE-LICENSES.txt). IBM Plex Mono is bundled under the SIL Open Font License; see [docs/FONT-LICENSE.txt](docs/FONT-LICENSE.txt). Lucide icons use the ISC license; runtime notices are recorded in [docs/THIRD-PARTY.md](docs/THIRD-PARTY.md).
