// app/api/patrolApi.ts

// Define the interface for the response data based on your server schema
export interface PatrolLocation {
  employee_name: string;
  employee_id: string;
  patrol_time: string; // ISO Date string
  location: string;
  latitude: string;
  longitude: string;
}

export interface PatrolRound {
  s_no: number;
  date: string;
  start_time: string;
  end_time: string;
  table: PatrolLocation[];
}

export interface PatrolReportResponse {
  factory_name: string;
  factory_address: string;
  report_date: string;
  generated_by: string;
  generated_at: string;
  rounds: PatrolRound[];
}

import { getApiUrl } from "../utils/apiUrl";

/**
 * Fetches the patrol report from the backend server
 * @param factoryCode - The factory code (e.g., "F001")
 * @param date - The date string (e.g., "2026-01-22")
 * @returns The PatrolReportResponse object
 */
export async function getPatrolReport(
  factoryCode: string, 
  date: string
): Promise<PatrolReportResponse> {
  const baseUrl = getApiUrl(); 
  
  // Construct the query parameters
  const params = new URLSearchParams({
    factory_code: factoryCode,
    date: date,
  });

  const url = `${baseUrl}/api/report/patrol?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      // Optional: Add credentials if you have auth cookies
      // credentials: "include", 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`);
    }

    const data: PatrolReportResponse = await response.json();
    return data;

  } catch (error) {
    console.error("Network Error:", error);
    throw error;
  }
}