import axiosClient from "./axiosClient";
import { AxiosResponse } from "axios";

export interface PatrolRound {
  id: string;
  round_number: number;
  start_time: string;      // "HH:mm" (24h) round operational start
  end_time: string;        // "HH:mm" (24h) round operational end
  scan_start_time: string; // "HH:mm" (24h) scan window opening (e.g., 06:55)
  scan_end_time: string;   // "HH:mm" (24h) scan window closing (e.g., 07:20)
  created_at?: string;
}

const ROUNDS_STORAGE_KEY = "pentagon_patrol_rounds";

// Initial standard patrol schedule with both round timing & scan window opening timing
export const DEFAULT_PATROL_ROUNDS: PatrolRound[] = [
  { id: "rnd-1",  round_number: 1,  start_time: "06:00", end_time: "07:00", scan_start_time: "06:55", scan_end_time: "07:20" },
  { id: "rnd-2",  round_number: 2,  start_time: "07:00", end_time: "08:00", scan_start_time: "07:55", scan_end_time: "08:20" },
  { id: "rnd-3",  round_number: 3,  start_time: "08:00", end_time: "09:00", scan_start_time: "08:55", scan_end_time: "09:20" },
  { id: "rnd-4",  round_number: 4,  start_time: "09:00", end_time: "10:00", scan_start_time: "09:55", scan_end_time: "10:20" },
  { id: "rnd-5",  round_number: 5,  start_time: "10:00", end_time: "11:00", scan_start_time: "10:55", scan_end_time: "11:20" },
  { id: "rnd-6",  round_number: 6,  start_time: "11:00", end_time: "12:00", scan_start_time: "11:55", scan_end_time: "12:20" },
  { id: "rnd-7",  round_number: 7,  start_time: "12:00", end_time: "13:00", scan_start_time: "12:55", scan_end_time: "13:20" },
  { id: "rnd-8",  round_number: 8,  start_time: "13:00", end_time: "14:00", scan_start_time: "13:55", scan_end_time: "14:20" },
  { id: "rnd-9",  round_number: 9,  start_time: "14:00", end_time: "15:00", scan_start_time: "14:55", scan_end_time: "15:20" },
  { id: "rnd-10", round_number: 10, start_time: "15:00", end_time: "16:00", scan_start_time: "15:55", scan_end_time: "16:20" },
  { id: "rnd-11", round_number: 11, start_time: "16:00", end_time: "17:00", scan_start_time: "16:55", scan_end_time: "17:20" },
  { id: "rnd-12", round_number: 12, start_time: "17:00", end_time: "18:00", scan_start_time: "17:55", scan_end_time: "18:20" },
  { id: "rnd-13", round_number: 13, start_time: "18:00", end_time: "19:00", scan_start_time: "18:55", scan_end_time: "19:20" },
  { id: "rnd-14", round_number: 14, start_time: "19:00", end_time: "20:00", scan_start_time: "19:55", scan_end_time: "20:20" },
  { id: "rnd-15", round_number: 15, start_time: "20:00", end_time: "21:00", scan_start_time: "20:55", scan_end_time: "21:20" },
  { id: "rnd-16", round_number: 16, start_time: "21:00", end_time: "21:30", scan_start_time: "21:25", scan_end_time: "21:45" },
  { id: "rnd-17", round_number: 17, start_time: "21:30", end_time: "22:00", scan_start_time: "21:55", scan_end_time: "22:15" },
  { id: "rnd-18", round_number: 18, start_time: "22:00", end_time: "22:30", scan_start_time: "22:25", scan_end_time: "22:45" },
  { id: "rnd-19", round_number: 19, start_time: "22:30", end_time: "23:00", scan_start_time: "22:55", scan_end_time: "23:15" },
  { id: "rnd-20", round_number: 20, start_time: "23:00", end_time: "23:30", scan_start_time: "23:25", scan_end_time: "23:45" },
  { id: "rnd-21", round_number: 21, start_time: "23:30", end_time: "00:00", scan_start_time: "23:55", scan_end_time: "00:15" },
  { id: "rnd-22", round_number: 22, start_time: "00:00", end_time: "00:30", scan_start_time: "00:25", scan_end_time: "00:45" },
  { id: "rnd-23", round_number: 23, start_time: "00:30", end_time: "01:00", scan_start_time: "00:55", scan_end_time: "01:15" },
  { id: "rnd-24", round_number: 24, start_time: "01:00", end_time: "01:30", scan_start_time: "01:25", scan_end_time: "01:45" },
  { id: "rnd-25", round_number: 25, start_time: "01:30", end_time: "02:00", scan_start_time: "01:55", scan_end_time: "02:15" },
  { id: "rnd-26", round_number: 26, start_time: "02:00", end_time: "02:30", scan_start_time: "02:25", scan_end_time: "02:45" },
  { id: "rnd-27", round_number: 27, start_time: "02:30", end_time: "03:00", scan_start_time: "02:55", scan_end_time: "03:15" },
  { id: "rnd-28", round_number: 28, start_time: "03:00", end_time: "03:30", scan_start_time: "03:25", scan_end_time: "03:45" },
  { id: "rnd-29", round_number: 29, start_time: "03:30", end_time: "04:00", scan_start_time: "03:55", scan_end_time: "04:15" },
  { id: "rnd-30", round_number: 30, start_time: "04:00", end_time: "04:30", scan_start_time: "04:25", scan_end_time: "04:45" },
  { id: "rnd-31", round_number: 31, start_time: "04:30", end_time: "05:00", scan_start_time: "04:55", scan_end_time: "05:15" },
  { id: "rnd-32", round_number: 32, start_time: "05:00", end_time: "05:30", scan_start_time: "05:25", scan_end_time: "05:45" },
  { id: "rnd-33", round_number: 33, start_time: "05:30", end_time: "06:00", scan_start_time: "05:55", scan_end_time: "06:15" },
];

export const getStoredRounds = (): PatrolRound[] => {
  if (typeof window === "undefined") return DEFAULT_PATROL_ROUNDS;
  try {
    const raw = localStorage.getItem(ROUNDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ROUNDS_STORAGE_KEY, JSON.stringify(DEFAULT_PATROL_ROUNDS));
      return DEFAULT_PATROL_ROUNDS;
    }
    const parsed: PatrolRound[] = JSON.parse(raw);
    // Ensure backwards compatibility with scan window fields
    const normalized = parsed.map((r, i) => ({
      ...r,
      scan_start_time: r.scan_start_time || DEFAULT_PATROL_ROUNDS[i]?.scan_start_time || "06:55",
      scan_end_time: r.scan_end_time || DEFAULT_PATROL_ROUNDS[i]?.scan_end_time || "07:20",
    }));
    return normalized.sort((a, b) => a.round_number - b.round_number);
  } catch (err) {
    console.error("Error reading stored rounds:", err);
    return DEFAULT_PATROL_ROUNDS;
  }
};

export const saveStoredRounds = (rounds: PatrolRound[]): void => {
  if (typeof window === "undefined") return;
  try {
    const sorted = [...rounds].sort((a, b) => a.round_number - b.round_number);
    localStorage.setItem(ROUNDS_STORAGE_KEY, JSON.stringify(sorted));
  } catch (err) {
    console.error("Error saving rounds to storage:", err);
  }
};

/* ================= CRUD API ================= */

/**
 * Fetch all patrol rounds (GET /api/rounds) sorted ascending by round_number
 */
export const getRounds = async (): Promise<PatrolRound[]> => {
  try {
    const res: AxiosResponse<PatrolRound[]> = await axiosClient.get("/rounds");
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const sorted = res.data.sort((a, b) => a.round_number - b.round_number);
      saveStoredRounds(sorted);
      return sorted;
    }
  } catch (err) {
    // Graceful fallback to persistent storage
  }
  return getStoredRounds();
};

/**
 * Create a new patrol round (POST /api/rounds)
 */
export const createRound = async (
  data: Omit<PatrolRound, "id">
): Promise<PatrolRound> => {
  const newRound: PatrolRound = {
    ...data,
    id: `round-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
  };

  try {
    const res: AxiosResponse<PatrolRound> = await axiosClient.post("/rounds", newRound);
    if (res.data) {
      const all = getStoredRounds();
      const updated = [...all, res.data].sort((a, b) => a.round_number - b.round_number);
      saveStoredRounds(updated);
      return res.data;
    }
  } catch (err) {
    // Client persistent fallback
  }

  const all = getStoredRounds();
  const updated = [...all, newRound].sort((a, b) => a.round_number - b.round_number);
  saveStoredRounds(updated);
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
      const all = getStoredRounds().map((r) => (r.id === id ? { ...r, ...res.data } : r));
      saveStoredRounds(all);
      return res.data;
    }
  } catch (err) {
    // Client persistent fallback
  }

  const all = getStoredRounds().map((r) => (r.id === id ? { ...r, ...updates } : r));
  saveStoredRounds(all);
  const found = all.find((r) => r.id === id);
  if (!found) throw new Error("Round not found");
  return found;
};

/**
 * Delete a patrol round (DELETE /api/rounds/:id)
 */
export const deleteRound = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/rounds/${id}`);
  } catch (err) {
    // Client persistent fallback
  }

  const all = getStoredRounds().filter((r) => r.id !== id);
  saveStoredRounds(all);
};
