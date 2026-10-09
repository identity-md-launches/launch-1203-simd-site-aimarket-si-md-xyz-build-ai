import type { Asset, Bi, Setup, Snapshot, Status } from "./data";

export const RULE_VERSION = "closed-candle/1.0.0";
export function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 0.01 ? 8 : 2,
    maximumFractionDigits: value < 0.01 ? 8 : 2,
  }).format(value);
}
export function taipei(date: string | number | Date, full = false): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Taipei",
    ...(full
      ? ({ year: "numeric", month: "2-digit", day: "2-digit" } as const)
      : {}),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(date));
  const part = (key: string) => parts.find((p) => p.type === key)?.value ?? "";
  const time = `${part("hour")}:${part("minute")}`;
  return full
    ? `${part("year")}-${part("month")}-${part("day")} ${time}`
    : time;
}
export function effectiveStatus(
  status: Status,
  asOf: string,
  expiresAt: string,
  now = Date.now(),
): Status {
  if (status === "Demo" || status === "Unavailable") return status;
  if (
    !Number.isFinite(Date.parse(asOf)) ||
    !Number.isFinite(Date.parse(expiresAt)) ||
    Date.parse(expiresAt) <= Date.parse(asOf) ||
    Date.parse(asOf) > now + 60000 ||
    Date.parse(expiresAt) <= now
  )
    return "Stale";
  return status;
}
export function presentSnapshot(
  snapshot: Snapshot,
  now = Date.now(),
  failed = false,
): Snapshot {
  const status = failed
    ? "Stale"
    : effectiveStatus(
        snapshot.status,
        snapshot.generatedAt,
        snapshot.expiresAt,
        now,
      );
  const blocked = (s: Status) => ["Stale", "Unavailable", "Cached"].includes(s);
  const assets = snapshot.assets.map((a) => ({
    ...a,
    status:
      status === "Demo"
        ? ("Demo" as Status)
        : blocked(status)
          ? status
          : effectiveStatus(a.status, a.asOf, snapshot.expiresAt, now),
  }));
  const setups = snapshot.setups.map((s) => {
    const quoteStatus =
      assets.find((a) => a.id === s.asset)?.status ?? "Unavailable";
    return {
      ...s,
      status:
        status === "Demo"
          ? ("Demo" as Status)
          : blocked(status)
            ? status
            : blocked(quoteStatus)
              ? quoteStatus
              : effectiveStatus(s.status, s.asOf, s.expiresAt, now),
    };
  });
  return { ...snapshot, status, assets, setups };
}
export function eligible(s: Setup, now = Date.now()): boolean {
  return (
    ["Live", "Delayed"].includes(
      effectiveStatus(s.status, s.asOf, s.expiresAt, now),
    ) && s.direction !== "neutral"
  );
}
export function rewardRisk(s: Setup): number {
  const entry = (s.entry[0] + s.entry[1]) / 2;
  const cost = (entry * s.costBps) / 10000;
  const reward =
    s.direction === "short" ? entry - s.targets[0] : s.targets[0] - entry;
  return Math.max(0, (reward - cost) / (Math.abs(entry - s.stop) + cost));
}
export function sizePosition(s: Setup, capital: number, riskPct: number) {
  const entry = (s.entry[0] + s.entry[1]) / 2;
  if (
    ![capital, riskPct].every(Number.isFinite) ||
    capital <= 0 ||
    riskPct <= 0 ||
    riskPct > 5
  )
    return null;
  const budget = (capital * riskPct) / 100;
  const units =
    budget / (Math.abs(entry - s.stop) + (entry * s.costBps) / 10000);
  return { budget, units, notional: units * entry };
}
export type Candle = {
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
};
export function demoCandles(asset: Asset, timeframe: string): Candle[] {
  const interval =
    { "1H": 3600000, "4H": 14400000, "1D": 86400000, "1W": 604800000 }[
      timeframe
    ] ?? 3600000;
  let previous = asset.price * 0.965;
  return Array.from({ length: 48 }, (_, i) => {
    const wave =
      Math.sin(i * 1.68 + asset.symbol.length) * 0.006 +
      Math.sin(i * 0.44 + interval / 86400000) * 0.009;
    const close =
      i === 47 ? asset.price : asset.price * (0.965 + (i / 47) * 0.034 + wave);
    const open = previous;
    previous = close;
    return {
      time: Date.parse(asset.asOf) - (47 - i) * interval,
      open,
      close,
      high: Math.max(open, close) * (1 + 0.001 + (i % 4) * 0.0007),
      low: Math.min(open, close) * (1 - 0.001 - (i % 3) * 0.0007),
      volume: 14 + ((i * 23 + 9) % 62),
    };
  });
}
export function backendBase(raw: string): string {
  const u = new URL(raw.trim());
  if (u.protocol !== "https:" || u.username || u.password || u.search || u.hash)
    throw new Error("HTTPS_URL");
  return u.href.replace(/\/$/, "");
}
const statuses = ["Live", "Delayed", "Cached", "Stale", "Unavailable", "Demo"];
const categories = ["spot", "memes", "futures", "stocks", "gold"];
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const str = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= 3000;
const bi = (v: unknown): v is Bi => object(v) && str(v.zh) && str(v.en);
const date = (v: unknown): v is string =>
  str(v) &&
  /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v) &&
  Number.isFinite(Date.parse(v));
const pair = (v: unknown): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && v.every((x) => finite(x) && x > 0);
const https = (v: unknown) => {
  try {
    return (
      str(v) &&
      new URL(v).protocol === "https:" &&
      !new URL(v).username &&
      !new URL(v).password
    );
  } catch {
    return false;
  }
};
export function validateSnapshot(raw: unknown): Snapshot {
  const fail = (): never => {
    throw new Error("INVALID_SNAPSHOT");
  };
  if (
    !object(raw) ||
    raw.version !== 1 ||
    !statuses.includes(String(raw.status)) ||
    !date(raw.generatedAt) ||
    !date(raw.expiresAt) ||
    Date.parse(raw.expiresAt) <= Date.parse(raw.generatedAt) ||
    !Array.isArray(raw.assets) ||
    !Array.isArray(raw.setups) ||
    raw.assets.length > 200 ||
    raw.setups.length > 500
  )
    return fail();
  const ids = new Set<string>();
  for (const a of raw.assets) {
    if (
      !object(a) ||
      !str(a.id) ||
      ids.has(a.id) ||
      !str(a.symbol) ||
      !str(a.name) ||
      !categories.includes(String(a.category)) ||
      !finite(a.price) ||
      a.price <= 0 ||
      !finite(a.change) ||
      !str(a.color) ||
      !/^#[0-9a-f]{6}$/i.test(a.color) ||
      !str(a.glyph) ||
      !str(a.volume) ||
      !bi(a.instrument) ||
      !date(a.asOf) ||
      !statuses.includes(String(a.status)) ||
      !finite(a.delayMinutes) ||
      a.delayMinutes < 0
    )
      return fail();
    ids.add(a.id);
  }
  const setups = new Set<string>();
  for (const s of raw.setups) {
    if (
      !object(s) ||
      !str(s.id) ||
      setups.has(s.id) ||
      !ids.has(String(s.asset)) ||
      !categories.includes(String(s.category)) ||
      !["long", "short", "neutral"].includes(String(s.direction)) ||
      !["1H", "4H", "1D", "1W"].includes(String(s.timeframe)) ||
      !bi(s.strategy) ||
      !bi(s.trigger) ||
      !bi(s.thesis) ||
      !bi(s.risk) ||
      !pair(s.entry) ||
      s.entry[0] > s.entry[1] ||
      !pair(s.targets) ||
      !finite(s.stop) ||
      s.stop <= 0 ||
      !finite(s.costBps) ||
      s.costBps < 0 ||
      s.costBps > 10000 ||
      !date(s.asOf) ||
      !date(s.expiresAt) ||
      Date.parse(s.expiresAt) <= Date.parse(s.asOf) ||
      !str(s.ruleVersion) ||
      s.ruleVersion !== RULE_VERSION ||
      !statuses.includes(String(s.status)) ||
      !Array.isArray(s.factors) ||
      s.factors.length !== 5 ||
      !s.factors.every(
        (f) => object(f) && bi(f.label) && typeof f.passed === "boolean",
      ) ||
      !Array.isArray(s.sources) ||
      !s.sources.length ||
      s.sources.length > 15 ||
      !s.sources.every(
        (src) => object(src) && str(src.name) && https(src.url) && bi(src.note),
      )
    )
      return fail();
    if (
      s.direction === "long" &&
      !(
        s.stop < s.entry[0] &&
        s.targets[0] > s.entry[1] &&
        s.targets[1] >= s.targets[0]
      )
    )
      return fail();
    if (
      s.direction === "short" &&
      !(
        s.stop > s.entry[1] &&
        s.targets[0] < s.entry[0] &&
        s.targets[1] <= s.targets[0]
      )
    )
      return fail();
    if ((raw.status === "Demo") !== (s.status === "Demo")) return fail();
    setups.add(s.id);
  }
  if (raw.assets.some((a) => (raw.status === "Demo") !== (a.status === "Demo")))
    return fail();
  // Project only public contract fields: never retain unknown backend properties.
  const value = raw as unknown as Snapshot;
  const copyBi = (v: Bi): Bi => ({ zh: v.zh, en: v.en });
  return {
    version: 1,
    status: value.status,
    generatedAt: value.generatedAt,
    expiresAt: value.expiresAt,
    assets: value.assets.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      name: a.name,
      category: a.category,
      price: a.price,
      change: a.change,
      color: a.color,
      glyph: a.glyph,
      volume: a.volume,
      status: a.status,
      asOf: a.asOf,
      delayMinutes: a.delayMinutes,
      instrument: copyBi(a.instrument),
    })),
    setups: value.setups.map((s) => ({
      id: s.id,
      asset: s.asset,
      category: s.category,
      direction: s.direction,
      strategy: copyBi(s.strategy),
      timeframe: s.timeframe,
      trigger: copyBi(s.trigger),
      thesis: copyBi(s.thesis),
      risk: copyBi(s.risk),
      entry: [...s.entry],
      stop: s.stop,
      targets: [...s.targets],
      costBps: s.costBps,
      factors: s.factors.map((f) => ({
        label: copyBi(f.label),
        passed: f.passed,
      })),
      sources: s.sources.map((src) => ({
        name: src.name,
        url: src.url,
        note: copyBi(src.note),
      })),
      asOf: s.asOf,
      expiresAt: s.expiresAt,
      ruleVersion: s.ruleVersion,
      status: s.status,
    })),
  };
}
export async function fetchSnapshot(
  url: string,
  signal: AbortSignal,
): Promise<Snapshot> {
  const response = await fetch(`${backendBase(url)}/v1/snapshot`, {
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const content = await response.text();
  if (content.length > 2_000_000) throw new Error("PAYLOAD_TOO_LARGE");
  return validateSnapshot(JSON.parse(content));
}
export type Wallet = {
  id: string;
  chain: "Ethereum" | "Base" | "Solana";
  address: string;
  label: string;
};
export function validWallet(chain: Wallet["chain"], address: string): boolean {
  if (chain !== "Solana")
    return /^0x[0-9a-fA-F]{40}$/.test(address) && !/^0x0{40}$/i.test(address);
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return false;
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let value = 0n;
  for (const ch of address) value = value * 58n + BigInt(alphabet.indexOf(ch));
  const leading = address.match(/^1*/)?.[0].length ?? 0;
  let bytes = 0;
  while (value) {
    bytes++;
    value >>= 8n;
  }
  return bytes + leading === 32;
}
export type Buy = {
  wallet: string;
  chain: string;
  contract: string;
  timestamp: number;
  usd: number;
  cluster?: string;
};
export function coBuys(
  events: Buy[],
  now: number,
  minutes: number,
  minimum: number,
) {
  const groups = new Map<string, Buy[]>();
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(minutes) ||
    minutes <= 0 ||
    !Number.isInteger(minimum) ||
    minimum < 1
  )
    return [];
  for (const event of events.filter(
    (e) =>
      e.timestamp <= now &&
      e.timestamp >= now - minutes * 60000 &&
      Number.isFinite(e.usd) &&
      e.usd > 0,
  )) {
    const key = `${event.chain}:${event.chain === "Solana" ? event.contract : event.contract.toLowerCase()}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()]
    .map(([identity, buys]) => {
      const normalize = (b: Buy) =>
        b.chain === "Solana" ? b.wallet : b.wallet.toLowerCase();
      const wallets = new Set(buys.map(normalize));
      const parent = new Map<string, string>();
      const root = (key: string): string => {
        const next = parent.get(key);
        if (!next) {
          parent.set(key, key);
          return key;
        }
        if (next === key) return key;
        const resolved = root(next);
        parent.set(key, resolved);
        return resolved;
      };
      for (const b of buys) {
        const wallet = `wallet:${normalize(b)}`;
        if (b.cluster) parent.set(root(wallet), root(`cluster:${b.cluster}`));
        else root(wallet);
      }
      const distinct = wallets.size;
      const independent = new Set([...wallets].map((w) => root(`wallet:${w}`)))
        .size;
      return {
        identity,
        distinct,
        independent,
        related: distinct > independent,
        grossBuyUsd: buys.reduce((sum, b) => sum + b.usd, 0),
      };
    })
    .filter((group) => group.independent >= minimum);
}
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
