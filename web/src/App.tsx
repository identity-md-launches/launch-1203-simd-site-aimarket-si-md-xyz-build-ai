import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bitcoin,
  BookOpen,
  ChevronRight,
  Clock3,
  Command,
  Compass,
  Cpu,
  Crosshair,
  Globe2,
  LayoutDashboard,
  Menu,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  TrendingUp,
  Wallet as WalletIcon,
  X,
} from "lucide-react";
import {
  B,
  demoSnapshot,
  nav,
  pageCopy,
  type Asset,
  type Lang,
  type Setup,
  type Snapshot,
  type Status,
  type Tab,
} from "./data";
import {
  backendBase,
  presentSnapshot,
  eligible,
  fetchSnapshot,
  money,
  taipei,
  validWallet,
  type Wallet,
} from "./engine";
import {
  isSettings,
  isStringArray,
  useStored,
  type AlertRule,
  type JournalEntry,
  type Settings,
} from "./storage";
import ConsoleArt from "./components/ConsoleArt";
import Chart, { Sparkline } from "./components/Chart";
import {
  Empty,
  External,
  Modal,
  ResearchNotice,
  StatusBadge,
  TokenIcon,
} from "./components/ui";
import {
  ResearchGrid,
  RiskCalculator,
  SetupDetail,
} from "./components/Research";
import {
  MemePanel,
  SettingsPanel,
  Wallets,
  Watchlists,
} from "./components/Workspace";

const icons: Record<
  Tab,
  ComponentType<{ size?: number; className?: string }>
> = {
  overview: LayoutDashboard,
  spot: Bitcoin,
  memes: Radio,
  futures: Activity,
  stocks: TrendingUp,
  gold: Compass,
  wallets: WalletIcon,
  watchlists: Star,
  settings: Settings2,
};
const getTab = (): Tab =>
  nav.some((n) => `#${n.id}` === location.hash)
    ? (location.hash.slice(1) as Tab)
    : "overview";
const isLang = (v: unknown): v is Lang => v === "zh" || v === "en";
const validWallets = (v: unknown): v is Wallet[] =>
  Array.isArray(v) &&
  v.length <= 1000 &&
  v.every(
    (w) =>
      w &&
      typeof w.id === "string" &&
      ["Ethereum", "Base", "Solana"].includes(w.chain) &&
      typeof w.label === "string" &&
      typeof w.address === "string" &&
      validWallet(w.chain, w.address),
  );
const validAlerts = (v: unknown): v is AlertRule[] =>
  Array.isArray(v) &&
  v.length <= 1000 &&
  v.every(
    (a) =>
      a &&
      typeof a.id === "string" &&
      typeof a.asset === "string" &&
      ["above", "below"].includes(a.direction) &&
      Number.isFinite(a.threshold) &&
      a.threshold > 0 &&
      typeof a.createdAt === "string" &&
      typeof a.demo === "boolean",
  );
const validJournal = (v: unknown): v is JournalEntry[] =>
  Array.isArray(v) &&
  v.length <= 2000 &&
  v.every(
    (j) =>
      j &&
      typeof j.key === "string" &&
      Number.isFinite(Date.parse(j.observedAt)) &&
      ["Demo", "Connected"].includes(j.mode) &&
      j.setup &&
      typeof j.setup.asset === "string" &&
      typeof j.setup.strategy?.zh === "string" &&
      typeof j.setup.strategy?.en === "string" &&
      j.outcome === "pending",
  );

export default function App() {
  const [lang, setLang, langFail] = useStored<Lang>("language", "zh", isLang);
  const [settings, setSettings, settingsFail] = useStored<Settings>(
    "settings",
    { demo: true, motion: true, backend: "" },
    isSettings,
  );
  const [watchlist, setWatchlist, watchFail] = useStored<string[]>(
    "watchlist",
    ["btc", "eth", "sol"],
    isStringArray,
  );
  const [wallets, setWallets, walletFail] = useStored<Wallet[]>(
    "wallets",
    [],
    validWallets,
  );
  const [alerts, setAlerts, alertFail] = useStored<AlertRule[]>(
    "alerts",
    [],
    validAlerts,
  );
  const [journal, setJournal, journalFail] = useStored<JournalEntry[]>(
    "journal",
    [],
    validJournal,
  );
  const [tab, setTab] = useState<Tab>(getTab);
  const [mobileNav, setMobileNav] = useState(false);
  const [selected, setSelected] = useState("btc");
  const [detail, setDetail] = useState<Setup | null>(null);
  const [method, setMethod] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [now, setNow] = useState(Date.now());
  const controller = useRef<AbortController | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const current = nav.find((n) => n.id === tab)!;
  const snapshot = settings.demo ? demoSnapshot : data;
  const presented = snapshot
    ? presentSnapshot(snapshot, now, connectionFailed && !settings.demo)
    : null;
  const snapshotStatus: Status = presented?.status ?? "Unavailable";
  const isDemo = snapshotStatus === "Demo";
  const assets = presented?.assets ?? [];
  const setups = presented?.setups ?? [];
  const storageFailed =
    langFail ||
    settingsFail ||
    watchFail ||
    walletFail ||
    alertFail ||
    journalFail;
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hant" : "en";
    document.title = `${current.label[lang]} · AI Market`;
  }, [lang, tab]);
  useEffect(() => {
    const listener = () => {
      setTab(getTab());
      setSearch("");
      setMobileNav(false);
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    const deadlines =
      snapshot && snapshot.status !== "Demo"
        ? [snapshot.expiresAt, ...snapshot.setups.map((s) => s.expiresAt)]
            .map(Date.parse)
            .filter((time) => time > now)
        : [];
    const delay = Math.min(
      30000,
      ...deadlines.map((time) => Math.max(1, time - now + 1)),
    );
    const id = setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(id);
  }, [snapshot, now]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "SELECT", "TEXTAREA"].includes(
          (e.target as HTMLElement).tagName,
        )
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setSearch("");
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!snapshot) return;
    const candidates = setups.filter(
      (s) =>
        s.status === "Demo" ||
        (eligible(s, now) && ["Live", "Delayed"].includes(snapshotStatus)),
    );
    setJournal((previous) => {
      const keys = new Set(previous.map((j) => j.key));
      const additions: JournalEntry[] = candidates
        .filter(
          (s) =>
            !keys.has(
              `${s.status === "Demo" ? "Demo" : "Connected"}:${s.id}:${s.asOf}`,
            ),
        )
        .map((s) => ({
          key: `${s.status === "Demo" ? "Demo" : "Connected"}:${s.id}:${s.asOf}`,
          observedAt: new Date().toISOString(),
          mode: s.status === "Demo" ? "Demo" : "Connected",
          setup: s,
          outcome: "pending",
        }));
      return additions.length
        ? [...previous, ...additions].slice(0, 2000)
        : previous;
    });
  }, [snapshot, settings.demo, snapshotStatus, now]);
  function navigate(id: Tab) {
    setTab(id);
    location.hash = id;
    setMobileNav(false);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function toggleWatch(id: string) {
    const saved = watchlist.includes(id);
    setWatchlist(
      saved ? watchlist.filter((x) => x !== id) : [...watchlist, id],
    );
    setToast(
      saved
        ? t("已移出觀察清單", "Removed from watchlist")
        : t("已加入觀察清單", "Added to watchlist"),
    );
  }
  function openAsset(id: string) {
    const s = setups.find((s) => s.asset === id);
    if (s) setDetail(s);
    else {
      setSelected(id);
      navigate("overview");
      setToast(
        t(
          "此標的尚無研究條件，可查看報價。",
          "No setup is available for this asset. Its quote is shown.",
        ),
      );
    }
    setSearch("");
  }
  async function connect(raw: string) {
    let base: string;
    try {
      base = backendBase(raw);
    } catch {
      setConnectionError(
        t(
          "請輸入 HTTPS 網址，不含帳密、查詢參數或片段。",
          "Enter an HTTPS URL without credentials, query parameters or fragments.",
        ),
      );
      document.getElementById("backend-url")?.focus();
      return;
    }
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setConnectionError("");
    const timeout = setTimeout(() => request.abort(), 10000);
    try {
      const fresh = await fetchSnapshot(base, request.signal);
      if (request !== controller.current) return;
      setData(fresh);
      setSettings({ ...settings, backend: base, demo: false });
      setConnectionFailed(false);
      setToast(
        t(
          "已驗證後端快照；請檢查各項資料狀態。",
          "Backend snapshot validated. Check each data status.",
        ),
      );
    } catch (error) {
      if (request !== controller.current) return;
      setConnectionFailed(true);
      setConnectionError(
        t(
          "無法取得有效快照。請確認 HTTPS、CORS、/v1/snapshot 格式與網路，再重試。",
          "No valid snapshot received. Check HTTPS, CORS, /v1/snapshot schema and connectivity, then retry.",
        ),
      );
    } finally {
      clearTimeout(timeout);
      if (request === controller.current) setLoading(false);
    }
  }
  const navigation = (
    <>
      <div className="nav-label">{t("研究終端", "Research terminal")}</div>
      <nav aria-label={t("主要導覽", "Main navigation")}>
        {nav.slice(0, 6).map((n) => {
          const Icon = icons[n.id];
          return (
            <a
              key={n.id}
              href={`#${n.id}`}
              aria-current={tab === n.id ? "page" : undefined}
              onClick={() => navigate(n.id)}
            >
              <Icon size={18} />
              <span>{n.label[lang]}</span>
              {n.tag && <small>{n.tag}</small>}
              {tab === n.id && <i className="nav-active-dot" />}
            </a>
          );
        })}
        <div className="nav-label workspace-label">
          {t("個人工作區", "Workspace")}
        </div>
        {nav.slice(6).map((n) => {
          const Icon = icons[n.id];
          return (
            <a
              key={n.id}
              href={`#${n.id}`}
              aria-current={tab === n.id ? "page" : undefined}
              onClick={() => navigate(n.id)}
            >
              <Icon size={18} />
              <span>{n.label[lang]}</span>
              {n.id === "watchlists" && <small>{watchlist.length}</small>}
            </a>
          );
        })}
      </nav>
    </>
  );
  return (
    <div className={`app ${settings.motion ? "motion-on" : "motion-off"}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById("main-content");
          main?.focus();
          main?.scrollIntoView({ block: "start" });
        }}
      >
        {t("跳至主要內容", "Skip to content")}
      </a>
      <aside className="sidebar">
        <a
          href="#overview"
          className="brand"
          onClick={() => navigate("overview")}
          aria-label="AI Market home"
        >
          <span className="brand-mark">
            <Terminal size={24} />
          </span>
          <span>
            AI<span className="brand-market">Market</span>
            <small>PEPE INTELLIGENCE</small>
          </span>
        </a>
        {navigation}
        <div className="sidebar-bottom">
          <div className="sidebar-message">
            <span className="small-terminal">
              <Command size={18} />
            </span>
            <strong>
              Less noise.
              <br />
              <span>More signal.</span>
            </strong>
            <p>
              {t(
                "用證據思考，帶紀律研究。",
                "Think in evidence. Research with discipline.",
              )}
            </p>
            <button className="text-button" onClick={() => setMethod(true)}>
              {t("了解研究方法", "Our research method")}
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="sidebar-status">
            <span className="status-dot" />
            {t("終端就緒", "Terminal ready")}
            <span className="mono">v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu-button"
              aria-label={t("開啟導覽", "Open navigation")}
              onClick={() => setMobileNav(true)}
            >
              <Menu size={21} />
            </button>
            <Terminal size={16} />
            <span>TERMINAL</span>
            <ChevronRight size={13} />
            <strong>{current.label[lang]}</strong>
          </div>
          <div className="topbar-actions">
            <div className="global-search">
              <Search size={16} />
              <input
                ref={searchRef}
                type="search"
                aria-label={t("搜尋所有標的", "Search all assets")}
                placeholder={t("搜尋市場、代幣…", "Search markets, tokens…")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>/</kbd>
              {search && (
                <div className="search-results">
                  <div className="search-heading">
                    {t("市場搜尋", "Market search")}
                    <button
                      className="icon-button"
                      aria-label={t("關閉搜尋", "Close search")}
                      onClick={() => setSearch("")}
                    >
                      <X size={15} />
                    </button>
                  </div>
                  {assets
                    .filter((a) =>
                      `${a.symbol} ${a.name}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((a) => (
                      <button key={a.id} onClick={() => openAsset(a.id)}>
                        <TokenIcon asset={a} small />
                        <span>
                          {a.symbol}
                          <small>{a.name}</small>
                        </span>
                        <ArrowUpRight size={15} />
                      </button>
                    ))}
                  {!assets.some((a) =>
                    `${a.symbol} ${a.name}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  ) && (
                    <p>
                      {t(
                        "沒有符合的標的。請試試 BTC。",
                        "No matching asset. Try BTC.",
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              className="language-button"
              onClick={() => setLang(lang === "zh" ? "en" : "zh")}
              aria-label={
                lang === "zh" ? "Switch to English" : "切換至繁體中文"
              }
            >
              <Globe2 size={16} />
              <span>{lang === "zh" ? "繁中" : "EN"}</span>
            </button>
            <span className="header-divider" />
            <button
              className="icon-button notification-button"
              aria-label={t("查看提醒草稿", "View alert drafts")}
              onClick={() => navigate("watchlists")}
            >
              <Bell size={19} />
              {alerts.length > 0 && <i />}
            </button>
            <span
              className="user-avatar"
              aria-label={t("本機研究工作區", "Local research workspace")}
            >
              P
            </span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="mode-bar">
            <div>
              <span className={`mode-light ${isDemo ? "demo" : ""}`} />
              <strong>
                {isDemo
                  ? "DEMO MODE"
                  : snapshot
                    ? "RESEARCH MODE"
                    : "SETUP REQUIRED"}
              </strong>
              <span>
                {isDemo
                  ? t("示範資料，非即時行情", "Synthetic data, not live prices")
                  : snapshot
                    ? t(
                        "請確認各資料時間與有效期限",
                        "Check each timestamp and expiry",
                      )
                    : t("尚未連接資料後端", "No data backend connected")}
              </span>
            </div>
            <div className="mode-actions">
              {settings.backend && !settings.demo && (
                <button
                  className="text-button"
                  onClick={() => connect(settings.backend)}
                  disabled={loading}
                >
                  <RefreshCw size={13} />
                  {loading
                    ? t("更新中…", "Refreshing…")
                    : t("更新快照", "Refresh snapshot")}
                </button>
              )}
              <button
                className="text-button"
                onClick={() => navigate("settings")}
              >
                {isDemo
                  ? t("連接資料後端", "Connect data backend")
                  : t("資料設定", "Data settings")}
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
          {storageFailed && (
            <div className="warning" role="alert">
              {t(
                "瀏覽器儲存不可用或空間不足。變更只保留至此分頁關閉，請匯出日誌與提醒。",
                "Browser storage is unavailable or full. Changes last only in this tab; export your journal and alerts.",
              )}
            </div>
          )}
          {journal.length >= 2000 && (
            <div className="warning" role="alert">
              {t(
                "本機日誌已達 2,000 筆上限，新的研究無法記錄。請匯出並改用外部日誌。",
                "The 2,000-entry local journal is full. New research cannot be recorded. Export and use external logging.",
              )}
            </div>
          )}
          {tab === "overview" ? (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <span /> PEPE INTELLIGENCE TERMINAL
                  </div>
                  <h1>
                    {t("看懂訊號，", "Less noise.")}
                    <br />
                    <em>{t("看見先機。", "More signal.")}</em>
                  </h1>
                  <p>
                    {t(
                      "跨市場情報 × 鏈上洞察 × 紀律研究",
                      "Cross-market intelligence. On-chain insight.",
                    )}
                    <br />
                    {t(
                      "讓 Pepe 替你看市場，讓證據引導每一步。",
                      "Your market co-pilot. Every insight starts with evidence.",
                    )}
                  </p>
                  <div className="hero-actions">
                    <button
                      className="button primary"
                      onClick={() => navigate("spot")}
                    >
                      <Crosshair size={17} />
                      {t("探索市場", "Explore markets")}
                      <ArrowRight size={17} />
                    </button>
                    <button
                      className="button subtle"
                      onClick={() => setMethod(true)}
                    >
                      <BookOpen size={16} />
                      {t("研究方法", "Our methodology")}
                    </button>
                  </div>
                </div>
                <ConsoleArt />
                <span className="art-caption">PEPE RESEARCH DESK / 001</span>
                <button
                  className="motion-control"
                  aria-label={
                    settings.motion
                      ? t("暫停背景動態", "Pause background animation")
                      : t("播放背景動態", "Play background animation")
                  }
                  onClick={() =>
                    setSettings({ ...settings, motion: !settings.motion })
                  }
                >
                  {settings.motion ? <Pause size={13} /> : <Play size={13} />}
                </button>
              </section>
              <div className="market-section-head">
                <div>
                  <span className="green-cross">+</span>
                  <h2>{t("全球市場快照", "Global market snapshot")}</h2>
                  <StatusBadge status={snapshotStatus} lang={lang} />
                </div>
                <span className="update-time">
                  <Clock3 size={13} />
                  {snapshot ? taipei(snapshot.generatedAt, true) : "—"}{" "}
                  <span>UTC+8</span>
                </span>
              </div>
              <div className="market-tickers">
                {["btc", "eth", "sol", "xau"]
                  .map((id) => assets.find((a) => a.id === id))
                  .filter((a): a is Asset => !!a)
                  .map((a, i) => (
                    <button
                      className={`market-ticker ${selected === a.id ? "selected" : ""}`}
                      key={a.id}
                      onClick={() => setSelected(a.id)}
                      aria-label={`${t("在圖表查看", "Show chart for")} ${a.symbol}`}
                      aria-pressed={selected === a.id}
                    >
                      <div className="ticker-label">
                        <TokenIcon asset={a} small />
                        <strong>{a.symbol}</strong>
                        <span>{a.id === "xau" ? "Gold" : a.name}</span>
                        <ArrowUpRight size={13} />
                      </div>
                      <div className="ticker-number">
                        <strong>{money(a.price)}</strong>
                        {a.status === "Demo" && <Sparkline index={i} />}
                      </div>
                      <div className="ticker-foot">
                        <span
                          className={a.change < 0 ? "negative" : "positive"}
                        >
                          {a.change >= 0 ? "↗ +" : "↘ "}
                          {a.change.toFixed(2)}%
                        </span>
                        <span>24H · {a.status.toUpperCase()}</span>
                      </div>
                    </button>
                  ))}
              </div>
              {!snapshot && (
                <Empty
                  title={t(
                    "連接後端，開始研究",
                    "Connect a backend to start research",
                  )}
                  text={t(
                    "真實資料來源尚未設定。前往設定連接服務，或開啟示範模式探索介面。",
                    "Real data sources are not configured. Connect a service in Settings or enable demo mode to explore.",
                  )}
                  action={
                    <button
                      className="button primary"
                      onClick={() => navigate("settings")}
                    >
                      {t("開啟設定", "Open settings")}
                    </button>
                  }
                />
              )}
              <div className="dashboard-grid">
                <Chart
                  assets={assets}
                  selected={selected}
                  onSelect={setSelected}
                  lang={lang}
                />
                <div className="dashboard-side">
                  <section className="panel watch-panel">
                    <div className="panel-head">
                      <h2>
                        <Star size={16} />
                        {t("我的觀察清單", "My watchlist")}
                      </h2>
                      <button
                        className="icon-button"
                        aria-label={t("管理觀察清單", "Manage watchlist")}
                        onClick={() => navigate("watchlists")}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    </div>
                    {watchlist
                      .slice(0, 4)
                      .map((id) => assets.find((a) => a.id === id))
                      .filter((a): a is Asset => !!a)
                      .map((a) => (
                        <button
                          className="mini-watch"
                          key={a.id}
                          onClick={() => openAsset(a.id)}
                        >
                          <TokenIcon asset={a} small />
                          <span>
                            <strong>{a.symbol}</strong>
                            <small>{a.name}</small>
                          </span>
                          <span className="mini-price">
                            <strong className="mono">{money(a.price)}</strong>
                            <small
                              className={a.change < 0 ? "negative" : "positive"}
                            >
                              {a.change >= 0 ? "+" : ""}
                              {a.change.toFixed(2)}%
                            </small>
                          </span>
                        </button>
                      ))}
                    {!watchlist.length && (
                      <p className="inline-empty">
                        {t(
                          "將研究標的加入觀察清單。",
                          "Bookmark a research asset to start.",
                        )}
                      </p>
                    )}
                    <button
                      className="watch-add"
                      onClick={() => navigate("watchlists")}
                    >
                      + {t("管理觀察標的", "Manage watchlist")}
                    </button>
                  </section>
                  <section className="insight-panel">
                    <div className="insight-title">
                      <span>
                        <Sparkles size={17} />
                        {t("PEPE 研究筆記", "PEPE research note")}
                      </span>
                      <span className="tag">{isDemo ? "DEMO" : "INFO"}</span>
                    </div>
                    <p>
                      {t(
                        "好的研究，先問「什麼情況下我會錯？」",
                        "Good research starts with “What would prove this wrong?”",
                      )}
                    </p>
                    <div>
                      <span>
                        {t(
                          "等待收盤確認，保留失效條件。",
                          "Wait for the close. Keep an invalidation.",
                        )}
                      </span>
                      <button
                        aria-label={t("閱讀研究方法", "Read research method")}
                        className="icon-button"
                        onClick={() => setMethod(true)}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    </div>
                  </section>
                </div>
              </div>
              <section className="opportunities">
                <div className="section-heading">
                  <div>
                    <h2>
                      <Crosshair size={18} />
                      {t("值得關注的研究", "Research on the radar")}
                    </h2>
                    <p>
                      {t(
                        "條件式策略，有依據地觀察下一步。",
                        "Conditional setups. Evidence for your next question.",
                      )}
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("spot")}
                  >
                    {t("查看全部研究", "View all research")}
                    <ArrowRight size={15} />
                  </button>
                </div>
                <ResearchGrid
                  setups={setups.filter((s) => s.category === "spot")}
                  assets={assets}
                  lang={lang}
                  watchlist={watchlist}
                  onWatch={toggleWatch}
                  onOpen={setDetail}
                  compact
                />
              </section>
              <div className="bottom-grid">
                <section className="panel intelligence-panel">
                  <div className="panel-head">
                    <h2>
                      <Cpu size={17} />
                      {t("情報來源觀察站", "Intelligence desk")}
                    </h2>
                    <span className="tag">
                      {t("原始來源", "PRIMARY SOURCES")}
                    </span>
                  </div>
                  {[
                    {
                      tag: "ON-CHAIN",
                      title: B(
                        "合約、流動性與持有人：先辨識，再追蹤",
                        "Contract, liquidity, holders: identify before following",
                      ),
                      name: "DEX Screener",
                      url: "https://docs.dexscreener.com/api/reference",
                    },
                    {
                      tag: "EQUITIES",
                      title: B(
                        "從原始申報看現金流，而非只看敘事",
                        "Read cash flow in primary filings, beyond the narrative",
                      ),
                      name: "SEC EDGAR",
                      url: "https://www.sec.gov/edgar/search/",
                    },
                    {
                      tag: "MACRO",
                      title: B(
                        "黃金研究不能少了實質殖利率",
                        "Real yields belong in every gold research checklist",
                      ),
                      name: "FRED · DFII10",
                      url: "https://fred.stlouisfed.org/series/DFII10",
                    },
                  ].map((n) => (
                    <a
                      className="intelligence-row"
                      key={n.tag}
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="news-category">{n.tag}</span>
                      <div>
                        <h3>{n.title[lang]}</h3>
                        <span>
                          {n.name} ·{" "}
                          {t(
                            "研究資源，非即時新聞",
                            "Research resource, not live news",
                          )}
                        </span>
                      </div>
                      <ArrowUpRight size={16} />
                    </a>
                  ))}
                </section>
                <section className="panel system-panel">
                  <div className="panel-head">
                    <h2>
                      <Activity size={17} />
                      {t("終端狀態", "Terminal status")}
                    </h2>
                  </div>
                  <div className="padded">
                    <div className="system-line">
                      <span>{t("資料模式", "Data mode")}</span>
                      <StatusBadge status={snapshotStatus} lang={lang} />
                    </div>
                    <div className="system-line">
                      <span>{t("外部後端", "External backend")}</span>
                      <span className={data ? "positive" : "warning-text"}>
                        {data
                          ? t("已連接", "Connected")
                          : t("需要設定", "Setup required")}
                      </span>
                    </div>
                    <div className="system-line">
                      <span>{t("通知派送", "Alert delivery")}</span>
                      <span>{t("未啟用", "Inactive")}</span>
                    </div>
                    <div className="system-line">
                      <span>{t("本機研究紀錄", "Local journal")}</span>
                      <span className="mono">{journal.length}</span>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("settings")}
                    >
                      {t("設定資料來源", "Configure data sources")}
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">{pageCopy[tab].eyebrow}</div>
                  <h1>{pageCopy[tab].title[lang]}</h1>
                  <p>{pageCopy[tab].desc[lang]}</p>
                </div>
                {!["settings", "wallets", "watchlists"].includes(tab) && (
                  <StatusBadge status={snapshotStatus} lang={lang} />
                )}
              </div>
              {["spot", "memes", "futures", "stocks", "gold"].includes(tab) && (
                <>
                  {tab === "memes" && <MemePanel lang={lang} demo={isDemo} />}
                  {tab === "stocks" && (
                    <div className="market-context">
                      <Clock3 size={20} />
                      <div>
                        <strong>
                          {t(
                            "美東交易時段與報價狀態",
                            "US trading sessions & quote status",
                          )}
                        </strong>
                        <p>
                          {t(
                            "常規交易 09:30–16:00 America/New_York；台北時間依美國夏令時間變動。盤前 / 盤後需分開標記。假日、當前開休市與最新財報日期尚未驗證。",
                            "Regular session 09:30–16:00 America/New_York; Taipei times shift with US daylight saving. Premarket / after-hours are separate. Holidays, current session and latest earnings dates are unverified.",
                          )}
                        </p>
                        <span>
                          {isDemo
                            ? t(
                                "範例報價：Demo；實際延遲未知，非即時。",
                                "Example quotes: Demo; actual quote delay unknown, not live.",
                              )
                            : t(
                                "報價時效以各標的狀態為準；未驗證資料不視為即時。",
                                "Check each quote status; unverified data is not live.",
                              )}
                        </span>
                        <div className="stock-quotes">
                          {assets
                            .filter((a) => a.category === "stocks")
                            .map((a) => (
                              <div key={a.id}>
                                <strong>{a.symbol}</strong>
                                <span className="mono">{money(a.price)}</span>
                                <StatusBadge status={a.status} lang={lang} />
                                <small>
                                  {a.status === "Demo"
                                    ? t("合成示範", "Synthetic demo")
                                    : `${t("延遲", "Delay")}: ${a.delayMinutes} min`}{" "}
                                  · {taipei(a.asOf, true)} UTC+8
                                </small>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {tab === "gold" && (
                    <div className="market-context">
                      <Compass size={22} />
                      <div>
                        <strong>
                          XAU/USD · {t("現貨參考", "Spot reference")}
                        </strong>
                        <p>
                          {t(
                            "美元指數、10 年實質殖利率、聯準會政策與宏觀事件：皆尚未連接。COMEX GC 為期貨，GLD 為 ETF，並非本頁 XAU/USD 報價。",
                            "Dollar index, 10-year real yields, Fed policy and macro events: not connected. COMEX GC is a futures proxy; GLD is an ETF proxy. Neither is the XAU/USD quote shown here.",
                          )}
                        </p>
                        <External href="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm">
                          {t("聯準會官方會議日曆", "Official FOMC calendar")}
                        </External>
                      </div>
                    </div>
                  )}
                  {tab === "spot" && (
                    <div className="section-heading">
                      <h2>{t("現貨研究清單", "Spot research board")}</h2>
                      <span className="muted small-copy">
                        {t(
                          "流動性門檻與來源需由後端驗證",
                          "Liquidity eligibility must be verified by the backend",
                        )}
                      </span>
                    </div>
                  )}
                  <ResearchGrid
                    key={tab}
                    setups={setups}
                    assets={assets}
                    lang={lang}
                    category={
                      tab as "spot" | "memes" | "futures" | "stocks" | "gold"
                    }
                    watchlist={watchlist}
                    onWatch={toggleWatch}
                    onOpen={setDetail}
                  />
                  {tab === "futures" && (
                    <>
                      <div className="market-context">
                        <Activity size={20} />
                        <div>
                          <strong>
                            {t(
                              "資金費率 + 未平倉量 + 成交量",
                              "Funding + open interest + volume",
                            )}
                          </strong>
                          <p>
                            {t(
                              "尚無已驗證的即時數據。條件未齊備時保持中立；不輸出無條件多空建議。",
                              "No verified current readings. Stay neutral when conditions are incomplete; no unconditional directional calls.",
                            )}
                          </p>
                        </div>
                      </div>
                      <RiskCalculator
                        lang={lang}
                        setups={setups.filter(
                          (s) =>
                            s.category === "futures" &&
                            (s.status === "Demo" || eligible(s, now)),
                        )}
                      />
                    </>
                  )}
                </>
              )}
              {tab === "wallets" && (
                <Wallets
                  lang={lang}
                  wallets={wallets}
                  setWallets={setWallets}
                  notify={setToast}
                  demo={isDemo}
                />
              )}
              {tab === "watchlists" && (
                <Watchlists
                  lang={lang}
                  assets={assets}
                  watchlist={watchlist}
                  onWatch={toggleWatch}
                  alerts={alerts}
                  setAlerts={setAlerts}
                  journal={journal}
                  demo={isDemo}
                  onExplore={() => navigate("spot")}
                  onOpen={openAsset}
                />
              )}
              {tab === "settings" && (
                <SettingsPanel
                  lang={lang}
                  settings={settings}
                  setSettings={setSettings}
                  onConnect={connect}
                  loading={loading}
                  connectionError={connectionError}
                  connected={!!data && !connectionFailed}
                  onDisconnect={() => {
                    controller.current?.abort();
                    setData(null);
                    setConnectionFailed(false);
                    setSettings({ ...settings, backend: "", demo: false });
                    setConnectionError("");
                  }}
                />
              )}
            </>
          )}
          <footer className="footer">
            <ResearchNotice lang={lang} />
            <div>
              <a
                href="https://aimarket.trade/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("靈感來源", "Inspired by")} aimarket.trade{" "}
                <ArrowUpRight size={12} />
              </a>
              <span className="mono">aimarket.si-md.xyz</span>
              <span className="mono">{taipei(now)} TAIPEI</span>
            </div>
          </footer>
        </main>
        <div className="statusbar">
          <span>
            <span className="status-dot" />
            {t("研究，不是預言。", "Research, not prediction.")}
          </span>
          <span>
            IPFS READY <i /> {isDemo ? "DEMO DATA" : "EXTERNAL DATA"} <i />{" "}
            UTC+8
          </span>
        </div>
      </div>
      <div
        className={toast ? "toast" : "sr-only"}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            <CheckIcon />
            <span>{toast}</span>
            <button
              className="icon-button"
              aria-label={t("關閉提示", "Dismiss message")}
              onClick={() => setToast("")}
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>
      {detail && assets.find((a) => a.id === detail.asset) && (
        <SetupDetail
          setup={
            setups.find((s) => s.id === detail.id) ?? {
              ...detail,
              status: "Unavailable",
            }
          }
          asset={assets.find((a) => a.id === detail.asset)!}
          lang={lang}
          onClose={() => setDetail(null)}
          watched={watchlist.includes(detail.asset)}
          onWatch={() => toggleWatch(detail.asset)}
        />
      )}
      {mobileNav && (
        <Modal
          title="AI Market"
          lang={lang}
          onClose={() => setMobileNav(false)}
        >
          <div className="mobile-nav">{navigation}</div>
        </Modal>
      )}
      {method && (
        <Modal
          title={t("有依據的研究方法", "An evidence-led research method")}
          lang={lang}
          onClose={() => setMethod(false)}
          wide
        >
          <div className="method-intro">
            <ShieldCheck size={28} />
            <p>
              {t(
                "先定義規則，再看結果。先知道風險，再談機會。",
                "Define rules before outcomes. Understand risk before opportunity.",
              )}
            </p>
          </div>
          <ol className="method-steps">
            <li>
              <h3>{t("只使用收盤資料", "Use closed candles only")}</h3>
              <p>
                {t(
                  "closed-candle/1.0.0：趨勢回踩使用 EMA20；突破回測等待收盤確認；區間回歸使用 RSI(14)。1H、4H、1D、1W 各自獨立。",
                  "closed-candle/1.0.0: trend pullbacks use EMA20; breakout retests require closing confirmation; range reversion uses RSI(14). 1H, 4H, 1D and 1W are independent.",
                )}
              </p>
            </li>
            <li>
              <h3>{t("規則排序，來源佐證", "Rank rules, verify sources")}</h3>
              <p>
                {t(
                  "趨勢、成交量、流動性、風險報酬、基本面各一分。未知不算通過。沒有虛構勝率。AI 只能解釋已附來源的證據；目前沒有連接 AI 服務。",
                  "Trend, volume, liquidity, reward/risk and fundamentals each contribute one check. Unknowns do not pass. No invented win rates. AI may explain cited evidence only; no AI service is currently connected.",
                )}
              </p>
            </li>
            <li>
              <h3>
                {t("每個想法都有失效條件", "Every idea has an invalidation")}
              </h3>
              <p>
                {t(
                  "保留觸發、研究區間、退出、費用、資料時間與到期時間。Stale、Unavailable、Cached 不顯示可用進出場訊號。",
                  "Keep the trigger, entry zone, exits, costs, data timestamp and expiry. Stale, Unavailable and Cached states suppress actionable levels.",
                )}
              </p>
            </li>
            <li>
              <h3>
                {t(
                  "前瞻記錄，誠實評估",
                  "Log prospectively, evaluate honestly",
                )}
              </h3>
              <p>
                {t(
                  "第一次收到的研究保存原始快照，不回填獲利紀錄。紙上評估需考量成交、成本、樣本數、期望值與回撤。示範紀錄完全分開。",
                  "Save the first received snapshot; never backfill profitable history. Paper evaluation needs fills, costs, sample size, expectancy and drawdown. Demo records are separate.",
                )}
              </p>
            </li>
          </ol>
          <ResearchNotice lang={lang} />
        </Modal>
      )}
    </div>
  );
}
function CheckIcon() {
  return <ShieldCheck size={18} className="positive" />;
}
