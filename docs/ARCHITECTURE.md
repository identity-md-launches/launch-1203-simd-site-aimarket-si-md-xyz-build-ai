# Frontend and external backend contract

## Boundary

```text
Local IPFS/static export                 External HTTPS service
React / TypeScript                      feed adapters + secrets
        ── GET /v1/snapshot ──────────>  licensed quotes / chain indexing
        <── validated public JSON ────  closed-candle calculations
charts / research / local drafts         storage / scheduler / alert delivery
```

The export is a complete frontend and an explicit setup-required experience when demo mode is disabled without a connected backend. It is not a provider gateway, execution bot, AI service or hosted backend. There are no signing or order endpoints. The backend URL is an owner-configurable public HTTPS base, not a requester-owned value guessed by the implementation.

The user initiates connection and refresh. No background network polling, websocket, wallet upload or remote notification registration is implemented. The app enforces a ten-second connection timeout, checks HTTP status and JSON shape, bounds payload text at two million characters, and strips fields outside the contract before retaining data. Requests use `credentials: omit` and `cache: no-store`. No authenticated endpoint is assumed; use a public read-only snapshot interface with server-side protection/rate limiting. A browser-held secret would not make a public IPFS frontend private.

## Snapshot v1

The canonical types are `Asset`, `Setup`, `Bi`, `Status`, and `Snapshot` in `web/src/data.ts`. A complete example is the clearly labeled `demoSnapshot` fixture. `validateSnapshot()` in `web/src/engine.ts` validates the required fields at runtime. Backend implementations can use that fixture to understand the shape, but must supply their own verified values and honest statuses; they must not relabel those demo prices as live.

| Envelope field | Required value |
| --- | --- |
| `version` | Integer `1` |
| `status` | `Live`, `Delayed`, `Cached`, `Stale`, `Unavailable`, or `Demo` |
| `generatedAt`, `expiresAt` | ISO datetime strings with explicit timezone; expiry strictly after generation |
| `assets` | Up to 200 complete asset objects, each with a unique ID |
| `setups` | Up to 500 complete setup objects, each with a unique ID and an existing asset reference |

Every localized field uses `{ "zh": "Traditional Chinese copy", "en": "English copy" }`. Text is rendered through React, never as trusted HTML. Required source links must be public HTTPS URLs without embedded username/password. Do not return credentials, private information or keyed provider URLs anywhere in the response.

An asset has `id`, `symbol`, `name`, `category`, positive finite USD `price`, finite 24-hour percent `change`, hex `color`, `glyph`, formatted `volume`, `status`, `asOf`, nonnegative `delayMinutes`, and localized `instrument`. Categories are `spot`, `memes`, `futures`, `stocks`, `gold`. Unknown quote delay must not be represented as an asserted zero-delay live quote: use `Unavailable` until a meaningful record is available, or omit that asset entirely. The `volume` string can be `—` where unknown.

A setup has:

- `id`, `asset`, `category`, `direction` (`long`, `short`, `neutral`), `timeframe` (`1H`, `4H`, `1D`, `1W`).
- Localized `strategy`, `trigger`, `thesis`, and `risk`. `thesis` is a sourced explanation, never an invented probability. The frontend does not call an LLM.
- Ordered positive `entry: [low, high]`, positive `stop`, and `targets: [first, second]`. Long targets must be above the entry zone and stop below it; short targets must be below and stop above. Neutral records retain a schema-compatible research hypothesis but the UI suppresses numeric trade levels until directional eligibility is established.
- `costBps` for the assumed total round-trip commission and slippage. Funding, borrow and gap risks need explicit additional backend accounting. A UI risk calculator cannot guarantee a maximum realized loss.
- Exactly five `factors`, each with a localized `label` and boolean `passed`. Unknowns are `false`, not assumed passes.
- One to fifteen `sources`, each containing `name`, public HTTPS `url`, and localized `note` explaining the evidence and its limits. Actual research should link to the exact filing, exchange instrument/announcement, contract and block/transaction, release or dated report, not just a generic homepage.
- `asOf`, `expiresAt`, `ruleVersion: "closed-candle/1.0.0"`, and `status`.

Demo and non-demo records may not mix in one envelope. Unknown schema versions, unsafe links, nonfinite numbers, duplicate IDs, missing evidence, invalid directional levels and inconsistent demo provenance reject the entire response. Source evidence is still a server responsibility: structural validation cannot verify the truth of a provider's statements or commercially license the data.

## States and freshness

| State | Presentation and eligibility |
| --- | --- |
| Live | Current provider snapshot, explicitly timestamped. Directional setups may be prospectively logged. |
| Delayed | Delayed source, with declared quote delay. Still subject to expiry. Not silently labeled live. |
| Cached | Informational snapshot. Trigger, entry, stop, targets and sizing are suppressed. |
| Stale | Expired, future-dated beyond clock tolerance, or invalidated by a failed refresh. Trade levels are suppressed. |
| Unavailable | No valid data. Show setup-required/empty state or an unavailable badge; no active setup. |
| Demo | Entirely synthetic, fixed source timestamps and explicit provenance. The example remains browsable after its fictional expiry, but is never eligible as a real signal. |

`presentSnapshot()` propagates restrictive envelope and quote states to their setups. `effectiveStatus()` checks expiry and rejects timestamps more than one minute in the future. The client reevaluates at the next known expiry, capped by a 30-second clock refresh while open. Backend adapters must also apply provider-specific freshness windows; an arbitrarily long expiry must not be used to launder old data. The browser's clock is not a trusted oracle.

No connected candles are invented: the v1 snapshot API does not include OHLC history. A connected quote therefore shows an explicit “Candle history is not connected” chart state. Demo charts show 48 deterministic synthetic candles and volume. To add live charts, version the API to include provider-attributed, timestamped OHLC arrays and validate their bounds before rendering.

## Rule semantics and research policy

Version `closed-candle/1.0.0` is the currently accepted protocol label. It describes the following research templates; the server owns actual rolling indicators, scan universes and primary evidence ingestion.

| Template | Closed-candle condition |
| --- | --- |
| Trend pullback | Hold EMA20 on the completed candle; next completed candle exceeds the prior high with at least 1.2× the trailing 20 completed bars' average volume. |
| Breakout retest | Completed close exceeds the prior range boundary; a subsequent completed retest holds it, with volume confirmation. Range lookback and the exact boundary must be recorded in the backend evidence. |
| Range reversion | Completed close reclaims the range low and RSI(14) crosses upward through 30; disable when the assumed range breaks. |
| Conditional futures | Price and volume confirmation plus explicitly bounded funding and open interest conditions. No confirmed conditions means neutral. |
| Equity research | Primary filings, earnings date, cash flow and valuation sensitivity alongside daily structure; label session and quote delay. |
| Gold research | XAU/USD structure conditioned on the dollar, real yields, Fed decisions and macro event risk; futures and ETF proxies retain distinct instrument identities. |

Rules are examples of the implemented versioned presentation. A production backend must define every lookback, universe/liquidity threshold, indicator seed, candle closing timezone, funding interval and numerical cutoff deterministically before a scan. Changing those definitions requires a rule-version change and matching client release. Do not infer a full trading algorithm from prose alone.

Ranking gives one point for each passed trend, volume, liquidity, risk/reward and fundamental check, then sorts ties by asset symbol. No weighting or calibrated win probability is implied. CEX spot universes must exclude illiquid instruments based on a documented window, spread, depth and notional threshold. Long-term accumulation needs adoption, revenue, supply, tokenomics, unlocks, governance and news evidence; the frontend explicitly withholds that recommendation without fundamentals.

For DEX discovery, identify instruments by chain + contract. A familiar ticker or co-buy count is not identity or listing verification. Match CEX listing announcements and exchange instrument metadata independently. Establish liquidity depth, holder concentration, deployer transactions, mint/freeze/admin controls, sell restrictions and estimated taxes. Unknown critical checks remain unknown and must block actionable research. The demo PEPE radar remains neutral and hides trade levels.

## Wallet and cost calculations

The local co-buy function groups by chain and contract, treats EVM identities case-insensitively and preserves Solana case. It filters buys within `[now − window, now]`, counts distinct wallets, then unions known relationship clusters transitively. A wallet observed once with no cluster and later with a cluster is still one source. Thresholds apply to the adjusted count. The UI labels the sum as gross buying; a real backend must deduplicate transaction IDs and subtract realized sells to calculate net buying. No cluster discovery is performed locally.

Wallet returns require a complete inventory/cost-basis policy, realized sale accounting, transaction costs, slippage, sample count and equity curve. The wallet education panel is explicitly fictional. Its expectancy is `$1,240 / 24 = $51.67`; the rest of its statistics are synthetic examples, not computed from imported wallets. Imported addresses have unknown performance until a backend implements and discloses that accounting.

Net R/R uses the entry midpoint `E`, stop `S`, first target `T`, direction sign `D` (+1 long, −1 short), and round-trip costs `C = E × costBps / 10,000`:

```text
netReward = max(0, D × (T − E) − C)
netRisk = abs(E − S) + C
R/R = netReward / netRisk
riskBudget = capital × riskPercent / 100
units = riskBudget / netRisk
notional = units × E
```

The calculator accepts positive capital and risk greater than 0%, up to 5%. It reports notional and units, not margin, a liquidation price or recommended leverage. Costs are assumptions; gaps, funding, borrow, partial fills and execution failures can increase realized loss.

## Backend deployment responsibilities

Deploy separately to an HTTPS host. Establish provider licenses and authorized access first, then add server-only secrets, bounded retries and caches. Keep quotes and collection timestamps separate; never advance `asOf` when a cached request fails. Configure a scheduler, durable storage, monitoring and data-age alerts. Verify CORS for each actual static/gateway origin.

Signals must be appended prospectively to a durable log before publishing them. Use a key containing rule version, asset identity, timeframe, closed candle timestamp and direction; preserve exact evidence, costs and expiry. Subsequent outcomes are append-only evaluations, not edits to initial signals. Define paper fill rules before evaluating expectancy and drawdown. Backtest performance and prospective paper performance are different datasets.

The current frontend saves local alert drafts and can export them. No upload or delivery API is implemented or assumed. A future alert service needs explicit subscription consent, server-side validation, idempotent delivery, retry and rate limits, delivery receipts and an unsubscribe path. Browser notification permission alone is not a scheduler. Local browser logs are neither immutable nor comprehensive while the tab is closed.
