import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Shift } from "@/app/api/shifts.api";
import { SecurityUser } from "@/app/types/securityUser";

// Helper to convert 24hr "HH:mm" to 12hr "hh:mm AM/PM"
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

export const exportShiftsTimetablePDF = async (
  shifts: Shift[],
  allGuards: SecurityUser[],
  generatedBy: string = "Operations Admin"
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Create guard map for quick lookup
  const guardMap = new Map<string, SecurityUser>();
  allGuards.forEach((g) => guardMap.set(g.security_id, g));

  // --- Background / Border Frame ---
  doc.setDrawColor(220, 226, 235);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // --- Header Area ---
  // Top brand color bar
  doc.setFillColor(99, 102, 241); // Indigo-500
  doc.rect(10, 10, pageWidth - 20, 4, "F");

  let currentY = 22;

  // Company and Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39); // Gray 900
  doc.text("PENTAGON GARMENTS PATROL OPERATIONS", 16, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Gray 500
  currentY += 5;
  doc.text("SECURITY SHIFT ALLOCATION & ROSTER TIMETABLE", 16, currentY);

  // Metadata block (Right side)
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
  doc.setTextColor(75, 85, 99);
  doc.text(`Generated: ${dateStr} ${timeStr}`, pageWidth - 16, 22, { align: "right" });
  doc.text(`Officer / Author: ${generatedBy}`, pageWidth - 16, 27, { align: "right" });
  doc.text(`Doc Ref: PG-SEC-ROSTER-${now.getFullYear()}`, pageWidth - 16, 32, { align: "right" });

  currentY += 12;

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(16, currentY, pageWidth - 16, currentY);
  currentY += 8;

  // Summary Banner
  const totalShifts = shifts.length;
  const totalAllocations = shifts.reduce((acc, s) => acc + s.assignedGuardIds.length, 0);

  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(16, currentY, pageWidth - 32, 14, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, currentY, pageWidth - 32, 14, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Total Configured Shifts: ${totalShifts}   |   Total Guards Deployed: ${totalAllocations}   |   Status: ACTIVE ROSTER`,
    20,
    currentY + 9
  );

  currentY += 20;

  // Loop through each shift and render its roster table
  shifts.forEach((shift, index) => {
    // Check page overflow
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
      // Re-draw border on new page
      doc.setDrawColor(220, 226, 235);
      doc.setLineWidth(0.4);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    }

    const timeRange = `${formatTime12h(shift.startTime)} – ${formatTime12h(shift.endTime)}`;
    const guardCount = shift.assignedGuardIds.length;

    // Shift Header Pill
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(16, currentY, pageWidth - 32, 8, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`SHIFT ${index + 1}: ${shift.name.toUpperCase()}`, 20, currentY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(199, 210, 254); // indigo-200
    doc.text(`Time: ${timeRange}  (${guardCount} Guards Assigned)`, pageWidth - 20, currentY + 5.5, {
      align: "right",
    });

    currentY += 10;

    // Prepare table rows for guards in this shift
    const tableData: (string | number)[][] = [];

    if (guardCount === 0) {
      tableData.push(["-", "No security guards assigned to this shift", "-", "UNSTAFFED"]);
    } else {
      shift.assignedGuardIds.forEach((guardId, gIdx) => {
        const guard = guardMap.get(guardId);
        const name = guard ? guard.security_name : `Guard ${guardId}`;
        const factory = guard?.factory || "Factory HQ";
        tableData.push([
          String(gIdx + 1).padStart(2, "0"),
          name,
          guardId,
          factory,
        ]);
      });
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: 16, right: 16 },
      theme: "striped",
      head: [["#", "Guard Name", "Security ID", "Station / Factory"]],
      body: tableData,
      headStyles: {
        fillColor: [99, 102, 241], // Indigo
        textColor: 255,
        fontSize: 8.5,
        fontStyle: "bold",
        halign: "left",
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [31, 41, 55],
        overflow: "linebreak",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 70 },
        2: { cellWidth: 35 },
        3: { cellWidth: "auto" },
      },
      didDrawPage: (data) => {
        // Keeps track of height
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY;
    if (finalY) {
      currentY = finalY + 10;
    } else {
      currentY += 25;
    }
  });

  // Check if signature section needs a new page
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 25;
    doc.setDrawColor(220, 226, 235);
    doc.setLineWidth(0.4);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  }

  // --- Footer / Signatures Area ---
  const signY = pageHeight - 35;
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.5);

  // Line 1: Security Supervisor
  doc.line(20, signY, 75, signY);
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("Security Supervisor Signature", 20, signY + 4);
  doc.text("Date: ____________________", 20, signY + 8);

  // Line 2: Operations Manager
  doc.line(pageWidth - 75, signY, pageWidth - 20, signY);
  doc.text("Operations Manager Authorization", pageWidth - 75, signY + 4);
  doc.text("Official Stamp / Verification", pageWidth - 75, signY + 8);

  // Bottom Notice
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text(
    "CONFIDENTIAL - Internal Security Document - Pentagon Garments Digisphere Security Verifier",
    pageWidth / 2,
    pageHeight - 13,
    { align: "center" }
  );

  // Save / Trigger Download
  const filename = `Pentagon_Patrol_Shift_Timetable_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
