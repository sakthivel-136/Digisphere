import axiosClient from "./axiosClient";

export interface Shift {
  id: string;
  factory_code: string;
  shift_name: string;
  shift_code: string;
  start_time: string; // "HH:mm" (24h)
  end_time: string;   // "HH:mm" (24h)
  scan_interval_mins: number;
  scan_window_mins: number;
  is_active: number;
  created_at?: string;
  allocated_guards_count?: number;
}

export interface ShiftGuardAllocation {
  shift_id: string;
  shift_name: string;
  factory_code: string;
  allocated_security_ids: string[];
  all_factory_guards: Array<{
    security_id: string;
    security_name: string;
  }>;
  has_custom_allocation: boolean;
}

/**
 * Fetch shifts for a given factory code
 */
export const getShifts = async (factoryCode: string = "F001"): Promise<Shift[]> => {
  try {
    const res = await axiosClient.get("/shifts", {
      params: { factory_code: factoryCode },
    });
    return res.data || [];
  } catch (err: any) {
    console.error("Error fetching shifts:", err);
    throw new Error(err.response?.data?.detail || "Failed to load shifts");
  }
};

/**
 * Create a new shift
 */
export const createShift = async (data: Omit<Shift, "id" | "created_at" | "allocated_guards_count">): Promise<Shift> => {
  try {
    const res = await axiosClient.post("/shifts", data);
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.detail || "Failed to create shift");
  }
};

/**
 * Update an existing shift
 */
export const updateShift = async (id: string, updates: Partial<Shift>): Promise<Shift> => {
  try {
    const res = await axiosClient.put(`/shifts/${id}`, updates);
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.detail || "Failed to update shift");
  }
};

/**
 * Delete a shift
 */
export const deleteShift = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/shifts/${id}`);
  } catch (err: any) {
    throw new Error(err.response?.data?.detail || "Failed to delete shift");
  }
};

/**
 * Get guards allocated to a shift and available factory guards
 */
export const getShiftGuards = async (shiftId: string): Promise<ShiftGuardAllocation> => {
  try {
    const res = await axiosClient.get(`/shifts/${shiftId}/guards`);
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.detail || "Failed to load shift guards");
  }
};

/**
 * Save guard allocations for a shift
 */
export const allocateShiftGuards = async (shiftId: string, securityIds: string[]): Promise<any> => {
  try {
    const res = await axiosClient.post(`/shifts/${shiftId}/allocate`, {
      security_ids: securityIds,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.detail || "Failed to save guard allocations");
  }
};
