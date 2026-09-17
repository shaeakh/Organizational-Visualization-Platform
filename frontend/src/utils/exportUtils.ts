import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import type { Department, Employee, TreeDepartmentNode } from "../types";

/**
 * Exports DOM element to high resolution multi-page F4 Portrait PDF with DOM boundary-aware tree splitting
 */
export async function exportToPdf(
  elementId: string,
  filename: string = "org_chart.pdf",
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id '${elementId}' not found.`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // F4 Paper dimensions in mm: 210mm x 330mm (Portrait)
  const f4WidthMm = 210;
  const f4HeightMm = 330;
  const marginMm = 10;
  const headerSpaceMm = 8;

  const printableWidthMm = f4WidthMm - marginMm * 2; // 190mm
  const printableHeightMm = f4HeightMm - marginMm - (marginMm + headerSpaceMm); // 302mm

  // Scale ratio mapping canvas width to printable width (190mm)
  const scaleRatio = printableWidthMm / canvasWidth;
  const targetPageHeightPx = printableHeightMm / scaleRatio;

  // 1. Measure DOM block boundaries (subdivision / department nodes) relative to container
  const rootRect = element.getBoundingClientRect();
  const breakNodes = Array.from(
    element.querySelectorAll(".break-inside-avoid, .flex.flex-col.relative"),
  );

  const blockBounds: { topPx: number; bottomPx: number }[] = [];
  breakNodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    const topPx = (rect.top - rootRect.top) * 2; // scale = 2
    const bottomPx = (rect.bottom - rootRect.top) * 2;
    if (bottomPx > topPx && topPx >= 0 && bottomPx <= canvasHeight) {
      blockBounds.push({ topPx, bottomPx });
    }
  });

  // 2. Compute optimal page slice positions (Y offsets in canvas Px) without splitting blocks
  const sliceYPositions: { startY: number; height: number }[] = [];
  let currentY = 0;

  while (currentY < canvasHeight - 10) {
    let candidateEndY = currentY + targetPageHeightPx;

    if (candidateEndY >= canvasHeight) {
      sliceYPositions.push({
        startY: currentY,
        height: canvasHeight - currentY,
      });
      break;
    }

    // Check if candidateEndY cuts through any block
    let adjustedEndY = candidateEndY;
    let intersected = false;

    for (const b of blockBounds) {
      // If block starts before candidateEndY and ends after candidateEndY, it is intersected
      if (b.topPx < candidateEndY && b.bottomPx > candidateEndY && b.topPx > currentY + 60) {
        if (b.topPx < adjustedEndY) {
          adjustedEndY = b.topPx;
          intersected = true;
        }
      }
    }

    const sliceHeight = (intersected && adjustedEndY > currentY + 80)
      ? adjustedEndY - currentY
      : candidateEndY - currentY;

    sliceYPositions.push({
      startY: currentY,
      height: sliceHeight,
    });

    currentY += sliceHeight;
  }

  const totalPages = sliceYPositions.length;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [f4WidthMm, f4HeightMm],
  });

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) {
      pdf.addPage([f4WidthMm, f4HeightMm], "portrait");
    }

    const { startY, height: sliceHeightPx } = sliceYPositions[i];

    // Create a temporary canvas strip for current page slice
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasWidth;
    tempCanvas.height = sliceHeightPx;

    const ctx = tempCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        startY,
        canvasWidth,
        sliceHeightPx,
        0,
        0,
        canvasWidth,
        sliceHeightPx,
      );
    }

    const sliceImgData = tempCanvas.toDataURL("image/png");
    const sliceRenderedHeightMm = sliceHeightPx * scaleRatio;

    // Header on top of page
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `SYSLABO Organization Chart — Page ${i + 1} of ${totalPages}`,
      marginMm,
      marginMm + 4,
    );
    pdf.setDrawColor(220, 220, 220);
    pdf.line(marginMm, marginMm + 5, f4WidthMm - marginMm, marginMm + 5);

    // Add image slice
    pdf.addImage(
      sliceImgData,
      "PNG",
      marginMm,
      marginMm + headerSpaceMm,
      printableWidthMm,
      sliceRenderedHeightMm,
    );
  }

  pdf.save(filename);
}

/**
 * Exports DOM element to high-resolution PNG image
 */
export async function exportToPng(
  elementId: string,
  filename: string = "org_chart.png",
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id '${elementId}' not found.`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imgData;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper to fetch the master Org Chart Excel template ArrayBuffer
 */
async function fetchTemplateArrayBuffer(): Promise<ArrayBuffer> {
  const response = await fetch("/templates/org_chart_template.xlsx");
  if (!response.ok) {
    throw new Error(`Failed to load org chart template: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

/**
 * Helper to extract display year string from date parameter (e.g., "2026")
 */
function getDisplayYear(date?: string): string {
  if (date && /^\d{4}/.test(date)) {
    return date.split("-")[0];
  }
  return new Date().getFullYear().toString();
}

/**
 * Exports departments & employees to formatted Excel workbook (.xlsx) matching org chart layout
 */
export async function exportToExcel(
  departments: Department[],
  employees: Employee[],
  filename: string = "org_chart.xlsx",
  date?: string,
): Promise<void> {
  try {
    const arrayBuffer = await fetchTemplateArrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    // Update title in sheet '組織図(Organization chart)'
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const yearStr = getDisplayYear(date);

    if (ws && ws["B1"]) {
      ws["B1"].v = `${yearStr}年度組織図`;
    }

    XLSX.writeFile(wb, filename);
  } catch (err) {
    console.error("Excel export fallback:", err);
    // Fallback if template fetch fails
    const wb = XLSX.utils.book_new();

    const deptData = departments.map((d) => ({
      "Department ID (部署ID)": d.id,
      "Department Name (部署名)": d.name,
      "Parent Department (親部署)": d.parentName || "-",
      "Department Head (部署長)": d.head || "-",
    }));
    const deptSheet = XLSX.utils.json_to_sheet(deptData);
    XLSX.utils.book_append_sheet(wb, deptSheet, "Departments");

    const empData = employees.map((e) => ({
      "Employee ID (社員ID)": e.id,
      "Last Name (姓)": e.lastName,
      "First Name (名)": e.firstName,
      "Primary Department (所属部署)": e.department,
      "Title (役職)": e.title,
      "Concurrent Duties / Kenmu (兼務部署)":
        e.concurrentDepartments.length > 0
          ? e.concurrentDepartments.join(", ")
          : "-",
    }));
    const empSheet = XLSX.utils.json_to_sheet(empData);
    XLSX.utils.book_append_sheet(wb, empSheet, "Employees");

    XLSX.writeFile(wb, filename);
  }
}

/**
 * Exports formatted Org Chart matrix layout to UTF-8 CSV with BOM for Japanese Excel compatibility
 */
export async function exportToCsv(
  employees: Employee[],
  filename: string = "org_chart.csv",
  date?: string,
): Promise<void> {
  try {
    const arrayBuffer = await fetchTemplateArrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const yearStr = getDisplayYear(date);

    if (ws && ws["B1"]) {
      ws["B1"].v = `${yearStr}年度組織図`;
    }

    const csvData = XLSX.utils.sheet_to_csv(ws);
    const csvContent = "\uFEFF" + csvData;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("CSV export fallback:", err);
    // Fallback if template fetch fails
    const headers = [
      "User ID",
      "Last Name",
      "First Name",
      "Department",
      "Title",
      "Concurrent Duties",
    ];
    const rows = employees.map((e) => [
      `"${e.id}"`,
      `"${e.lastName}"`,
      `"${e.firstName}"`,
      `"${e.department}"`,
      `"${e.title}"`,
      `"${e.concurrentDepartments.join("; ")}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Exports full tree roots and metadata to JSON file
 */
export function exportToJson(
  treeRoots: TreeDepartmentNode[],
  departments: Department[],
  employees: Employee[],
  filename: string = "org_chart.json",
): void {
  const data = {
    exportedAt: new Date().toISOString(),
    departmentsCount: departments.length,
    employeesCount: employees.length,
    tree: treeRoots,
    departments,
    employees,
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
