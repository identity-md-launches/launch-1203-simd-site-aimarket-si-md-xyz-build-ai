import test from "node:test";
import assert from "node:assert/strict";
import { demoAssets, demoSetups, demoSnapshot, type Snapshot } from "./data";
import {
  backendBase,
  coBuys,
  demoCandles,
  effectiveStatus,
  eligible,
  money,
  presentSnapshot,
  rewardRisk,
  sizePosition,
  taipei,
  validWallet,
  validateSnapshot,
} from "./engine";

const now = Date.parse("2026-10-09T01:00:00Z");
const fresh = (): Snapshot => ({
  ...structuredClone(demoSnapshot),
  status: "Live",
  assets: demoAssets.map((a) => ({ ...a, status: "Live" })),
  setups: demoSetups.map((s) => ({ ...s, status: "Live" })),
});
test("Taipei timestamps are unambiguous and roll over at UTC+8", () => {
  assert.equal(taipei("2026-10-09T18:31:00Z", true), "2026-10-10 02:31");
  assert.equal(taipei("2026-10-09T00:00:00Z"), "08:00");
  assert.equal(money(0.00001043), "$0.00001043");
});
test("expiry, future timestamps and non-tradable states suppress eligibility", () => {
  const s = { ...demoSetups[0], status: "Live" as const };
  assert.equal(eligible(s, now), true);
  for (const status of ["Cached", "Unavailable", "Stale", "Demo"] as const)
    assert.equal(eligible({ ...s, status }, now), false);
  assert.equal(eligible({ ...s, direction: "neutral" }, now), false);
  assert.equal(eligible(s, Date.parse(s.expiresAt)), false);
  assert.equal(effectiveStatus("Live", "bad", s.expiresAt, now), "Stale");
  assert.equal(
    effectiveStatus(
      "Live",
      "2026-10-10T00:00:00Z",
      "2026-10-11T00:00:00Z",
      now,
    ),
    "Stale",
  );
  assert.equal(effectiveStatus("Demo", s.asOf, s.expiresAt, now + 1e9), "Demo");
});
test("snapshot and quote status override a nominally live setup", () => {
  const snapshot = fresh();
  assert.equal(
    presentSnapshot({ ...snapshot, status: "Cached" }, now).setups[0].status,
    "Cached",
  );
  assert.equal(
    presentSnapshot({ ...snapshot, status: "Unavailable" }, now).setups[0]
      .status,
    "Unavailable",
  );
  snapshot.assets[0].status = "Stale";
  assert.equal(presentSnapshot(snapshot, now).setups[0].status, "Stale");
  assert.ok(
    presentSnapshot(fresh(), now, true).setups.every(
      (s) => s.status === "Stale",
    ),
  );
  assert.ok(
    presentSnapshot(demoSnapshot, now + 1e12).assets.every(
      (a) => a.status === "Demo",
    ),
  );
});
test("reward/risk includes round-trip fees and supports short direction", () => {
  const s = {
    ...demoSetups[0],
    entry: [100, 100] as [number, number],
    stop: 95,
    targets: [115, 120] as [number, number],
    costBps: 100,
  };
  assert.equal(rewardRisk(s), 14 / 6);
  assert.equal(
    rewardRisk({ ...s, direction: "short", stop: 105, targets: [85, 80] }),
    14 / 6,
  );
  assert.equal(rewardRisk({ ...s, costBps: 2000 }), 0);
});
test("risk sizing bounds money at risk, not margin or guaranteed loss", () => {
  const s = {
    ...demoSetups[0],
    entry: [100, 100] as [number, number],
    stop: 95,
    costBps: 100,
  };
  const result = sizePosition(s, 10000, 1)!;
  assert.equal(result.budget, 100);
  assert.equal(result.units, 100 / 6);
  assert.equal(result.notional, 10000 / 6);
  for (const risk of [0, -1, 6, NaN, Infinity])
    assert.equal(sizePosition(s, 10000, risk), null);
  assert.equal(sizePosition(s, -100, 1), null);
});
test("demo candles are deterministic, change with intervals and obey OHLC bounds", () => {
  const candles = demoCandles(demoAssets[0], "4H");
  assert.deepEqual(candles, demoCandles(demoAssets[0], "4H"));
  assert.equal(candles.length, 48);
  assert.equal(candles[47].close, demoAssets[0].price);
  assert.equal(candles[1].time - candles[0].time, 14400000);
  assert.notDeepEqual(candles, demoCandles(demoAssets[0], "1D"));
  for (const c of candles) {
    assert.ok(c.high >= Math.max(c.open, c.close));
    assert.ok(c.low <= Math.min(c.open, c.close));
  }
});
test("backend URL accepts only credential-free HTTPS bases", () => {
  assert.equal(
    backendBase(" https://example.org/research/ "),
    "https://example.org/research",
  );
  for (const url of [
    "",
    "http://example.org",
    "https://user:password@example.org",
    "https://example.org?key=value",
    "https://example.org#fragment",
    "javascript:alert(1)",
  ])
    assert.throws(() => backendBase(url));
});
test("schema accepts complete samples and strips unknown fields", () => {
  assert.deepEqual(validateSnapshot(demoSnapshot), demoSnapshot);
  assert.deepEqual(validateSnapshot(fresh()), fresh());
  const extra = {
    ...demoSnapshot,
    privateMetadata: "discard",
    setups: demoSetups.map((s) => ({ ...s, internalMetadata: "discard" })),
  };
  const clean = validateSnapshot(extra);
  assert.ok(!("privateMetadata" in clean));
  assert.ok(!("internalMetadata" in clean.setups[0]));
});
test("schema rejects malformed, unsafe, inconsistent and ambiguous snapshots", () => {
  const mutations: ((s: Snapshot) => void)[] = [
    (s) => {
      s.version = 2 as 1;
    },
    (s) => {
      s.assets[0].price = NaN;
    },
    (s) => {
      s.assets.push(s.assets[0]);
    },
    (s) => {
      s.setups[0].asset = "missing";
    },
    (s) => {
      s.setups[0].sources[0].url = "javascript:alert(1)";
    },
    (s) => {
      s.setups[0].sources = [];
    },
    (s) => {
      s.setups[0].ruleVersion = "unknown";
    },
    (s) => {
      s.setups[0].entry = [100, 90];
    },
    (s) => {
      s.setups[0].stop = 999999;
    },
    (s) => {
      s.setups[0].factors = [];
    },
    (s) => {
      s.setups[0].status = "Live";
    },
    (s) => {
      s.expiresAt = s.generatedAt;
    },
    (s) => {
      s.assets[0].status = "Live";
    },
  ];
  for (const mutate of mutations) {
    const s = structuredClone(demoSnapshot);
    mutate(s);
    assert.throws(() => validateSnapshot(s));
  }
});
test("wallet validation preserves chain identity and rejects malformed addresses", () => {
  assert.equal(validWallet("Ethereum", "0x" + "a1".repeat(20)), true);
  assert.equal(validWallet("Base", "0x" + "A1".repeat(20)), true);
  assert.equal(validWallet("Ethereum", "0x" + "0".repeat(40)), false);
  assert.equal(validWallet("Ethereum", "0x1234"), false);
  assert.equal(
    validWallet("Solana", "So11111111111111111111111111111111111111112"),
    true,
  );
  assert.equal(validWallet("Solana", "O0not-a-base58-key"), false);
  assert.equal(validWallet("Solana", "2".repeat(32)), false);
});
test("co-buy windows use full chain+contract identity and distinct wallets", () => {
  const event = {
    wallet: "A",
    chain: "Ethereum",
    contract: "0xAbC",
    timestamp: now,
    usd: 10,
  };
  const events = [
    event,
    { ...event, wallet: "a" },
    { ...event, wallet: "B" },
    { ...event, wallet: "C", chain: "Base" },
    { ...event, wallet: "D", timestamp: now - 16 * 60000 },
    { ...event, wallet: "E", timestamp: now + 1 },
  ];
  const groups = coBuys(events, now, 15, 2);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].distinct, 2);
  assert.equal(groups[0].independent, 2);
  assert.equal(coBuys(events, now, 15, 3).length, 0);
});
test("co-buy clusters merge repeated and transitively related wallets", () => {
  const event = {
    wallet: "A",
    chain: "Ethereum",
    contract: "demo-token",
    timestamp: now,
    usd: 10,
  };
  const events = [
    event,
    { ...event, cluster: "one" },
    { ...event, wallet: "B", cluster: "one" },
    { ...event, wallet: "B", cluster: "two" },
    { ...event, wallet: "C", cluster: "two" },
    { ...event, wallet: "D" },
  ];
  const group = coBuys(events, now, 15, 2)[0];
  assert.equal(group.distinct, 4);
  assert.equal(group.independent, 2);
  assert.equal(group.related, true);
  assert.equal(coBuys(events, now, 15, 3).length, 0);
});
