/**
 * app/api/report.ts
 * Uses shared axiosClient — no separate axios instance, no duplicate token logic.
 */
import { AxiosError } from "axios";
import axiosClient from "./axiosClient";

/* =====================================================
   TYPES
===================================================== */

export interface PatrolReportItem {
  qr_name: string;
  round: number;
  scan_time: string | null;
  lat: string | null;
  lon: string | null;
  guard_name: string | null;
  status: "SUCCESS" | "MISSED" | "PENDING";
  date?: string;
}

export interface PatrolReportResponse {
  factory_code: string;
  report_date: string;
  items: PatrolReportItem[];
}

interface WrappedResponse {
  success?: boolean;
  data?: PatrolReportItem[];
  message?: string;
}

/* =====================================================
   CORE FETCH FUNCTION
===================================================== */

async function fetchPatrolReportData(
  factoryCode: string,
  reportDate: string,
  endDate?: string
): Promise<PatrolReportItem[]> {
  try {
    const response = await axiosClient.get<PatrolReportItem[] | WrappedResponse>(
      "/report/download",
      {
        params: {
          factory_code: factoryCode,
          report_date: reportDate,
          ...(endDate ? { end_date: endDate } : {}),
        },
      }
    );

    const result = response.data;

    if (Array.isArray(result)) return result;
    if (result?.data && Array.isArray(result.data)) return result.data;

    console.error("Unexpected patrol report response:", result);
    return [];
  } catch (err) {
    const error = err as AxiosError<any>;
    console.error("Error fetching patrol report:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Unable to fetch patrol report");
  }
}

/* =====================================================
   EXPORT 1: Used by dashboard/page.tsx and report-download/page.tsx
===================================================== */

export async function getPatrolReport(
  factoryCode: string,
  reportDate: string,
  endDate?: string
): Promise<PatrolReportItem[]> {
  return fetchPatrolReportData(factoryCode, reportDate, endDate);
}

/* =====================================================
   EXPORT 2: Used by PDF UI
===================================================== */

export async function getPatrolReportPDF(
  factoryCode: string,
  reportDate: string,
  endDate?: string
): Promise<PatrolReportResponse> {
  const items = await fetchPatrolReportData(factoryCode, reportDate, endDate);
  return { factory_code: factoryCode, report_date: reportDate, items };
}

