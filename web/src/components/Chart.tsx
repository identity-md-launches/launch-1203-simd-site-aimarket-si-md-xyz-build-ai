import { useId, useMemo, useState } from "react";
import {
  CandlestickChart,
  ChartNoAxesCombined,
  ChevronDown,
} from "lucide-react";
import type { Asset, Lang } from "../data";
import { demoCandles, money, taipei } from "../engine";
import { Empty, TokenIcon, StatusBadge } from "./ui";

export function Sparkline({
  index = 0,
  down = false,
}: {
  index?: number;
  down?: boolean;
}) {
  const points = Array.from(
    { length: 26 },
    (_, i) =>
      `${i * 4},${24 - Math.sin(i * 1.4 + index) * 5 - (down ? -1 : 1) * i * 0.4}`,
  ).join(" ");
  return (
    <svg
      viewBox="0 0 104 40"
      className={`sparkline ${down ? "down" : ""}`}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
export default function Chart({
  assets,
  selected,
  onSelect,
  lang,
}: {
  assets: Asset[];
  selected: string;
  onSelect: (id: string) => void;
  lang: Lang;
}) {
  const [timeframe, setTimeframe] = useState("4H");
  const [line, setLine] = useState(false);
  const [cursor, setCursor] = useState(47);
  const id = useId().replace(/:/g, "");
  const asset = assets.find((a) => a.id === selected) ?? assets[0];
  const candles = useMemo(
    () => (asset?.status === "Demo" ? demoCandles(asset, timeframe) : []),
    [asset, timeframe],
  );
  if (!asset)
    return (
      <section className="panel">
        <Empty
          title={lang === "zh" ? "等待市場資料" : "Awaiting market data"}
          text={
            lang === "zh"
              ? "前往設定連接後端，或啟用示範模式。"
              : "Connect a backend in Settings, or enable demo mode."
          }
        />
      </section>
    );
  const low = Math.min(...candles.map((c) => c.low)) * 0.998;
  const high = Math.max(...candles.map((c) => c.high)) * 1.002;
  const y = (n: number) => 20 + ((high - n) / (high - low)) * 188;
  const x = (i: number) => 12 + i * 11.75;
  const active = candles[cursor];
  return (
    <section className="panel chart-panel" aria-labelledby="chart-heading">
      <div className="panel-head">
        <h2 id="chart-heading">
          {lang === "zh" ? "市場脈動" : "Market pulse"}
          <span className="section-slash"> / MARKET PULSE</span>
        </h2>
        <StatusBadge status={asset.status} lang={lang} />
      </div>
      <div className="chart-toolbar">
        <div className="asset-picker">
          <TokenIcon asset={asset} />
          <div>
            <label className="sr-only" htmlFor="chart-asset">
              {lang === "zh" ? "圖表標的" : "Chart asset"}
            </label>
            <select
              id="chart-asset"
              value={asset.id}
              onChange={(e) => onSelect(e.target.value)}
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.symbol} / USD
                </option>
              ))}
            </select>
            <p>{asset.name}</p>
          </div>
          <ChevronDown size={14} aria-hidden="true" />
        </div>
        <div className="chart-value">
          <strong>{money(asset.price)}</strong>
          <span className={asset.change < 0 ? "negative" : "positive"}>
            {asset.change >= 0 ? "+" : ""}
            {asset.change.toFixed(2)}% <small>24h</small>
          </span>
        </div>
      </div>
      <div className="chart-controls">
        <div
          className="segmented"
          aria-label={lang === "zh" ? "K 線週期" : "Candle interval"}
        >
          {["1H", "4H", "1D", "1W"].map((t) => (
            <button
              key={t}
              aria-pressed={t === timeframe}
              onClick={() => {
                setTimeframe(t);
                setCursor(47);
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="segmented">
          <button
            aria-label={lang === "zh" ? "K 線圖" : "Candlestick chart"}
            aria-pressed={!line}
            onClick={() => setLine(false)}
          >
            <CandlestickChart size={16} />
          </button>
          <button
            aria-label={lang === "zh" ? "折線圖" : "Line chart"}
            aria-pressed={line}
            onClick={() => setLine(true)}
          >
            <ChartNoAxesCombined size={16} />
          </button>
        </div>
      </div>
      {asset.status !== "Demo" ? (
        <Empty
          title={
            lang === "zh"
              ? "歷史 K 線尚未連接"
              : "Candle history is not connected"
          }
          text={
            lang === "zh"
              ? "此後端介面提供報價與研究快照，未提供 OHLC 歷史。"
              : "This backend contract supplies quotes and research snapshots, without OHLC history."
          }
        />
      ) : (
        <>
          <div className="ohlc mono" aria-live="off">
            {active && (
              <>
                <span>
                  O <b>{active.open.toFixed(asset.price < 0.01 ? 8 : 2)}</b>
                </span>
                <span>
                  H <b>{active.high.toFixed(asset.price < 0.01 ? 8 : 2)}</b>
                </span>
                <span>
                  L <b>{active.low.toFixed(asset.price < 0.01 ? 8 : 2)}</b>
                </span>
                <span>
                  C{" "}
                  <b
                    className={
                      active.close >= active.open ? "positive" : "negative"
                    }
                  >
                    {active.close.toFixed(asset.price < 0.01 ? 8 : 2)}
                  </b>
                </span>
              </>
            )}
          </div>
          <svg
            className="price-chart"
            viewBox="0 0 660 286"
            role="img"
            aria-label={`${asset.symbol} ${timeframe} ${lang === "zh" ? "合成示範 K 線與成交量；可用下方滑桿讀取數值" : "synthetic demo candles and volume; inspect values with the slider below"}`}
          >
            <defs>
              <linearGradient id={id} x2="0" y2="1">
                <stop stopColor="#b4fb50" stopOpacity=".13" />
                <stop offset="1" stopColor="#b4fb50" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <path
                  d={`M0 ${24 + i * 45}H584`}
                  stroke="#243028"
                  strokeDasharray="3 4"
                />
                <text
                  x="600"
                  y={28 + i * 45}
                  fill="#99a59c"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {(high - ((high - low) * i) / 4).toLocaleString("en-US", {
                    maximumFractionDigits: asset.price < 0.01 ? 8 : 0,
                  })}
                </text>
              </g>
            ))}
            {[0, 8, 16, 24, 32, 40, 47].map((i) => (
              <path
                key={i}
                d={`M${x(i)} 16V248`}
                stroke="#1c271f"
                strokeDasharray="3 4"
              />
            ))}
            {line ? (
              <>
                <path
                  d={`M${x(0)} 216 ${candles.map((c, i) => `L${x(i)} ${y(c.close)}`).join(" ")} L${x(47)} 216Z`}
                  fill={`url(#${id})`}
                />
                <polyline
                  points={candles
                    .map((c, i) => `${x(i)},${y(c.close)}`)
                    .join(" ")}
                  fill="none"
                  stroke="#b4fb50"
                  strokeWidth="2"
                />
              </>
            ) : (
              candles.map((c, i) => (
                <g
                  key={i}
                  fill={c.close >= c.open ? "#b4fb50" : "#eb8275"}
                  stroke={c.close >= c.open ? "#b4fb50" : "#eb8275"}
                >
                  <path
                    d={`M${x(i)} ${y(c.high)}V${y(c.low)}`}
                    strokeWidth="1"
                  />
                  <rect
                    x={x(i) - 3}
                    y={Math.min(y(c.open), y(c.close))}
                    width="6"
                    height={Math.max(1.5, Math.abs(y(c.open) - y(c.close)))}
                    strokeWidth="0"
                  />
                </g>
              ))
            )}
            {candles.map((c, i) => (
              <rect
                key={i}
                x={x(i) - 3}
                y={253 - c.volume * 0.35}
                width="6"
                height={c.volume * 0.35}
                fill={c.close >= c.open ? "#b4fb50" : "#eb8275"}
                opacity=".23"
              />
            ))}
            <path
              d={`M0 ${y(asset.price)}H587`}
              stroke="#b4fb50"
              strokeDasharray="4 4"
              opacity=".65"
            />
            <rect
              x="590"
              y={y(asset.price) - 9}
              width="70"
              height="18"
              rx="3"
              fill="#b4fb50"
            />
            <text
              x="625"
              y={y(asset.price) + 3}
              textAnchor="middle"
              fill="#112006"
              fontSize="9"
              fontWeight="600"
              fontFamily="monospace"
            >
              {asset.price.toLocaleString("en-US", {
                maximumFractionDigits: asset.price < 0.01 ? 8 : 2,
              })}
            </text>
            <path
              d={`M${x(cursor)} 17V253`}
              stroke="#d9e2d4"
              opacity=".5"
              strokeDasharray="3 3"
            />
            {[0, 12, 24, 36, 47].map((i) => (
              <text
                key={i}
                x={x(i)}
                y="277"
                textAnchor={i === 0 ? "start" : "middle"}
                fill="#99a59c"
                fontSize="10"
                fontFamily="monospace"
              >
                {timeframe === "1H"
                  ? taipei(candles[i].time)
                  : new Intl.DateTimeFormat("en-GB", {
                      timeZone: "Asia/Taipei",
                      day: "2-digit",
                      month: "2-digit",
                    }).format(candles[i].time)}
              </text>
            ))}
          </svg>
          <div className="chart-scrubber">
            <label htmlFor="candle-cursor">
              {lang === "zh" ? "讀取 K 線" : "Inspect candle"}
            </label>
            <input
              id="candle-cursor"
              type="range"
              min="0"
              max="47"
              value={cursor}
              onChange={(e) => setCursor(Number(e.target.value))}
              aria-valuetext={
                active
                  ? `${taipei(active.time, true)}, ${money(active.close)}`
                  : undefined
              }
            />
            <span className="mono">{active ? taipei(active.time) : ""}</span>
          </div>
        </>
      )}
      <div className="panel-foot">
        <span>
          <span className="legend-dot" />
          {lang === "zh" ? "價格" : "Price"}
          <span className="legend-dot volume" />
          {lang === "zh" ? "成交量" : "Volume"}
        </span>
        <span>
          {taipei(asset.asOf, true)} <b>UTC+8</b>
        </span>
      </div>
    </section>
  );
}
