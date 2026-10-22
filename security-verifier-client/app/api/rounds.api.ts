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

const getStorageKey = (factoryCode?: string) =>
  factoryCode ? `pentagon_patrol_rounds_${factoryCode}` : "pentagon_patrol_rounds";

export const getStoredRounds = (factoryCode?: string): PatrolRound[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(factoryCode));
    if (!raw) return [];
    const parsed: PatrolRound[] = JSON.parse(raw);
    return parsed.sort((a, b) => a.round_number - b.round_number);
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
 * Fetch patrol rounds (GET /api/rounds) filtered by factory_code
 */
export const getRounds = async (factoryCode?: string): Promise<PatrolRound[]> => {
  try {
    const params = factoryCode ? { factory_code: factoryCode } : {};
    const res: AxiosResponse<PatrolRound[]> = await axiosClient.get("/rounds", { params });
    if (res.data && Array.isArray(res.data)) {
      const sorted = res.data.sort((a, b) => a.round_number - b.round_number);
      saveStoredRounds(sorted, factoryCode);
      return sorted;
    }
  } catch (err) {
    // Graceful fallback to persistent storage
  }
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
    // Client persistent fallback
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
  try {
    const res: AxiosResponse<PatrolRound> = await axiosClient.put(`/rounds/${id}`, updates);
    if (res.data) {
      const factory = res.data.factory_code || updates.factory_code;
      const all = getStoredRounds(factory).map((r) => (r.id === id ? { ...r, ...res.data } : r));
      saveStoredRounds(all, factory);
      return res.data;
    }
  } catch (err) {
    // Client persistent fallback
  }

  const factory = updates.factory_code;
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
    // Client persistent fallback
  }

  const all = getStoredRounds(factoryCode).filter((r) => r.id !== id);
  saveStoredRounds(all, factoryCode);
};
