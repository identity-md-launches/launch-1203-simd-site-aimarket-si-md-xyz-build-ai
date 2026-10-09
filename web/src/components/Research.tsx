import { useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Clock3,
  Filter,
  Info,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { type Asset, type Lang, type Setup, type Category } from "../data";
import {
  effectiveStatus,
  money,
  rewardRisk,
  sizePosition,
  taipei,
} from "../engine";
import { Empty, External, Modal, StatusBadge, TokenIcon } from "./ui";

export function SetupCard({
  setup,
  asset,
  lang,
  watched,
  onWatch,
  onOpen,
}: {
  setup: Setup;
  asset: Asset;
  lang: Lang;
  watched: boolean;
  onWatch: () => void;
  onOpen: () => void;
}) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const count = setup.factors.filter((f) => f.passed).length;
  const status = effectiveStatus(setup.status, setup.asOf, setup.expiresAt);
  const unavailable =
    ["Stale", "Unavailable", "Cached"].includes(status) ||
    setup.direction === "neutral";
  return (
    <article className="setup-card">
      <div className="setup-top">
        <div className="asset-name">
          <TokenIcon asset={asset} small />
          <div>
            <h3>
              {asset.symbol}
              <span className="pair"> / USD</span>
            </h3>
            <p>{setup.strategy[lang]}</p>
          </div>
        </div>
        <button
          className={`icon-button bookmark ${watched ? "saved" : ""}`}
          aria-label={`${watched ? t("移除觀察", "Unwatch") : t("加入觀察", "Watch")} ${asset.symbol}`}
          aria-pressed={watched}
          onClick={onWatch}
        >
          <Bookmark size={17} fill={watched ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="setup-tags">
        <span className={`direction ${setup.direction}`}>
          {setup.direction === "long"
            ? "↗ " + t("條件偏多", "Conditional long")
            : setup.direction === "short"
              ? "↘ " + t("條件偏空", "Conditional short")
              : "— " + t("中立觀察", "Neutral watch")}
        </span>
        <span className="tag mono">{setup.timeframe}</span>
        <StatusBadge status={status} lang={lang} />
      </div>
      {unavailable ? (
        <p className="suppressed">
          <ShieldAlert size={16} />
          {t(
            "尚無可用條件，或風險未排除。進出場價格已隱藏。",
            "No eligible setup, or risks remain unresolved. Trade levels are hidden.",
          )}
        </p>
      ) : (
        <div className="setup-levels">
          <div>
            <span>{t("研究區間", "Entry zone")}</span>
            <strong className="mono">
              {money(setup.entry[0])} – {money(setup.entry[1])}
            </strong>
          </div>
          <div className="level-pair">
            <div>
              <span>{t("失效參考", "Invalidation")}</span>
              <b className="mono">{money(setup.stop)}</b>
            </div>
            <div>
              <span>{t("扣成本後 R/R", "Net reward / risk")}</span>
              <b className="mono positive">
                {rewardRisk(setup).toFixed(2)} <small>: 1</small>
              </b>
            </div>
          </div>
        </div>
      )}
      <div className="setup-bottom">
        <span className="condition-score">
          <span className="score-bars">
            {setup.factors.map((f, i) => (
              <i key={i} className={f.passed ? "passed" : ""} />
            ))}
          </span>
          {count}/5 {t("條件", "checks")}
        </span>
        <button className="text-button" onClick={onOpen}>
          {t("查看研究", "View research")}
          <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}
export function SetupDetail({
  setup,
  asset,
  lang,
  onClose,
  watched,
  onWatch,
}: {
  setup: Setup;
  asset: Asset;
  lang: Lang;
  onClose: () => void;
  watched: boolean;
  onWatch: () => void;
}) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const status = effectiveStatus(setup.status, setup.asOf, setup.expiresAt);
  const suppressed =
    ["Stale", "Unavailable", "Cached"].includes(status) ||
    setup.direction === "neutral";
  return (
    <Modal
      title={`${asset.symbol} · ${setup.strategy[lang]}`}
      onClose={onClose}
      lang={lang}
      wide
    >
      <div className="detail-meta">
        <StatusBadge status={status} lang={lang} />
        <span className="tag">{setup.timeframe}</span>
        <span className="mono">{setup.ruleVersion}</span>
      </div>
      <div className="inline-note">
        <Info size={17} />
        <p>
          {setup.status === "Demo"
            ? t(
                "以下價格、條件與排名均為合成示範。來源連結用於了解資料與方法，不代表已驗證此研究。",
                "Prices, conditions and rankings below are synthetic examples. Source links explain data and methods; they do not verify this example.",
              )
            : t(
                "研究條件不代表成交指令或獲利機率。依收盤資料驗證，不使用未完成 K 線。",
                "Research conditions are not orders or win probabilities. Verify against closed candles only.",
              )}
        </p>
      </div>
      <h3>{t("研究解讀", "Research interpretation")}</h3>
      <p className="body-copy">{setup.thesis[lang]}</p>
      <p className="muted small-copy">
        {t(
          "示範解讀為人工撰寫；AI 證據摘要服務尚未連接。",
          "Demo explanations are editorial; an AI evidence-summary service is not connected.",
        )}
      </p>
      {suppressed ? (
        <div className="warning">
          <ShieldAlert size={20} />
          <p>
            {t(
              "目前為中立觀察，或資料已過期、無法取得、僅為快取。觸發與進出場價格已隱藏，需重新取得有效且完成風險驗證的研究。",
              "Neutral watch, stale, cached or unavailable data: triggers and trade levels are hidden. Refresh a valid, risk-verified setup to continue.",
            )}
          </p>
        </div>
      ) : (
        <>
          <h3>{t("觸發條件", "Closed-candle trigger")}</h3>
          <p className="body-copy">{setup.trigger[lang]}</p>
          <dl className="detail-grid">
            <div>
              <dt>{t("進場研究區間", "Entry research zone")}</dt>
              <dd>
                {money(setup.entry[0])} – {money(setup.entry[1])}
              </dd>
            </div>
            <div>
              <dt>{t("停損 / 失效", "Stop / invalidation")}</dt>
              <dd>{money(setup.stop)}</dd>
            </div>
            <div>
              <dt>{t("第一 / 第二退出目標", "Exit target 1 / 2")}</dt>
              <dd>
                {money(setup.targets[0])} / {money(setup.targets[1])}
              </dd>
            </div>
            <div>
              <dt>{t("淨風險報酬比", "Net reward / risk")}</dt>
              <dd className="positive">{rewardRisk(setup).toFixed(2)} : 1</dd>
            </div>
          </dl>
          <p className="small-copy muted">
            {t(
              "以區間中點與第一退出目標計算，往返費用與滑價假設",
              "Based on entry midpoint and first exit; assumed round-trip fees and slippage",
            )}
            : {setup.costBps} bps.{" "}
            {t(
              "期貨另需估算持倉期間資金費率；跳空未納入。",
              "Futures also require holding-period funding costs; gaps are excluded.",
            )}
          </p>
        </>
      )}
      <div className="warning">
        <ShieldAlert size={18} />
        <p>{setup.risk[lang]}</p>
      </div>
      <h3>{t("為什麼出現在排名中？", "Why this ranking?")}</h3>
      <p className="small-copy muted">
        {t(
          "每個通過條件各得一分，依總分排序。同分依代號排序。分數不是勝率；基本面未知不算通過。",
          "One point per passed check; sorted by total, then symbol. Scores are not win probabilities. Unknown fundamentals do not pass.",
        )}
      </p>
      <ul className="check-list">
        {setup.factors.map((f, i) => (
          <li key={i}>
            {f.passed ? (
              <Check className="positive" size={17} />
            ) : (
              <Info className="warning-text" size={17} />
            )}
            <span>{f.label[lang]}</span>
            <span className={f.passed ? "positive" : "muted"}>
              {f.passed
                ? setup.status === "Demo"
                  ? t("範例通過", "Demo pass")
                  : t("通過", "Passed")
                : t("未驗證", "Unverified")}
            </span>
          </li>
        ))}
      </ul>
      <h3>{t("來源與證據", "Sources & evidence")}</h3>
      <div className="source-list">
        {setup.sources.map((src) => (
          <div key={src.url}>
            <External href={src.url}>{src.name}</External>
            <p>{src.note[lang]}</p>
          </div>
        ))}
      </div>
      <div className="detail-times">
        <span>
          <Clock3 size={14} />
          {t("資料時間", "Data time")}: {taipei(setup.asOf, true)} UTC+8
        </span>
        <span>
          {t("有效至", "Expires")}: {taipei(setup.expiresAt, true)} UTC+8
        </span>
      </div>
      <button className="button primary" onClick={onWatch}>
        <Bookmark size={17} />
        {watched
          ? t("移出觀察清單", "Remove from watchlist")
          : t("加入觀察清單", "Add to watchlist")}
      </button>
    </Modal>
  );
}
export function ResearchGrid({
  setups,
  assets,
  lang,
  category,
  watchlist,
  onWatch,
  onOpen,
  compact = false,
}: {
  setups: Setup[];
  assets: Asset[];
  lang: Lang;
  category?: Category;
  watchlist: string[];
  onWatch: (id: string) => void;
  onOpen: (s: Setup) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState("all");
  const [frame, setFrame] = useState("all");
  const [horizon, setHorizon] = useState("short");
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const rows = setups
    .filter(
      (s) =>
        (!category || s.category === category) &&
        (direction === "all" || s.direction === direction) &&
        (frame === "all" || s.timeframe === frame) &&
        `${assets.find((a) => a.id === s.asset)?.symbol} ${s.strategy.zh} ${s.strategy.en}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        b.factors.filter((f) => f.passed).length -
          a.factors.filter((f) => f.passed).length ||
        (
          assets.find((asset) => asset.id === a.asset)?.symbol ?? a.asset
        ).localeCompare(
          assets.find((asset) => asset.id === b.asset)?.symbol ?? b.asset,
        ),
    );
  return (
    <section className="research-grid-section">
      {!compact && (
        <div className="filter-bar">
          <div className="input-icon">
            <Search size={16} />
            <input
              aria-label={t(
                "搜尋研究標的或策略",
                "Search research asset or strategy",
              )}
              type="search"
              placeholder={t("搜尋代號或策略…", "Search symbol or strategy…")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label>
            <Filter size={15} />
            <span className="sr-only">{t("方向", "Direction")}</span>
            <select
              aria-label={t("方向", "Direction")}
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="all">{t("所有方向", "All directions")}</option>
              <option value="long">{t("偏多", "Long")}</option>
              <option value="short">{t("偏空", "Short")}</option>
              <option value="neutral">{t("中立", "Neutral")}</option>
            </select>
          </label>
          <label>
            <SlidersHorizontal size={15} />
            <span className="sr-only">{t("時間週期", "Timeframe")}</span>
            <select
              aria-label={t("時間週期", "Timeframe")}
              value={frame}
              onChange={(e) => setFrame(e.target.value)}
            >
              <option value="all">{t("所有週期", "All timeframes")}</option>
              {["1H", "4H", "1D", "1W"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      {category === "spot" && (
        <>
          <div className="inline-tabs">
            <button
              aria-pressed={horizon === "short"}
              onClick={() => setHorizon("short")}
            >
              {t("短期策略", "Short-term setups")}
            </button>
            <button
              aria-pressed={horizon === "long"}
              onClick={() => setHorizon("long")}
            >
              {t("長期累積研究", "Accumulation research")}
            </button>
          </div>
          {horizon === "long" && (
            <div className="panel accumulation">
              <h3>
                {t(
                  "先驗證價值，再規劃累積",
                  "Verify value before accumulation",
                )}
              </h3>
              <p>
                {t(
                  "採用成長、協議收入、流通 / 完全稀釋估值、通膨、未來解鎖與治理風險，都須附日期與原始來源。尚未連接基本面資料，因此不提供累積建議。",
                  "Adoption, protocol revenue, circulating / fully diluted valuation, inflation, future unlocks and governance risk need dated primary sources. Fundamental feeds are not connected, so no accumulation recommendation is published.",
                )}
              </p>
              <External href="https://ethereum.org/en/whitepaper/">
                Ethereum · Whitepaper
              </External>
              <External href="https://solana.com/docs">
                Solana · Documentation
              </External>
            </div>
          )}
        </>
      )}
      {!(category === "spot" && horizon === "long") && (
        <>
          <div className="result-count" role="status">
            {t("符合條件的研究", "Matching research")}:{" "}
            {compact ? Math.min(3, rows.length) : rows.length}
            <span>
              {t(
                "依已通過條件排序 · 非獲利機率",
                "Ranked by passed checks · not win probability",
              )}
            </span>
          </div>
          <div className="setup-grid">
            {(compact ? rows.slice(0, 3) : rows).map((s) => {
              const a = assets.find((a) => a.id === s.asset);
              return a ? (
                <SetupCard
                  key={s.id}
                  setup={s}
                  asset={a}
                  lang={lang}
                  watched={watchlist.includes(a.id)}
                  onWatch={() => onWatch(a.id)}
                  onOpen={() => onOpen(s)}
                />
              ) : null;
            })}
          </div>
          {rows.length === 0 && (
            <Empty
              title={t("沒有符合的研究", "No matching research")}
              text={t(
                "調整搜尋或篩選條件，或先連接資料後端。",
                "Adjust your search and filters, or connect a data backend.",
              )}
              action={
                <button
                  className="button"
                  onClick={() => {
                    setQuery("");
                    setDirection("all");
                    setFrame("all");
                  }}
                >
                  {t("清除篩選", "Clear filters")}
                </button>
              }
            />
          )}
        </>
      )}
    </section>
  );
}
export function RiskCalculator({
  lang,
  setups,
}: {
  lang: Lang;
  setups: Setup[];
}) {
  const [capital, setCapital] = useState("10000");
  const [risk, setRisk] = useState("1");
  const [id, setId] = useState(setups[0]?.id ?? "");
  const s = setups.find((s) => s.id === id) ?? setups[0];
  const result = s && sizePosition(s, Number(capital), Number(risk));
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  return (
    <section className="panel risk-calculator">
      <div className="panel-head">
        <h2>{t("風險部位計算", "Position risk calculator")}</h2>
        <span className="tag">{t("僅試算", "Estimate only")}</span>
      </div>
      <div className="calculator-grid">
        <label>
          {t("研究標的", "Research setup")}
          <select value={s?.id ?? ""} onChange={(e) => setId(e.target.value)}>
            {setups.map((s) => (
              <option key={s.id} value={s.id}>
                {s.asset.toUpperCase()} · {s.direction}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("研究本金（USD）", "Research capital (USD)")}
          <input
            type="number"
            min="1"
            step="100"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
          />
        </label>
        <label>
          {t("每筆最大風險（%）", "Risk per idea (%)")}
          <input
            type="number"
            min="0.01"
            max="5"
            step="0.1"
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            aria-invalid={!result}
          />
        </label>
        <div className="risk-result" aria-live="polite">
          <span>{t("風險預算 / 名目部位", "Risk budget / notional")}</span>
          <strong>
            {result
              ? `${money(result.budget)} / ${money(result.notional)}`
              : "—"}
          </strong>
          <small>
            {result
              ? `${result.units.toFixed(5)} ${s.asset.toUpperCase()}`
              : t(
                  "輸入正本金與 0–5%（不含 0）的風險。",
                  "Enter positive capital and risk above 0%, up to 5%.",
                )}
          </small>
        </div>
      </div>
      <p className="small-copy muted">
        {t(
          "含範例往返成本；不含清算、資金費率或跳空。名目部位可能超過本金，不代表建議槓桿。",
          "Includes assumed round-trip costs; excludes liquidation, funding and gaps. Notional may exceed capital and is not a leverage recommendation.",
        )}
      </p>
    </section>
  );
}
