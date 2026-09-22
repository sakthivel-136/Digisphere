import axios from "./axiosClient";

/* =====================================================
   TYPES
===================================================== */

export interface AnalyticsOverview {
  total_expected_rounds: number;
  active_guards: number;
  inactive_guards: number;
  missed_scans: number;
}

export interface GuardScan {
  guard_name: string;
  scan_count: number;
}

export interface MissedScansResponse {
  factory_code: string;
  missed_scan_count: number;
  missed_scan_points: string[];
}

export interface GuardPerformanceMetric {
  guard_name: string;
  total_points: number;
  scanned_points: number;
  missed_points: number;
  performance_score?: number;
}

export interface GuardPerformanceResponse {
  target_date: string;
  metrics: GuardPerformanceMetric[];
}

export interface ProcessResponse {
  success: boolean;
  message: string;
  processed_count?: number;
}

export interface ScanActivity {
  time: string;
  scans: number;
}

export interface GuardChartData {
  name: string;
  scans: number;
}

export interface DashboardChartsResponse {
  activity_data: ScanActivity[];
  guard_data: GuardChartData[];
}

/* =====================================================
   API CALLS
===================================================== */

/* =====================================================
   API CALLS — ALL COMMENTED OUT
   Reason: /analytics/* routes are NOT registered on the server (main.py).
   Every call was returning 404. Re-enable when backend routes are added.
===================================================== */

// export const getAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
//   const response = await axios.get("/analytics/overview");
//   return response.data;
// };

// export const getScansByGuard = async (): Promise<GuardScan[]> => {
//   const response = await axios.get("/analytics/scans-by-guard");
//   return response.data;
// };

// export const getMissedScans = async (
//   factoryCode: string
// ): Promise<MissedScansResponse> => {
//   const response = await axios.get("/analytics/missed-scans", {
//     params: { factory_code: factoryCode },
//   });
//   return response.data;
// };

// export const getGuardPerformance = async (
//   date: string
// ): Promise<GuardPerformanceResponse> => {
//   const response = await axios.get("/analytics/guard-performance", {
//     params: { target_date: date },
//   });
//   return response.data;
// };

// export const getDashboardCharts = async (
//   factoryCode?: string
// ): Promise<DashboardChartsResponse> => {
//   const response = await axios.get("/analytics/dashboard-charts", {
//     params: { factory_code: factoryCode },
//   });
//   return response.data;
// };

// export const processScans = async (
//   target_date: string
// ): Promise<ProcessResponse> => {
//   const response = await axios.post("/analytics/process-scans", {
//     target_date,
//   });
//   return response.data;
// };
