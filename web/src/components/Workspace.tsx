import { useState, type FormEvent } from "react";
import {
  Activity,
  Bell,
  Bookmark,
  ChevronRight,
  Download,
  Globe2,
  Info,
  Link2,
  Plus,
  Radio,
  ShieldAlert,
  Trash2,
  Wallet as WalletIcon,
  X,
} from "lucide-react";
import { DEMO_TIME, type Asset, type Lang } from "../data";
import {
  coBuys,
  download,
  money,
  taipei,
  validWallet,
  type Buy,
  type Wallet,
} from "../engine";
import type { AlertRule, JournalEntry, Settings } from "../storage";
import { Empty, External, Modal, StatusBadge, TokenIcon } from "./ui";

export function MemePanel({ lang, demo }: { lang: Lang; demo: boolean }) {
  const [window, setWindow] = useState(15);
  const [min, setMin] = useState(3);
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const now = Date.parse(DEMO_TIME);
  const events: Buy[] = [
    {
      wallet: "demo-wallet-01",
      chain: "Ethereum",
      contract: "demo-pepe",
      timestamp: now - 120000,
      usd: 6200,
    },
    {
      wallet: "demo-wallet-02",
      chain: "Ethereum",
      contract: "demo-pepe",
      timestamp: now - 240000,
      usd: 4100,
      cluster: "demo-related-a",
    },
    {
      wallet: "demo-wallet-03",
      chain: "Ethereum",
      contract: "demo-pepe",
      timestamp: now - 420000,
      usd: 3200,
      cluster: "demo-related-a",
    },
    {
      wallet: "demo-wallet-04",
      chain: "Ethereum",
      contract: "demo-pepe",
      timestamp: now - 660000,
      usd: 2700,
    },
  ];
  const groups = demo ? coBuys(events, now, window, min) : [];
  return (
    <div className="two-column supporting-panels">
      <section className="panel">
        <div className="panel-head">
          <h2>
            <Radio size={17} />
            {t("錢包共買偵測", "Wallet convergence")}
          </h2>
          <span className="tag">
            {demo ? "DEMO" : t("尚未連接", "Not connected")}
          </span>
        </div>
        <div className="padded">
          <p className="muted small-copy">
            {t(
              "以鏈 + 合約分組，重複錢包只計一次；已知關聯群組合併為一個獨立來源。",
              "Group by chain + contract; deduplicate wallets and count known related clusters as one independent source.",
            )}
          </p>
          <div className="form-row">
            <label>
              {t("共買時間窗", "Co-buy window")}
              <select
                value={window}
                onChange={(e) => setWindow(Number(e.target.value))}
              >
                {[5, 15, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} {t("分鐘", "minutes")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("最少獨立來源", "Min. independent sources")}
              <select
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
              >
                {[2, 3, 4].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <div aria-live="polite">
            {groups.length ? (
              groups.map((g) => (
                <div className="convergence" key={g.identity}>
                  <div>
                    <span className="positive mono">PEPE · DEMO</span>
                    <span>
                      {g.distinct} {t("錢包", "wallets")} / {g.independent}{" "}
                      {t("獨立來源", "independent")}
                    </span>
                  </div>
                  <strong className="mono">+{money(g.grossBuyUsd)}</strong>
                  <p className="warning-text">
                    <Link2 size={14} />
                    {t(
                      "W02 與 W03 為同一示範群組。",
                      "W02 and W03 share a demo cluster.",
                    )}
                  </p>
                  <small>
                    {t(
                      "僅買入事件總額；不是淨買入，需另外扣除賣出。",
                      "Gross buys only; net buying requires subtracting sells.",
                    )}
                  </small>
                </div>
              ))
            ) : (
              <div className="inline-empty">
                {t(
                  "目前門檻沒有符合群組。",
                  "No groups meet these thresholds.",
                )}
              </div>
            )}
          </div>
          <p className="small-copy muted">
            {t(
              "GMGN / FOMO 未授權、未連接。無背景抓取。",
              "GMGN / FOMO are not authorized or connected. No background scraping.",
            )}
          </p>
        </div>
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>
            <ShieldAlert size={17} />
            {t("代幣風險檢查", "Token risk checks")}
          </h2>
          <span className="badge critical">
            {t("不可執行", "Not actionable")}
          </span>
        </div>
        <div className="padded">
          <dl className="risk-list">
            {[
              [
                t("合約與 CEX 上架", "Contract & CEX listing"),
                t("未驗證", "Unverified"),
              ],
              [
                t("流動性與 LP 鎖定", "Liquidity & LP lock"),
                t("未知", "Unknown"),
              ],
              [t("持有人集中度", "Holder concentration"), t("未知", "Unknown")],
              [t("部署者活動", "Deployer activity"), t("未知", "Unknown")],
              [
                t("賣出限制 / 稅", "Sell restrictions / tax"),
                t("重大風險 · 未知", "Critical · unknown"),
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd className="warning-text">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="small-copy muted">
            {t(
              "共買不是安全證明。資料缺失一律保留未知，不給予安全標章。",
              "Co-buying is not proof of safety. Missing data stays unknown and never earns a safety badge.",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}

export function Wallets({
  lang,
  wallets,
  setWallets,
  notify,
  demo,
}: {
  lang: Lang;
  wallets: Wallet[];
  setWallets: (w: Wallet[]) => void;
  notify: (m: string) => void;
  demo: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [chain, setChain] = useState<Wallet["chain"]>("Ethereum");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  function submit(e: FormEvent) {
    e.preventDefault();
    const value = address.trim();
    if (!validWallet(chain, value)) {
      setError(
        t(
          "輸入有效的公開地址：EVM 為 0x 加 40 位十六進位；Solana 為 32-byte Base58。",
          "Enter a valid public address: EVM uses 0x + 40 hex digits; Solana uses 32-byte Base58.",
        ),
      );
      document.getElementById("wallet-address")?.focus();
      return;
    }
    const normalized = chain === "Solana" ? value : value.toLowerCase();
    if (
      wallets.some(
        (w) =>
          w.chain === chain &&
          (chain === "Solana" ? w.address : w.address.toLowerCase()) ===
            normalized,
      )
    ) {
      setError(
        t(
          "這個鏈上的地址已在清單中。",
          "This address is already imported on this chain.",
        ),
      );
      return;
    }
    setWallets([
      ...wallets,
      {
        id: crypto.randomUUID(),
        chain,
        address: value,
        label: label.trim() || t("未命名錢包", "Unnamed wallet"),
      },
    ]);
    setAdding(false);
    setAddress("");
    setLabel("");
    setError("");
    notify(
      t(
        "已匯入公開地址。鏈上分析尚未連接。",
        "Public address imported. On-chain analysis is not connected.",
      ),
    );
  }
  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>
            {t("公開錢包", "Public wallets")}{" "}
            <span className="count">{wallets.length}</span>
          </h2>
          <button className="button primary" onClick={() => setAdding(true)}>
            <Plus size={16} />
            {t("匯入錢包", "Import wallet")}
          </button>
        </div>
        {!wallets.length ? (
          <Empty
            title={t("開始建立你的研究名單", "Build your research list")}
            text={t(
              "匯入 Ethereum、Base 或 Solana 的公開地址。無需連接錢包，不需要私鑰。",
              "Import a public Ethereum, Base or Solana address. No wallet connection or private key needed.",
            )}
          />
        ) : (
          <div className="wallet-list">
            {wallets.map((w) => (
              <article key={w.id}>
                <WalletIcon size={20} />
                <div>
                  <strong>{w.label}</strong>
                  <span>{w.chain}</span>
                  <code>{w.address}</code>
                  <p>
                    {t(
                      "分析資料尚未連接 · 已實現報酬、成本、回撤與淨買入均未知",
                      "Analysis not connected · realized returns, costs, drawdown and net buying unknown",
                    )}
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label={`${t("移除錢包", "Remove wallet")} ${w.label}`}
                  onClick={() => {
                    if (
                      confirm(
                        t(
                          `移除「${w.label}」？僅刪除本機研究清單。`,
                          `Remove “${w.label}” from this device’s research list?`,
                        ),
                      )
                    )
                      setWallets(wallets.filter((x) => x.id !== w.id));
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        )}
        <div className="panel-foot">
          {t(
            "地址只儲存在此瀏覽器，不會自動傳送到後端。",
            "Addresses stay in this browser and are not automatically sent to a backend.",
          )}
        </div>
      </section>
      {demo && (
        <section className="panel wallet-demo">
          <div className="panel-head">
            <h2>{t("如何評估一個錢包", "How to assess a wallet")}</h2>
            <StatusBadge status="Demo" lang={lang} />
          </div>
          <div className="padded">
            <p className="muted">
              {t(
                "以下為虛構 W01 的示範樣本，不代表任何真實地址或過往績效。",
                "A fictional sample for W01; not a real address or historical performance claim.",
              )}
            </p>
            <div className="metric-grid">
              {[
                [t("已實現淨報酬", "Realized net P&L"), "+$1,240"],
                [t("已平倉樣本", "Closed sample"), "24"],
                [t("費用 + 滑價", "Fees + slippage"), "$186"],
                [t("每筆淨期望值", "Net expectancy / trade"), "$51.67"],
                [t("最大回撤", "Maximum drawdown"), "−18.4%"],
                [t("買入 − 賣出", "Buys − sells"), "+$2,060"],
              ].map(([k, v]) => (
                <div key={k}>
                  <span>{k}</span>
                  <strong className="mono">{v}</strong>
                </div>
              ))}
            </div>
            <p className="small-copy muted">
              {t(
                "期望值 = 已實現淨損益 / 完整平倉樣本；回撤以逐筆淨值曲線計算。小樣本、存活者偏差與未知關聯會限制解讀。",
                "Expectancy = realized net P&L / fully closed sample. Drawdown uses the equity curve. Small samples, survivorship bias and unknown relationships limit interpretation.",
              )}
            </p>
          </div>
        </section>
      )}
      <MemePanel lang={lang} demo={demo} />
      {adding && (
        <Modal
          title={t("匯入公開錢包", "Import a public wallet")}
          onClose={() => setAdding(false)}
          lang={lang}
        >
          <form onSubmit={submit} className="stack-form">
            <label htmlFor="wallet-chain">{t("區塊鏈", "Chain")}</label>
            <select
              id="wallet-chain"
              value={chain}
              onChange={(e) => {
                setChain(e.target.value as Wallet["chain"]);
                setError("");
              }}
            >
              <option>Ethereum</option>
              <option>Base</option>
              <option>Solana</option>
            </select>
            <label htmlFor="wallet-label">
              {t("研究名稱（選填）", "Research label (optional)")}
            </label>
            <input
              id="wallet-label"
              value={label}
              maxLength={40}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("例如：長期觀察", "e.g. Long-term watch")}
            />
            <label htmlFor="wallet-address">
              {t("公開地址", "Public address")}
            </label>
            <input
              id="wallet-address"
              autoComplete="off"
              spellCheck={false}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "wallet-error" : "wallet-hint"}
              placeholder={chain === "Solana" ? "Base58 public address" : "0x…"}
            />
            <p id="wallet-hint" className="small-copy muted">
              {t(
                "只接受公開地址。請勿輸入助記詞或私鑰。",
                "Public addresses only. Never enter a seed phrase or private key.",
              )}
            </p>
            {error && (
              <p id="wallet-error" role="alert" className="error">
                {error}
              </p>
            )}
            <button type="submit" className="button primary">
              <Plus size={16} />
              {t("匯入錢包", "Import wallet")}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

export function Watchlists({
  lang,
  assets,
  watchlist,
  onWatch,
  alerts,
  setAlerts,
  journal,
  demo,
  onExplore,
  onOpen,
}: {
  lang: Lang;
  assets: Asset[];
  watchlist: string[];
  onWatch: (id: string) => void;
  alerts: AlertRule[];
  setAlerts: (a: AlertRule[]) => void;
  journal: JournalEntry[];
  demo: boolean;
  onExplore: () => void;
  onOpen: (id: string) => void;
}) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [creating, setCreating] = useState(false);
  const [asset, setAsset] = useState(assets[0]?.id ?? "");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [threshold, setThreshold] = useState("");
  const [error, setError] = useState("");
  const rows = watchlist
    .map((id) => assets.find((a) => a.id === id))
    .filter((a): a is Asset => !!a);
  function create(e: FormEvent) {
    e.preventDefault();
    const num = Number(threshold);
    if (
      !asset ||
      !assets.some((a) => a.id === asset) ||
      !Number.isFinite(num) ||
      num <= 0
    ) {
      setError(
        t(
          "選擇標的，並輸入大於零的 USD 價格。",
          "Choose an asset and enter a USD price greater than zero.",
        ),
      );
      document.getElementById("alert-threshold")?.focus();
      return;
    }
    setAlerts([
      ...alerts,
      {
        id: crypto.randomUUID(),
        asset,
        direction,
        threshold: num,
        createdAt: new Date().toISOString(),
        demo,
      },
    ]);
    setCreating(false);
    setThreshold("");
    setError("");
  }
  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>
            <Bookmark size={17} />
            {t("觀察清單", "Watchlist")}{" "}
            <span className="count">{rows.length}</span>
          </h2>
          <button className="text-button" onClick={onExplore}>
            {t("探索標的", "Explore assets")}
            <ChevronRight size={15} />
          </button>
        </div>
        {!rows.length ? (
          <Empty
            title={t(
              "留下一個值得研究的想法",
              "Save an idea worth researching",
            )}
            text={t(
              "在研究卡片按下書籤，即可加入觀察清單。",
              "Use the bookmark on any research card to add its asset here.",
            )}
            action={
              <button className="button" onClick={onExplore}>
                {t("探索研究", "Explore research")}
              </button>
            }
          />
        ) : (
          <div className="watch-rows">
            {rows.map((a) => (
              <div className="watch-row" key={a.id}>
                <TokenIcon asset={a} />
                <button className="asset-link" onClick={() => onOpen(a.id)}>
                  <strong>{a.symbol}</strong>
                  <span>{a.name}</span>
                </button>
                <div className="watch-price">
                  <strong className="mono">{money(a.price)}</strong>
                  <span className={a.change < 0 ? "negative" : "positive"}>
                    {a.change >= 0 ? "+" : ""}
                    {a.change}%
                  </span>
                </div>
                <StatusBadge status={a.status} lang={lang} />
                <button
                  className="icon-button"
                  aria-label={`${t("移除觀察", "Unwatch")} ${a.symbol}`}
                  onClick={() => onWatch(a.id)}
                >
                  <X size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="panel-foot">
          {t("本機儲存 · 不跨裝置同步", "Local storage · No cross-device sync")}
          {watchlist.length > rows.length && (
            <span>
              {t(
                "部分已存標的目前沒有報價。",
                "Some saved assets have no current quote.",
              )}
            </span>
          )}
        </div>
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>
            <Bell size={17} />
            {t("條件提醒", "Conditional alerts")}
          </h2>
          <button
            className="button"
            onClick={() => {
              setAsset(assets[0]?.id ?? "");
              setCreating(true);
            }}
          >
            <Plus size={16} />
            {t("建立提醒", "Create alert")}
          </button>
        </div>
        <div className="inline-note inset">
          <Info size={17} />
          <p>
            {t(
              "提醒儲存為本機草稿。排程掃描與通知派送需要外部後端，目前不會寄送提醒。",
              "Alerts are local drafts. Scheduled scans and notification delivery require an external backend. No alerts are being sent.",
            )}
          </p>
        </div>
        {alerts.length ? (
          <div className="alert-list">
            {alerts.map((a) => (
              <div key={a.id}>
                <Bell size={18} />
                <div>
                  <strong>
                    {assets.find((x) => x.id === a.asset)?.symbol ??
                      a.asset.toUpperCase()}{" "}
                    {a.direction === "above" ? ">" : "<"} {money(a.threshold)}
                  </strong>
                  <p>
                    {a.demo ? "DEMO · " : ""}
                    {t("草稿 · 未啟用派送", "Draft · delivery inactive")}
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label={t("刪除提醒草稿", "Delete alert draft")}
                  onClick={() => setAlerts(alerts.filter((x) => x.id !== a.id))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="inline-empty">
            {t(
              "尚未建立提醒。選擇價格條件，保存研究草稿。",
              "No alerts yet. Set a price condition to save a research draft.",
            )}
          </p>
        )}
        {alerts.length > 0 && (
          <div className="padded">
            <button
              className="button"
              onClick={() =>
                download(
                  "aimarket-alert-drafts.json",
                  JSON.stringify(
                    { version: 1, delivery: "inactive", alerts },
                    null,
                    2,
                  ),
                )
              }
            >
              <Download size={16} />
              {t("匯出提醒草稿", "Export alert drafts")}
            </button>
          </div>
        )}
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>
            <Activity size={17} />
            {t("前瞻紙上評估日誌", "Prospective paper journal")}{" "}
            <span className="count">{journal.length}</span>
          </h2>
          <button
            className="button"
            onClick={() =>
              download(
                "aimarket-paper-journal.json",
                JSON.stringify(
                  {
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    timezone: "Asia/Taipei",
                    entries: journal,
                  },
                  null,
                  2,
                ),
              )
            }
          >
            <Download size={16} />
            {t("匯出日誌", "Export journal")}
          </button>
        </div>
        <div className="padded">
          <p className="muted">
            {t(
              "第一次收到有效研究時保留當下快照，依訊號 ID + 資料時間去重。示範紀錄與真實模式分開標示，不回填績效。",
              "Snapshots are captured on first receipt and deduplicated by signal ID + data time. Demo records are labeled separately; performance is never backfilled.",
            )}
          </p>
          <p className="small-copy muted">
            {t(
              "本機日誌可被修改且只在頁面開啟時運作；完整不可變日誌、成交模擬與後續績效評估需後端。所有結果目前待評估。",
              "Local records are editable and only run while the page is open. Immutable logging, fill simulation and outcome evaluation require a backend. All outcomes remain pending.",
            )}
          </p>
          {journal
            .slice(-5)
            .reverse()
            .map((j) => (
              <div className="journal-row" key={j.key}>
                <span className="mono">{j.setup.asset.toUpperCase()}</span>
                <span>{j.setup.strategy[lang]}</span>
                <span className="tag">{j.mode}</span>
                <time>{taipei(j.observedAt, true)} UTC+8</time>
                <span className="muted">{t("待評估", "Pending")}</span>
              </div>
            ))}
        </div>
      </section>
      {creating && (
        <Modal
          title={t("建立價格提醒", "Create a price alert")}
          lang={lang}
          onClose={() => setCreating(false)}
        >
          <form className="stack-form" onSubmit={create}>
            <label htmlFor="alert-asset">{t("標的", "Asset")}</label>
            <select
              id="alert-asset"
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
            >
              {assets.map((a) => (
                <option value={a.id} key={a.id}>
                  {a.symbol}
                </option>
              ))}
            </select>
            <label htmlFor="alert-direction">{t("條件", "Condition")}</label>
            <select
              id="alert-direction"
              value={direction}
              onChange={(e) =>
                setDirection(e.target.value as "above" | "below")
              }
            >
              <option value="above">{t("價格高於", "Price above")}</option>
              <option value="below">{t("價格低於", "Price below")}</option>
            </select>
            <label htmlFor="alert-threshold">
              {t("價格（USD）", "Price (USD)")}
            </label>
            <input
              id="alert-threshold"
              type="number"
              step="any"
              min="0.000000001"
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value);
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "alert-error" : undefined}
            />
            {error && (
              <p role="alert" id="alert-error" className="error">
                {error}
              </p>
            )}
            <p className="small-copy muted">
              {t(
                "這會保存未啟用的本機草稿，不會送出通知。",
                "This saves an inactive local draft. No notification will be sent.",
              )}
            </p>
            <button className="button primary" type="submit">
              {t("儲存提醒草稿", "Save alert draft")}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

export function SettingsPanel({
  lang,
  settings,
  setSettings,
  onConnect,
  loading,
  connectionError,
  connected,
  onDisconnect,
}: {
  lang: Lang;
  settings: Settings;
  setSettings: (s: Settings) => void;
  onConnect: (url: string) => void;
  loading: boolean;
  connectionError: string;
  connected: boolean;
  onDisconnect: () => void;
}) {
  const [url, setUrl] = useState(settings.backend);
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  return (
    <div className="settings-grid">
      <section className="panel">
        <div className="panel-head">
          <h2>
            <Globe2 size={18} />
            {t("資料後端", "Data backend")}
          </h2>
          <span
            className={`badge ${connected ? "status-live" : "status-delayed"}`}
          >
            {connected
              ? t("已連接", "Connected")
              : t("需要設定", "Setup required")}
          </span>
        </div>
        <form
          className="padded stack-form"
          onSubmit={(e) => {
            e.preventDefault();
            onConnect(url);
          }}
        >
          <p className="muted">
            {t(
              "IPFS 前端只顯示資料。行情、API 憑證、計算、儲存與提醒由你的 HTTPS 後端負責。",
              "The IPFS frontend presents data. Your HTTPS backend owns feeds, API credentials, calculations, storage and alerts.",
            )}
          </p>
          <label htmlFor="backend-url">
            {t("HTTPS 後端網址", "HTTPS backend URL")}
          </label>
          <input
            id="backend-url"
            type="url"
            placeholder="https://your-backend.example"
            autoComplete="off"
            spellCheck={false}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-invalid={!!connectionError}
            aria-describedby={
              connectionError ? "backend-error" : "backend-help"
            }
          />
          <p id="backend-help" className="small-copy muted">
            {t(
              "不要加入 API 密鑰、使用者密碼或查詢參數。後端需允許本站的 CORS 來源。",
              "Do not include API keys, credentials or query parameters. The backend must allow this site’s CORS origin.",
            )}
          </p>
          {connectionError && (
            <p id="backend-error" className="error" role="alert">
              {connectionError}
            </p>
          )}
          <div className="button-row">
            <button type="submit" className="button primary" disabled={loading}>
              <Link2 size={16} />
              {loading
                ? t("連線中…", "Connecting…")
                : t("連接並驗證", "Connect & validate")}
            </button>
            {connected && (
              <button type="button" className="button" onClick={onDisconnect}>
                {t("中斷連線", "Disconnect")}
              </button>
            )}
          </div>
          <p className="small-copy muted">
            {t(
              "連接時會向 /v1/snapshot 取得資料並驗證格式；不會自動輪詢或上傳本機錢包。",
              "Connection requests /v1/snapshot and validates the response. No automatic polling or wallet uploads.",
            )}
          </p>
        </form>
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>{t("顯示偏好", "Display preferences")}</h2>
        </div>
        <div className="padded">
          <label className="toggle-row">
            <span>
              <strong>{t("顯示示範資料", "Show demo data")}</strong>
              <small>
                {t(
                  "合成市場快照；不代表真實行情。",
                  "Synthetic snapshots; not actual market data.",
                )}
              </small>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={settings.demo}
              onChange={(e) =>
                setSettings({ ...settings, demo: e.target.checked })
              }
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>
                {t("播放終端背景動態", "Animate terminal background")}
              </strong>
              <small>
                {t(
                  "尊重系統的減少動態效果設定。",
                  "Respects the system’s reduced-motion preference.",
                )}
              </small>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={settings.motion}
              onChange={(e) =>
                setSettings({ ...settings, motion: e.target.checked })
              }
            />
          </label>
          <div className="setting-line">
            <span>{t("時區", "Timezone")}</span>
            <span className="mono">Asia/Taipei · UTC+8</span>
          </div>
          <div className="setting-line">
            <span>{t("規則版本", "Rules version")}</span>
            <span className="mono">1.0.0</span>
          </div>
          <div className="setting-line">
            <span>{t("資料儲存", "Storage")}</span>
            <span>{t("此瀏覽器", "This browser")}</span>
          </div>
        </div>
      </section>
      <section className="panel full-width">
        <div className="panel-head">
          <h2>{t("供應商與存取狀態", "Providers & access status")}</h2>
          <span className="tag">
            {t("未預先授權", "No pre-authorized feeds")}
          </span>
        </div>
        <div className="provider-list">
          {[
            [
              "CEX market data",
              "https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints",
              t(
                "行情、成交量與收盤 K 線；需確認區域限制與再散布條款。",
                "Quotes, volume and closed candles; review regional restrictions and redistribution terms.",
              ),
            ],
            [
              "DEX Screener",
              "https://docs.dexscreener.com/api/reference",
              t(
                "公開 API 文件已確認；未連接行情，非安全檢測服務。",
                "Public API documentation verified; no feed connected; not a security screening service.",
              ),
            ],
            [
              "GMGN / FOMO",
              "https://gmgn.ai/",
              t(
                "未連接、未授權；FOMO 未指定產品，不假定存在可用 API。",
                "Not connected or authorized; FOMO product unspecified, so no available API is assumed.",
              ),
            ],
            [
              "SEC EDGAR",
              "https://www.sec.gov/search-filings/edgar-application-programming-interfaces",
              t(
                "官方申報 API；後端須遵守 fair-access 限制與 User-Agent 規範。",
                "Official filings API; backend must follow fair-access and User-Agent requirements.",
              ),
            ],
            [
              "FRED / Federal Reserve",
              "https://fred.stlouisfed.org/series/DFII10",
              t(
                "宏觀原始來源；自動化 API 存取與資料授權需另行設定。",
                "Primary macro sources; automated API access and data permissions need separate configuration.",
              ),
            ],
          ].map(([name, href, desc]) => (
            <div key={name}>
              <div>
                <External href={href}>{name}</External>
                <p>{desc}</p>
              </div>
              <span className="badge status-unavailable">
                {t("未連接", "Not connected")}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
