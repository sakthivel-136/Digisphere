import axiosClient from "./axiosClient";
import { AxiosResponse } from "axios";

export interface PatrolRound {
  id: string;
  factory_code?: string;
  round_number: number;
  start_time: string;      // "HH:mm" (24h) round operational start
  end_time: string;        // "HH:mm" (24h) round operational end
  scan_start_time: string; // "HH:mm" (24h) scan window opening (e.g., 06:55)
  scan_end_time: string;   // "HH:mm" (24h) scan window closing (e.g., 07:20)
  created_at?: string;
}

const D1_WORKER_URL = "https://pentagon-patrol-api.srmdatabase2025.workers.dev";

const getStorageKey = (factoryCode?: string) =>
  factoryCode ? `pentagon_patrol_rounds_${factoryCode}` : "pentagon_patrol_rounds";

export const getStoredRounds = (factoryCode?: string): PatrolRound[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(factoryCode));
    if (!raw) return [];
    const parsed: PatrolRound[] = JSON.parse(raw);
    return parsed
      .filter((r) => !factoryCode || !r.factory_code || r.factory_code === factoryCode)
      .sort((a, b) => a.round_number - b.round_number);
  } catch (err) {
    console.error("Error reading stored rounds:", err);
    return [];
  }
};

export const saveStoredRounds = (rounds: PatrolRound[], factoryCode?: string): void => {
  if (typeof window === "undefined") return;
  try {
    const sorted = [...rounds].sort((a, b) => a.round_number - b.round_number);
    localStorage.setItem(getStorageKey(factoryCode), JSON.stringify(sorted));
  } catch (err) {
    console.error("Error saving rounds to storage:", err);
  }
};

/* ================= CRUD API ================= */

/**
 * Fetch patrol rounds filtered by factory_code.
 * Queries backend first; falls back to direct Cloudflare D1 query, then local storage.
 */
export const getRounds = async (factoryCode: string = "F001"): Promise<PatrolRound[]> => {
  // 1. Try backend API
  try {
    const res: AxiosResponse<PatrolRound[]> = await axiosClient.get("/rounds", {
      params: { factory_code: factoryCode },
    });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const filtered = res.data.filter((r) => !r.factory_code || r.factory_code === factoryCode);
      const sorted = filtered.sort((a, b) => a.round_number - b.round_number);
      saveStoredRounds(sorted, factoryCode);
      return sorted;
    }
  } catch (err) {
    // API not responding or errored, proceed to direct Cloudflare D1 fallback
  }

  // 2. Direct Cloudflare D1 query fallback
  try {
    const d1Res = await fetch(D1_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query:
          "SELECT id, factory_code, round_number, start_time, end_time, scan_start_time, scan_end_time FROM rounds WHERE factory_code = ? ORDER BY round_number ASC",
        params: [factoryCode],
      }),
    });
    if (d1Res.ok) {
      const d1Json = await d1Res.json();
      const rows = d1Json.results || d1Json;
      if (Array.isArray(rows) && rows.length > 0) {
        const sorted: PatrolRound[] = rows
          .map((r: any) => ({
            id: r.id || `rnd-${r.factory_code}-${r.round_number}`,
            factory_code: r.factory_code || factoryCode,
            round_number: Number(r.round_number),
            start_time: r.start_time,
            end_time: r.end_time,
            scan_start_time: r.scan_start_time,
            scan_end_time: r.scan_end_time,
          }))
          .sort((a, b) => a.round_number - b.round_number);
        saveStoredRounds(sorted, factoryCode);
        return sorted;
      }
    }
  } catch (err) {
    console.error("Cloudflare D1 direct fetch error:", err);
  }

  // 3. Persistent LocalStorage fallback
  return getStoredRounds(factoryCode);
};

/**
 * Create a new patrol round (POST /api/rounds)
 */
export const createRound = async (
  data: Omit<PatrolRound, "id">
): Promise<PatrolRound> => {
  const factory = data.factory_code || "F001";
  const newRound: PatrolRound = {
    ...data,
    factory_code: factory,
    id: `rnd-${factory}-${data.round_number}`,
    created_at: new Date().toISOString(),
  };

  try {
    const res: AxiosResponse<PatrolRound> = await axiosClient.post("/rounds", newRound);
    if (res.data) {
      const all = getStoredRounds(factory);
      const updated = [...all, res.data].sort((a, b) => a.round_number - b.round_number);
      saveStoredRounds(updated, factory);
      return res.data;
    }
  } catch (err) {
    // API failed, try direct D1 Worker insert
    try {
      await fetch(D1_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query:
            "INSERT OR REPLACE INTO rounds (id, factory_code, round_number, start_time, end_time, scan_start_time, scan_end_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
          params: [
            newRound.id,
            newRound.factory_code,
            newRound.round_number,
            newRound.start_time,
            newRound.end_time,
            newRound.scan_start_time,
            newRound.scan_end_time,
          ],
        }),
      });
    } catch (_) {}
  }

  const all = getStoredRounds(factory);
  const updated = [...all, newRound].sort((a, b) => a.round_number - b.round_number);
  saveStoredRounds(updated, factory);
  return newRound;
};

/**
 * Update a patrol round (PUT /api/rounds/:id)
 */
export const updateRound = async (
  id: string,
  updates: Partial<PatrolRound>
): Promise<PatrolRound> => {
  const factory = updates.factory_code || "F001";

  try {
    const res: AxiosResponse<PatrolRound> = await axiosClient.put(`/rounds/${id}`, updates);
    if (res.data) {
      const all = getStoredRounds(factory).map((r) => (r.id === id ? { ...r, ...res.data } : r));
      saveStoredRounds(all, factory);
      return res.data;
    }
  } catch (err) {
    // Fallback direct D1 update
    try {
      await fetch(D1_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query:
            "UPDATE rounds SET round_number = ?, start_time = ?, end_time = ?, scan_start_time = ?, scan_end_time = ? WHERE id = ?",
          params: [
            updates.round_number,
            updates.start_time,
            updates.end_time,
            updates.scan_start_time,
            updates.scan_end_time,
            id,
          ],
        }),
      });
    } catch (_) {}
  }

  const all = getStoredRounds(factory).map((r) => (r.id === id ? { ...r, ...updates } : r));
  saveStoredRounds(all, factory);
  const found = all.find((r) => r.id === id);
  if (!found) throw new Error("Round not found");
  return found;
};

/**
 * Delete a patrol round (DELETE /api/rounds/:id)
 */
export const deleteRound = async (id: string, factoryCode?: string): Promise<void> => {
  try {
    await axiosClient.delete(`/rounds/${id}`);
  } catch (err) {
    try {
      await fetch(D1_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "DELETE FROM rounds WHERE id = ?",
          params: [id],
        }),
      });
    } catch (_) {}
  }

  const all = getStoredRounds(factoryCode).filter((r) => r.id !== id);
  saveStoredRounds(all, factoryCode);
};

/**
 * Batch create/update patrol rounds for a factory (POST /rounds/batch)
 */
export const createBatchRounds = async (
  factoryCode: string,
  rounds: Array<Omit<PatrolRound, 'id'>>,
  overwrite: boolean = false
): Promise<{ success: boolean; count: number; message: string }> => {
  try {
    const res = await axiosClient.post('/rounds/batch', {
      factory_code: factoryCode,
      rounds,
      overwrite,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.detail || err.message || 'Failed to create batch rounds');
  }
};

/**
 * Copy all rounds from source factory to target factory (POST /rounds/copy)
 */
export const copyRoundsFromFactory = async (
  sourceFactoryCode: string,
  targetFactoryCode: string,
  overwrite: boolean = true
): Promise<{ success: boolean; count: number; message: string }> => {
  try {
    const res = await axiosClient.post('/rounds/copy', {
      source_factory_code: sourceFactoryCode,
      target_factory_code: targetFactoryCode,
      overwrite,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.detail || err.message || 'Failed to copy rounds between factories');
  }
};
