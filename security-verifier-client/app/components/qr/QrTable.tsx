"use client";

import { QRData } from "@/app/api/qr.api";
import { Eye, Pencil, Trash2 } from "lucide-react";


export type QRCode = QRData;

interface QrTableProps {
  qrCodes: QRCode[];
  onEdit: (qr: QRCode) => void;
  onView: (qr: QRCode) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void; // ✅ kept for compatibility
}

// Helper to safely normalize data
const normalizeQR = (data: QRData): QRCode => ({
  qr_id: Number(data.qr_id),
  qr_name: data.qr_name || "Unnamed QR",
  lat: typeof data.lat === "number" ? data.lat : 0,
  lon: typeof data.lon === "number" ? data.lon : 0,
  status:
    data.status === "active" || data.status === "inactive"
      ? data.status
      : "inactive",
  created_at: data.created_at,
  factory_code: data.factory_code || "",
  waiting_time:
    typeof data.waiting_time === "number" ? data.waiting_time : 15,
});

export default function QrTable({
  qrCodes,
  onEdit,
  onView,
  onDelete,
  onToggleStatus, // ✅ properly destructured (even if not used directly)
}: QrTableProps) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)]">
          <thead className="bg-[var(--surface-muted)]">
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                QR Name
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                Factory
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                Coordinates
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                Waiting Time (s)
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-transparent divide-y divide-[var(--border)]">
            {qrCodes.map((qrData) => {
              const qr = normalizeQR(qrData);

              return (
                <tr
                  key={qr.qr_id}
                  className="hover:bg-[var(--surface-muted)] transition-colors duration-150 group"
                >
                  {/* Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[var(--foreground)]">
                        {qr.qr_name}
                      </span>
                      <span className="text-xs text-[var(--foreground-muted)]">
                        Check Point
                      </span>
                    </div>
                  </td>

                  {/* ID */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-[var(--foreground-subtle)] bg-[var(--surface-muted)] px-2 py-1 rounded border border-[var(--border)] font-mono">
                      {qr.qr_id}
                    </span>
                  </td>

                  {/* Factory */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground-subtle)]">
                    {qr.factory_code}
                  </td>

                  {/* Coordinates */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-[var(--foreground-subtle)]">
                      <span className="font-mono">{qr.lat}</span>
                      <span className="text-slate-300">/</span>
                      <span className="font-mono">{qr.lon}</span>
                    </div>
                  </td>

                  {/* Waiting Time */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground-subtle)]">
                    {qr.waiting_time} s
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-all duration-300 ${
                        qr.status === "active"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-[var(--surface-muted)] text-slate-500 border-slate-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          qr.status === "active"
                            ? "bg-blue-600"
                            : "bg-slate-400"
                        }`}
                      ></span>
                      {qr.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(qr)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEdit(qr)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDelete(qr.qr_id)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {qrCodes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-[var(--surface-muted)] p-4 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-[var(--foreground-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--foreground-subtle)]">
            No QR codes found.
          </p>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Create a new one to get started.
          </p>
        </div>
      )}
    </div>
  );
}
