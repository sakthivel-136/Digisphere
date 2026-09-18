"use client";

import { useState, useEffect } from "react";
import QrTable from "@/app/components/qr/QrTable";
import QrForm from "@/app/components/qr/QrForm";
import QrPreview from "@/app/components/qr/QrPreview";
import QrFilters from "@/app/components/qr/QrFilters";
import {
  fetchQRByFactory,
  createQR,
  updateQR,
  deleteQR,
  fetchFactories,
  QRData,
} from "@/app/api/qr.api";
import { useAuthGuard } from "@/app/services/auth.guard";
import { StaggeredList, StaggeredItem } from "@/app/components/ui/LayoutOrchestration";

// ----------------- TYPES -----------------

export type QRCode = QRData;

export interface Factory {
  factory_code: string;
  factory_name: string;
}

// ----------------- MAIN COMPONENT -----------------

export default function QrCrudPage() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [filteredQrCodes, setFilteredQrCodes] = useState<QRCode[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentQr, setCurrentQr] = useState<QRCode | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<string>("");

  // ----------------- DATA MAPPING -----------------

  const normalizeQR = (data: Partial<QRCode>): QRCode => ({
    qr_id: Number(data.qr_id ?? 0),
    qr_name: data.qr_name ?? "Unnamed QR",
    lat: typeof data.lat === "number" ? data.lat : 0,
    lon: typeof data.lon === "number" ? data.lon : 0,
    status: data.status ?? "inactive",
    created_at: data.created_at,
    factory_code: data.factory_code ?? "",
    waiting_time:
      typeof data.waiting_time === "number"
        ? data.waiting_time
        : 15,
  });

  const { authorized } = useAuthGuard();

  // ----------------- LOAD DATA -----------------

  const loadQRCodes = async (factoryCode: string) => {
    if (!authorized) return;
    try {
      const rawData = await fetchQRByFactory(factoryCode);
      const mappedData = rawData.map(normalizeQR);
      setQrCodes(mappedData);
    } catch (err) {
      console.error("Failed to load QR codes:", err);
      setQrCodes([]);
    }
  };

  const loadFactories = async () => {
    if (!authorized) return;
    try {
      const data = await fetchFactories();
      setFactories(data);

      if (data.length > 0) {
        const firstFactory = data[0].factory_code;
        setSelectedFactory(firstFactory);
        loadQRCodes(firstFactory);
      }
    } catch (err) {
      console.error("Failed to load factories:", err);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadFactories();
    }
  }, [authorized]);

  // ----------------- FILTERING -----------------

  useEffect(() => {
    setFilteredQrCodes(qrCodes);
  }, [qrCodes]);

  if (!authorized) {
    return <div className="p-6 text-white min-h-screen bg-[#07071f] flex items-center justify-center">Checking access...</div>;
  }

  // ----------------- HANDLERS -----------------

  const handleAddQr = () => {
    setCurrentQr(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleEditQr = (qr: QRCode) => {
    setCurrentQr(qr);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleViewQr = (qr: QRCode) => {
    setCurrentQr(qr);
    setIsPreviewOpen(true);
  };

  const handleSaveQr = async (qrData: QRCode) => {
    try {
      const apiData: Omit<QRCode, "qr_id" | "created_at"> = {
        qr_name: qrData.qr_name,
        lat: Number(qrData.lat),
        lon: Number(qrData.lon),
        factory_code: qrData.factory_code,
        status: qrData.status ?? "inactive",
        waiting_time: qrData.waiting_time ?? 15,
      };

      if (isEditMode && currentQr) {
        await updateQR(currentQr.qr_id, apiData);

        const updatedList = qrCodes.map((qr) =>
          qr.qr_id === currentQr.qr_id ? qrData : qr
        );

        setQrCodes(updatedList);
      } else {
        await createQR(apiData);
        if (selectedFactory) {
          await loadQRCodes(selectedFactory);
        }
      }

      setIsFormOpen(false);
    } catch (err: unknown) {
      console.error("Save QR failed:", err);
      alert("Failed to save QR");
    }
  };


  const handleToggleStatus = async (id: number) => {
    const qr = qrCodes.find((q) => q.qr_id === id);
    if (!qr) return;

    try {
      const updatedQr = await updateQR(id, { status: qr.status === "active" ? "inactive" : "active" });
      setQrCodes(qrCodes.map((q) => (q.qr_id === id ? { ...q, status: updatedQr.status } : q)));
      setFilteredQrCodes(filteredQrCodes.map((q) => (q.qr_id === id ? { ...q, status: updatedQr.status } : q)));
    } catch (error) {
      console.error("Failed to toggle QR status", error);
    }
  };

  const handleDeleteQr = async (id: number) => {
    if (confirm("Are you sure you want to delete this QR code?")) {
      try {
        await deleteQR(id);
        setQrCodes(qrCodes.filter((qr) => qr.qr_id !== id));
        setFilteredQrCodes(filteredQrCodes.filter((qr) => qr.qr_id !== id));
      } catch (error) {
        console.error("Failed to delete QR code", error);
      }
    }
  };

  // ----------------- RENDER (UI UNCHANGED) -----------------

  return (
    <StaggeredList className="min-h-screen bg-slate-50 p-8 font-sans">
      <StaggeredItem className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Workstations / QR Codes</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and generate QR tags for factory lines</p>
        </div>
        <button
          onClick={handleAddQr}
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
        >
          <span>Add Workstation QR</span>
          <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </StaggeredItem>

      <StaggeredItem className="max-w-7xl mx-auto mb-6">
        <QrFilters
          value={selectedFactory}
          onChange={(code) => {
            setSelectedFactory(code);
            loadQRCodes(code);
          }}
          factories={factories}
        />
      </StaggeredItem>

      <StaggeredItem className="max-w-7xl mx-auto">
        <QrTable
          qrCodes={filteredQrCodes}
          onEdit={handleEditQr}
          onDelete={handleDeleteQr}
          onView={handleViewQr}
          onToggleStatus={handleToggleStatus}
        />
      </StaggeredItem>

      {/* Modals remain un-animated in the list since they are portals/fixed */}
      {isFormOpen && (
        <QrForm
          qr={currentQr}
          factories={factories}
          isEditMode={isEditMode}
          onSave={handleSaveQr}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {isPreviewOpen && currentQr && (
        <QrPreview
          qr={currentQr}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </StaggeredList>
  );
}
