import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PatrolRound } from "@/app/api/rounds.api";

// Format 24h "HH:mm" to 12h "hh:mm AM/PM"
export const formatTime12h = (timeStr: string): string => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(formattedHours).padStart(2, "0")}:${minutes} ${ampm}`;
};

// Calculate duration in minutes / hours between start_time and end_time
export const calculateDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return "—";
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return "—";

  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const diffMinutes = endMinutes - startMinutes;
  if (diffMinutes < 60) {
    return `${diffMinutes} mins`;
  }
  const hours = Math.floor(diffMinutes / 60);
  const remMinutes = diffMinutes % 60;
  if (remMinutes === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }
  return `${hours} hr ${remMinutes} mins`;
};

// Export Official Rounds Timetable PDF
export const exportRoundsTimetablePDF = async (
  rounds: PatrolRound[],
  author: string = "Security Administrator",
  factoryName?: string
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Page Border Frame
  doc.setDrawColor(220, 226, 235);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Top Neon Indigo accent bar
  doc.setFillColor(99, 102, 241);
  doc.rect(10, 10, pageWidth - 20, 4, "F");

  let currentY = 22;

  // Document Title & Company Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("PENTAGON GARMENTS PATROL OPERATIONS", 16, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  currentY += 5;
  const subtitle = factoryName
    ? `OFFICIAL PATROL ROUNDS TIMETABLE – ${factoryName.toUpperCase()}`
    : "OFFICIAL PATROL ROUNDS & SCAN OPENING WINDOW TIMETABLE";
  doc.text(subtitle, 16, currentY);

  // Metadata block
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Generated: ${dateStr} ${timeStr}`, pageWidth - 16, 22, { align: "right" });
  doc.text(`Authorized Officer: ${author}`, pageWidth - 16, 27, { align: "right" });
  doc.text(`Doc Ref: PG-RND-TIMETABLE-${now.getFullYear()}`, pageWidth - 16, 32, { align: "right" });

  currentY += 12;

  // Horizontal divider
  doc.setDrawColor(226, 232, 240);
  doc.line(16, currentY, pageWidth - 16, currentY);
  currentY += 8;

  // Summary Banner
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(16, currentY, pageWidth - 32, 14, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, currentY, pageWidth - 32, 14, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Total Configured Patrol Rounds: ${rounds.length}   |   Daily Schedule: 24-Hour Active Cycle   |   App Login: Scan Window Enforced`,
    20,
    currentY + 9
  );

  currentY += 20;

  // Table Data
  const sorted = [...rounds].sort((a, b) => a.round_number - b.round_number);
  const tableRows = sorted.map((r) => {
    const roundBadge = `Round ${String(r.round_number).padStart(2, "0")}`;
    const roundWindow = `${formatTime12h(r.start_time)} – ${formatTime12h(r.end_time)}`;
    const scanWindow = `${formatTime12h(r.scan_start_time || "06:55")} – ${formatTime12h(r.scan_end_time || "07:20")}`;
    const duration = calculateDuration(r.start_time, r.end_time);
    return [
      roundBadge,
      roundWindow,
      scanWindow,
      duration,
      "APP LOGIN ACTIVE",
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: 16, right: 16 },
    theme: "striped",
    head: [["Round Identifier", "Round Time (Operational)", "Scan Window (App Login)", "Duration", "Guard App Login"]],
    body: tableRows,
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "left",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      overflow: "linebreak",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: "bold" },
      1: { cellWidth: 46 },
      2: { cellWidth: 48, fontStyle: "bold", textColor: [79, 70, 229] },
      3: { cellWidth: 24, halign: "center" },
      4: { cellWidth: "auto", halign: "center" },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 120;

  if (finalY > pageHeight - 45) {
    doc.addPage();
    doc.setDrawColor(220, 226, 235);
    doc.setLineWidth(0.4);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  }

  // Footer / Signatures Area
  const signY = pageHeight - 35;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);

  doc.line(20, signY, 75, signY);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Head of Factory Security", 20, signY + 4);
  doc.text("Authorized Signature & Stamp", 20, signY + 8);

  doc.line(pageWidth - 75, signY, pageWidth - 20, signY);
  doc.text("Operations Director Approval", pageWidth - 75, signY + 4);
  doc.text("Pentagon Garments Management", pageWidth - 75, signY + 8);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "CONFIDENTIAL - Pentagon Garments Digisphere Security Verification System - Controlled Document",
    pageWidth / 2,
    pageHeight - 13,
    { align: "center" }
  );

  const filename = `Pentagon_Patrol_Rounds_Timetable_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
