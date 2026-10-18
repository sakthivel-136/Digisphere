import axiosClient from "./axiosClient";
import { AxiosResponse } from "axios";

export interface Shift {
  id: string;
  name: string;
  startTime: string; // "HH:mm" e.g., "06:00"
  endTime: string;   // "HH:mm" e.g., "14:00"
  description?: string;
  assignedGuardIds: string[];
  createdAt?: string;
}

export interface GuardAllocationPayload {
  shift_id: string;
  guard_ids: string[];
}

const SHIFTS_STORAGE_KEY = "pentagon_shifts_roster";

// Default initial shifts if none stored yet
const DEFAULT_SHIFTS: Shift[] = [
  {
    id: "shift-morning",
    name: "Morning Patrol Shift",
    startTime: "06:00",
    endTime: "14:00",
    description: "Main perimeter morning verification & access control",
    assignedGuardIds: ["SEC-001", "SEC-002", "SEC-004"],
    createdAt: new Date().toISOString()
  },
  {
    id: "shift-afternoon",
    name: "Afternoon Verification Shift",
    startTime: "14:00",
    endTime: "22:00",
    description: "Factory floor & checkpoint scanning operations",
    assignedGuardIds: ["SEC-003", "SEC-005"],
    createdAt: new Date().toISOString()
  },
  {
    id: "shift-night",
    name: "Night Watch Shift",
    startTime: "22:00",
    endTime: "06:00",
    description: "High-security night rounds and perimeter sweeps",
    assignedGuardIds: [],
    createdAt: new Date().toISOString()
  }
];

export const getStoredShifts = (): Shift[] => {
  if (typeof window === "undefined") return DEFAULT_SHIFTS;
  try {
    const raw = localStorage.getItem(SHIFTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(DEFAULT_SHIFTS));
      return DEFAULT_SHIFTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading stored shifts:", err);
    return DEFAULT_SHIFTS;
  }
};

export const saveStoredShifts = (shifts: Shift[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(shifts));
  } catch (err) {
    console.error("Error saving shifts to storage:", err);
  }
};

/* ================= SHIFT API FUNCTIONS ================= */

/**
 * Fetch all shifts. First attempts backend API, falls back to local storage cache seamlessly.
 */
export const getShifts = async (): Promise<Shift[]> => {
  try {
    const response: AxiosResponse<Shift[]> = await axiosClient.get("/shifts");
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      saveStoredShifts(response.data);
      return response.data;
    }
  } catch (err) {
    // Backend endpoint might not exist yet; use persistent storage
    console.info("Using local cached shifts store");
  }
  return getStoredShifts();
};

/**
 * Create or save a shift.
 */
export const createShift = async (shiftData: Omit<Shift, "id" | "assignedGuardIds">): Promise<Shift> => {
  const newShift: Shift = {
    ...shiftData,
    id: `shift-${Date.now()}`,
    assignedGuardIds: [],
    createdAt: new Date().toISOString()
  };

  try {
    const response: AxiosResponse<Shift> = await axiosClient.post("/shifts", newShift);
    if (response.data) {
      const all = getStoredShifts();
      saveStoredShifts([response.data, ...all]);
      return response.data;
    }
  } catch (err) {
    console.info("Saved shift locally");
  }

  const all = getStoredShifts();
  const updated = [newShift, ...all];
  saveStoredShifts(updated);
  return newShift;
};

/**
 * Update an existing shift.
 */
export const updateShift = async (id: string, updates: Partial<Shift>): Promise<Shift> => {
  try {
    const response: AxiosResponse<Shift> = await axiosClient.put(`/shifts/${id}`, updates);
    if (response.data) {
      const all = getStoredShifts().map((s) => (s.id === id ? { ...s, ...response.data } : s));
      saveStoredShifts(all);
      return response.data;
    }
  } catch (err) {
    console.info("Updated shift locally");
  }

  const all = getStoredShifts().map((s) => (s.id === id ? { ...s, ...updates } : s));
  saveStoredShifts(all);
  const found = all.find((s) => s.id === id);
  if (!found) throw new Error("Shift not found");
  return found;
};

/**
 * Delete a shift.
 */
export const deleteShift = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/shifts/${id}`);
  } catch (err) {
    console.info("Deleted shift locally");
  }

  const all = getStoredShifts().filter((s) => s.id !== id);
  saveStoredShifts(all);
};

/**
 * Bulk allocate guards to a shift.
 * Requirement: POST /api/allocations/bulk with { shift_id, guard_ids }
 */
export const bulkAllocateGuards = async (payload: GuardAllocationPayload): Promise<void> => {
  let apiSuccess = false;
  try {
    await axiosClient.post("/allocations/bulk", payload);
    apiSuccess = true;
  } catch (err) {
    console.warn("Backend /allocations/bulk not reachable, persisting allocation locally:", err);
  }

  // Update locally stored shift guards so UI persists state
  const all = getStoredShifts().map((s) => {
    if (s.id === payload.shift_id) {
      return { ...s, assignedGuardIds: payload.guard_ids };
    }
    return s;
  });
  saveStoredShifts(all);
};
