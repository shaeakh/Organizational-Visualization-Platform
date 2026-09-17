import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  ChevronDown,
  FileText,
  Table,
  FileSpreadsheet,
  Image,
  FileJson,
  Loader2,
} from "lucide-react";
import type { Department, Employee, TreeDepartmentNode } from "../../types";
import {
  exportToPdf,
  exportToPng,
  exportToExcel,
  exportToCsv,
  exportToJson,
} from "../../utils/exportUtils";

interface ExportDropdownProps {
  treeRoots: TreeDepartmentNode[];
  departments: Department[];
  employees: Employee[];
  date: string;
  disabled?: boolean;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  treeRoots,
  departments,
  employees,
  date,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formattedDate = date || new Date().toISOString().split("T")[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: "pdf" | "excel" | "csv" | "png" | "json") => {
    setLoadingFormat(format);
    setIsOpen(false);
    try {
      switch (format) {
        case "pdf":
          await exportToPdf(
            "org-chart-render-area",
            `syslabo_org_chart_${formattedDate}.pdf`,
          );
          break;
        case "png":
          await exportToPng(
            "org-chart-render-area",
            `syslabo_org_chart_${formattedDate}.png`,
          );
          break;
        case "excel":
          await exportToExcel(
            departments,
            employees,
            `syslabo_org_chart_${formattedDate}.xlsx`,
            date,
          );
          break;
        case "csv":
          await exportToCsv(
            employees,
            `syslabo_org_chart_${formattedDate}.csv`,
            date,
          );
          break;
        case "json":
          exportToJson(
            treeRoots,
            departments,
            employees,
            `syslabo_org_chart_${formattedDate}.json`,
          );
          break;
      }
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setLoadingFormat(null);
    }
  };

  const exportOptions = [
    {
      id: "pdf" as const,
      label: t("export.pdf"),
      desc: t("export.pdfDesc"),
      icon: FileText,
      color: "text-red-500 bg-red-500/10",
    },
    {
      id: "excel" as const,
      label: t("export.excel"),
      desc: t("export.excelDesc"),
      icon: Table,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      id: "csv" as const,
      label: t("export.csv"),
      desc: t("export.csvDesc"),
      icon: FileSpreadsheet,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      id: "png" as const,
      label: t("export.png"),
      desc: t("export.pngDesc"),
      icon: Image,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      id: "json" as const,
      label: t("export.json"),
      desc: t("export.jsonDesc"),
      icon: FileJson,
      color: "text-amber-500 bg-amber-500/10",
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || !!loadingFormat}
        className="flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {loadingFormat ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>
          {loadingFormat
            ? t("export.generating", { format: loadingFormat.toUpperCase() })
            : t("orgChart.download")}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-card rounded-2xl border border-border shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 border-b border-border/60">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("export.title")}
            </p>
          </div>

          <div className="p-1 space-y-0.5">
            {exportOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleExport(opt.id)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-secondary/70 transition-colors group cursor-pointer"
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${opt.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
