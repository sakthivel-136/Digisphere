const D1_WORKER_URL = 'https://pentagon-patrol-api.srmdatabase2025.workers.dev/query';

export interface ReportAuditRecord {
  id: number;
  report_type: string;
  factory_code: string;
  report_date: string;
  generated_by_user_id: string;
  generated_by_name: string;
  generated_by_role: string;
  generated_at: string;
}

export interface LogAuditPayload {
  report_type: 'PATROL_REPORT_PDF' | 'ANALYTICAL_REPORT_PDF' | 'ROUNDS_TIMETABLE_PDF' | string;
  factory_code: string;
  report_date: string;
  user_id?: string;
  user_name?: string;
  user_role?: string;
}

/**
 * Log a PDF report download into report_audit table in D1.
 */
export async function logReportDownload(payload: LogAuditPayload): Promise<void> {
  try {
    const userId =
      payload.user_id ||
      (typeof window !== 'undefined' ? localStorage.getItem('user_id') || 'admin' : 'admin');
    const userName =
      payload.user_name ||
      (typeof window !== 'undefined' ? localStorage.getItem('adminName') || localStorage.getItem('name') || 'Admin' : 'Admin');
    const userRole =
      payload.user_role ||
      (typeof window !== 'undefined' ? localStorage.getItem('role') || 'ADMIN' : 'ADMIN');

    await fetch(D1_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          'INSERT INTO report_audit (report_type, factory_code, report_date, generated_by_user_id, generated_by_name, generated_by_role) VALUES (?, ?, ?, ?, ?, ?)',
        params: [
          payload.report_type,
          payload.factory_code || 'ALL',
          payload.report_date || new Date().toISOString().split('T')[0],
          userId,
          userName,
          userRole,
        ],
      }),
    });
  } catch (error) {
    console.error('Failed to log report download audit:', error);
  }
}

/**
 * Fetch report download audits for compliance & management review.
 */
export async function getReportAudits(factoryCode?: string): Promise<ReportAuditRecord[]> {
  try {
    let query =
      'SELECT id, report_type, factory_code, report_date, generated_by_user_id, generated_by_name, generated_by_role, generated_at FROM report_audit';
    const params: any[] = [];
    if (factoryCode && factoryCode !== 'ALL') {
      query += ' WHERE factory_code = ?';
      params.push(factoryCode);
    }
    query += ' ORDER BY id DESC LIMIT 100';

    const res = await fetch(D1_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (error) {
    console.error('Error fetching report audits:', error);
    return [];
  }
}
