export type Lang = "zh" | "en";
export type Bi = { zh: string; en: string };
export type Tab =
  | "overview"
  | "spot"
  | "memes"
  | "futures"
  | "stocks"
  | "gold"
  | "wallets"
  | "watchlists"
  | "settings";
export type Status =
  "Live" | "Delayed" | "Cached" | "Stale" | "Unavailable" | "Demo";
export type Category = "spot" | "memes" | "futures" | "stocks" | "gold";
export type Asset = {
  id: string;
  symbol: string;
  name: string;
  category: Category;
  price: number;
  change: number;
  color: string;
  glyph: string;
  volume: string;
  status: Status;
  asOf: string;
  delayMinutes: number;
  instrument: Bi;
};
export type Setup = {
  id: string;
  asset: string;
  category: Category;
  direction: "long" | "short" | "neutral";
  strategy: Bi;
  timeframe: "1H" | "4H" | "1D" | "1W";
  trigger: Bi;
  thesis: Bi;
  risk: Bi;
  entry: [number, number];
  stop: number;
  targets: [number, number];
  costBps: number;
  factors: { label: Bi; passed: boolean }[];
  sources: { name: string; url: string; note: Bi }[];
  asOf: string;
  expiresAt: string;
  ruleVersion: string;
  status: Status;
};
export type Snapshot = {
  version: 1;
  status: Status;
  generatedAt: string;
  expiresAt: string;
  assets: Asset[];
  setups: Setup[];
};
export const B = (zh: string, en: string): Bi => ({ zh, en });
export const DEMO_TIME = "2026-10-09T00:00:00.000Z";
export const DEMO_EXPIRY = "2026-10-09T04:00:00.000Z";
export const nav: { id: Tab; label: Bi; tag?: string }[] = [
  { id: "overview", label: B("市場總覽", "Overview") },
  { id: "spot", label: B("加密現貨", "Crypto spot") },
  { id: "memes", label: B("迷因雷達", "Meme radar"), tag: "DEX" },
  { id: "futures", label: B("合約策略", "Futures") },
  { id: "stocks", label: B("美股研究", "US stocks") },
  { id: "gold", label: B("黃金市場", "Gold") },
  { id: "wallets", label: B("聰明錢追蹤", "Wallets") },
  { id: "watchlists", label: B("觀察清單與提醒", "Watchlists & alerts") },
  { id: "settings", label: B("終端設定", "Settings") },
];
const asset = (
  id: string,
  symbol: string,
  name: string,
  category: Category,
  price: number,
  change: number,
  color: string,
  glyph: string,
  volume: string,
  instrument: Bi,
): Asset => ({
  id,
  symbol,
  name,
  category,
  price,
  change,
  color,
  glyph,
  volume,
  instrument,
  status: "Demo",
  asOf: DEMO_TIME,
  delayMinutes: 0,
});
export const demoAssets: Asset[] = [
  asset(
    "btc",
    "BTC",
    "Bitcoin",
    "spot",
    63482.6,
    2.34,
    "#f6a644",
    "₿",
    "$28.4B",
    B("CEX 現貨", "CEX spot"),
  ),
  asset(
    "eth",
    "ETH",
    "Ethereum",
    "spot",
    2486.92,
    1.68,
    "#a1b5ff",
    "Ξ",
    "$14.2B",
    B("CEX 現貨", "CEX spot"),
  ),
  asset(
    "sol",
    "SOL",
    "Solana",
    "spot",
    147.83,
    5.21,
    "#ba9cff",
    "≋",
    "$3.8B",
    B("CEX 現貨", "CEX spot"),
  ),
  asset(
    "pepe",
    "PEPE",
    "Pepe",
    "memes",
    0.00001043,
    8.42,
    "#b4fb50",
    "◉",
    "$820M",
    B("DEX 範例 · 合約未驗證", "DEX example · unverified contract"),
  ),
  asset(
    "aapl",
    "AAPL",
    "Apple Inc.",
    "stocks",
    224.31,
    -0.42,
    "#d2dae2",
    "A",
    "$8.1B",
    B("NASDAQ · 現股", "NASDAQ · equity"),
  ),
  asset(
    "nvda",
    "NVDA",
    "NVIDIA",
    "stocks",
    132.65,
    2.87,
    "#b4fb50",
    "N",
    "$21.3B",
    B("NASDAQ · 現股", "NASDAQ · equity"),
  ),
  asset(
    "xau",
    "XAU",
    "Gold / US Dollar",
    "gold",
    2658.4,
    0.76,
    "#eec667",
    "Au",
    "—",
    B(
      "XAU/USD 現貨參考 · 非期貨或 ETF",
      "XAU/USD spot reference · not futures or ETF",
    ),
  ),
];
const factorSet = (passed: number) =>
  [
    B("收盤趨勢", "Closed-candle trend"),
    B("成交量確認", "Volume confirmation"),
    B("流動性", "Liquidity"),
    B("風險報酬", "Reward / risk"),
    B("基本面驗證", "Fundamental verification"),
  ].map((label, i) => ({ label, passed: i < passed }));
const docsSource = {
  name: "Binance · Market data",
  url: "https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints",
  note: B(
    "資料介面文件；非此範例報價的證據。",
    "API documentation; does not substantiate these fictional prices.",
  ),
};
const base = {
  asOf: DEMO_TIME,
  expiresAt: DEMO_EXPIRY,
  ruleVersion: "closed-candle/1.0.0",
  status: "Demo" as Status,
  costBps: 20,
  sources: [docsSource],
};
export const demoSetups: Setup[] = [
  {
    ...base,
    id: "demo-btc-pullback",
    asset: "btc",
    category: "spot",
    direction: "long",
    strategy: B("趨勢回踩", "Trend pullback"),
    timeframe: "4H",
    trigger: B(
      "4H 收盤守住 EMA20，下一根收盤突破前高，成交量 ≥ 20 根均量的 1.2 倍。",
      "4H close holds EMA20, followed by a close above the prior high with volume ≥ 1.2× the 20-bar average.",
    ),
    thesis: B(
      "範例走勢保留較高低點，回踩支撐後等待收盤確認。鏈上採用、代幣經濟與新聞尚未驗證，因此不構成實際交易訊號。",
      "The fictional trend retains higher lows. Wait for a confirmed close after the pullback. Adoption, tokenomics and news are unverified; this is not an active trade signal.",
    ),
    risk: B(
      "跌破 61,800 失效；宏觀事件或流動性下降時取消。",
      "Invalid below 61,800; cancel around material macro events or deteriorating liquidity.",
    ),
    entry: [62500, 63000],
    stop: 61800,
    targets: [65400, 67200],
    factors: factorSet(4),
  },
  {
    ...base,
    id: "demo-eth-breakout",
    asset: "eth",
    category: "spot",
    direction: "long",
    strategy: B("突破回測", "Breakout retest"),
    timeframe: "4H",
    trigger: B(
      "4H 收盤突破區間上緣 2,450，回測不破且成交量放大。",
      "4H closes above the 2,450 range high, then retests it without a close below; volume expands.",
    ),
    thesis: B(
      "範例突破結構改善，但協議收入、供給與催化消息仍需原始來源確認。",
      "The example breakout improves structure. Protocol revenue, supply and catalysts still require primary-source confirmation.",
    ),
    risk: B(
      "收盤低於 2,360 失效；避免追價。",
      "Invalid on a close below 2,360; avoid chasing the move.",
    ),
    entry: [2420, 2460],
    stop: 2360,
    targets: [2710, 2850],
    factors: factorSet(4),
  },
  {
    ...base,
    id: "demo-sol-range",
    asset: "sol",
    category: "spot",
    direction: "long",
    strategy: B("區間均值回歸", "Range reversion"),
    timeframe: "1H",
    trigger: B(
      "1H 收盤重回區間低點 143 上方，RSI(14) 由低於 30 回升至 30 以上。",
      "1H closes back above the 143 range low and RSI(14) crosses back above 30.",
    ),
    thesis: B(
      "橫盤範例的下緣反彈。長期累積前須另核對使用量、通膨、解鎖與驗證者風險。",
      "A lower-bound bounce in a fictional range. Long-term accumulation also requires usage, inflation, unlock and validator-risk checks.",
    ),
    risk: B(
      "趨勢突破會使區間策略失效。",
      "A directional breakout invalidates the range-reversion premise.",
    ),
    entry: [142, 145],
    stop: 138,
    targets: [158, 165],
    factors: factorSet(3),
  },
  {
    ...base,
    id: "demo-pepe-radar",
    asset: "pepe",
    category: "memes",
    direction: "neutral",
    strategy: B("錢包共買觀察", "Wallet co-buy watch"),
    timeframe: "1H",
    trigger: B(
      "同鏈、同合約的獨立錢包共買達門檻；須排除關聯錢包，再確認流動性與可賣出性。",
      "Distinct wallets buy the same chain and contract within the window. Exclude related wallets, then verify liquidity and sellability.",
    ),
    thesis: B(
      "僅示範共買分析。無已驗證合約、持有人、部署者或 CEX 上架資料；禁止列為可執行訊號。",
      "Illustrates co-buy analysis only. Contract identity, holders, deployer and CEX listings are unverified; ineligible as an actionable signal.",
    ),
    risk: B(
      "重大風險：賣出限制未知、持有人集中度未知、部署者活動未知。",
      "Critical: sell restrictions, holder concentration and deployer activity are unknown.",
    ),
    entry: [0.0000098, 0.0000101],
    stop: 0.0000091,
    targets: [0.0000122, 0.0000138],
    costBps: 120,
    factors: factorSet(2),
    sources: [
      {
        name: "DEX Screener · API reference",
        url: "https://docs.dexscreener.com/api/reference",
        note: B(
          "公開資料介面文件；不是代幣安全背書。",
          "Public data API documentation; not a token safety endorsement.",
        ),
      },
    ],
  },
  {
    ...base,
    id: "demo-btc-futures",
    asset: "btc",
    category: "futures",
    direction: "long",
    strategy: B("順勢條件做多", "Conditional trend long"),
    timeframe: "4H",
    trigger: B(
      "4H 收盤突破 64,000，量能 ≥ 1.2 倍均量；資金費率 < 0.03% / 8h 且 OI 不出現單根暴增。",
      "4H closes above 64,000 on ≥ 1.2× volume; funding < 0.03% / 8h and no abrupt single-bar OI spike.",
    ),
    thesis: B(
      "價格、成交量、資金費率及未平倉量需同時通過。範例尚未確認，保持觀察。",
      "Price, volume, funding and open interest must agree. This example is unconfirmed; remain on watch.",
    ),
    risk: B(
      "資金費率反轉或 OI 過熱則中立；停損不保證成交價。",
      "Neutral if funding reverses or OI overheats. A stop does not guarantee execution price.",
    ),
    entry: [64000, 64200],
    stop: 63000,
    targets: [67800, 69500],
    costBps: 30,
    factors: factorSet(3),
  },
  {
    ...base,
    id: "demo-eth-futures",
    asset: "eth",
    category: "futures",
    direction: "short",
    strategy: B("跌破反彈做空", "Breakdown retest short"),
    timeframe: "1H",
    trigger: B(
      "1H 收盤跌破 2,430 後回測失敗，成交量增加；需確認 OI 與資金費率未過熱。",
      "1H closes below 2,430, fails the retest and volume rises; OI and funding must not indicate a crowded short.",
    ),
    thesis: B(
      "條件式空方範例；未完成全部條件則維持中立。",
      "Conditional short example; remain neutral until every required condition is met.",
    ),
    risk: B(
      "高於 2,500 失效；回補與跳空風險。",
      "Invalid above 2,500; short squeezes and gaps remain possible.",
    ),
    entry: [2410, 2430],
    stop: 2500,
    targets: [2180, 2070],
    costBps: 30,
    factors: factorSet(3),
  },
  {
    ...base,
    id: "demo-nvda-earnings",
    asset: "nvda",
    category: "stocks",
    direction: "long",
    strategy: B("財報後回測", "Post-earnings retest"),
    timeframe: "1D",
    trigger: B(
      "日線收盤站穩 130 且回測量縮；先核對最新 10-Q、現金流與財報日期。",
      "Daily close holds 130 on lighter pullback volume; first verify the latest 10-Q, cash flow and earnings date.",
    ),
    thesis: B(
      "研究自由現金流、營收集中度與估值敏感性。此處未連接申報文件、財報日曆或即時報價。",
      "Review free cash flow, revenue concentration and valuation sensitivity. Filings, earnings calendars and live quotes are not connected.",
    ),
    risk: B(
      "財報跳空可能越過停損；範例不代表目前估值。",
      "Earnings gaps can bypass stops; example values do not represent current valuation.",
    ),
    entry: [129, 131],
    stop: 124,
    targets: [145, 153],
    costBps: 15,
    factors: factorSet(3),
    sources: [
      {
        name: "SEC · EDGAR",
        url: "https://www.sec.gov/edgar/search/",
        note: B(
          "原始申報查詢；尚未擷取特定申報。",
          "Primary filing search; no specific filing has been ingested.",
        ),
      },
    ],
  },
  {
    ...base,
    id: "demo-xau-macro",
    asset: "xau",
    category: "gold",
    direction: "long",
    strategy: B("宏觀順勢回踩", "Macro trend pullback"),
    timeframe: "1D",
    trigger: B(
      "日線守住 2,620 支撐，且美元與 10 年實質殖利率未同步轉強。",
      "Daily close holds 2,620 support, without concurrent strength in the dollar and 10-year real yields.",
    ),
    thesis: B(
      "將美元、實質利率與聯準會事件風險納入條件。XAU/USD、COMEX 期貨與 GLD ETF 不能混用。",
      "Condition the setup on the dollar, real yields and Fed event risk. XAU/USD, COMEX futures and GLD ETF are separate instruments.",
    ),
    risk: B(
      "FOMC 與通膨數據可能造成跳空；宏觀資料尚未連接。",
      "FOMC and inflation releases can cause gaps; macro feeds are not connected.",
    ),
    entry: [2620, 2635],
    stop: 2585,
    targets: [2750, 2810],
    costBps: 12,
    factors: factorSet(3),
    sources: [
      {
        name: "FRED · 10Y real yield",
        url: "https://fred.stlouisfed.org/series/DFII10",
        note: B(
          "實質殖利率原始系列；此處未擷取即時數值。",
          "Original real-yield series; no current value has been ingested.",
        ),
      },
      {
        name: "Federal Reserve · FOMC",
        url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
        note: B(
          "官方會議日曆與政策文件。",
          "Official meeting calendar and policy releases.",
        ),
      },
    ],
  },
];
export const demoSnapshot: Snapshot = {
  version: 1,
  status: "Demo",
  generatedAt: DEMO_TIME,
  expiresAt: DEMO_EXPIRY,
  assets: demoAssets,
  setups: demoSetups,
};
export const pageCopy: Record<
  Exclude<Tab, "overview">,
  { eyebrow: string; title: Bi; desc: Bi }
> = {
  spot: {
    eyebrow: "CRYPTO RESEARCH",
    title: B("加密現貨", "Crypto spot"),
    desc: B(
      "從市場結構到長期價值。每一個想法，都有依據與失效條件。",
      "From market structure to long-term value. Every idea has evidence and an invalidation.",
    ),
  },
  memes: {
    eyebrow: "ON-CHAIN DISCOVERY",
    title: B("迷因雷達", "Meme radar"),
    desc: B(
      "追蹤資金共識，先看清風險。合約地址比代幣名稱更重要。",
      "Follow wallet convergence. Understand the risk first. Identity starts with chain + contract.",
    ),
  },
  futures: {
    eyebrow: "CONDITIONS, NOT PREDICTIONS",
    title: B("合約策略", "Futures"),
    desc: B(
      "先定義失效，再考慮部位。多、空、中立，都需要條件。",
      "Define invalidation before position size. Long, short and neutral are conditional.",
    ),
  },
  stocks: {
    eyebrow: "FUNDAMENTALS MEET STRUCTURE",
    title: B("美股研究", "US stock research"),
    desc: B(
      "以原始申報與現金流為起點，讓估值與技術面對話。",
      "Start with primary filings and cash flow. Put valuation alongside market structure.",
    ),
  },
  gold: {
    eyebrow: "THE MACRO LENS",
    title: B("黃金市場", "Gold & macro"),
    desc: B(
      "追蹤黃金，也追蹤推動它的美元、實質利率與政策。",
      "Track gold alongside the dollar, real yields and the policy forces behind it.",
    ),
  },
  wallets: {
    eyebrow: "FOLLOW THE EVIDENCE",
    title: B("聰明錢追蹤", "Wallet intelligence"),
    desc: B(
      "錢包不是勝率。看已實現報酬、樣本量、成本與回撤。",
      "A wallet is not a win probability. Check realized returns, sample size, costs and drawdown.",
    ),
  },
  watchlists: {
    eyebrow: "YOUR RESEARCH DESK",
    title: B("觀察清單與提醒", "Watchlists & alerts"),
    desc: B(
      "留下值得關注的標的。條件到了，再回來驗證。",
      "Keep the assets worth watching. Revisit the evidence when conditions change.",
    ),
  },
  settings: {
    eyebrow: "MAKE IT YOUR TERMINAL",
    title: B("終端設定", "Terminal settings"),
    desc: B(
      "設定資料來源、研究偏好與風險參數。所有時間以台北顯示。",
      "Configure data access, research preferences and risk parameters. All times use Asia/Taipei.",
    ),
  },
};
