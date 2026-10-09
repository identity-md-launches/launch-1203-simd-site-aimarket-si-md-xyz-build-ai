import { useState, useEffect } from "react";
import type { Setup } from "./data";
export type Settings = { demo: boolean; motion: boolean; backend: string };
export type AlertRule = {
  id: string;
  asset: string;
  direction: "above" | "below";
  threshold: number;
  createdAt: string;
  demo: boolean;
};
export type JournalEntry = {
  key: string;
  observedAt: string;
  mode: "Demo" | "Connected";
  setup: Setup;
  outcome: "pending";
};
export function readLocal<T>(
  key: string,
  fallback: T,
  valid: (v: unknown) => v is T,
): T {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(`aimarket:v1:${key}`) ?? "null",
    );
    return valid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
export function useStored<T>(
  key: string,
  fallback: T,
  valid: (v: unknown) => v is T,
) {
  const [value, setValue] = useState<T>(() => readLocal(key, fallback, valid));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(`aimarket:v1:${key}`, JSON.stringify(value));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [key, value]);
  return [value, setValue, failed] as const;
}
export const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length < 10000 && v.every((s) => typeof s === "string");
export const isSettings = (v: unknown): v is Settings =>
  !!v &&
  typeof v === "object" &&
  "demo" in v &&
  typeof v.demo === "boolean" &&
  "motion" in v &&
  typeof v.motion === "boolean" &&
  "backend" in v &&
  typeof v.backend === "string";
