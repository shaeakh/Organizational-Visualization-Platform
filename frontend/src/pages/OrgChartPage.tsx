import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, RefreshCw, Clock } from "lucide-react";
import { OrgChartTree } from "../components/OrgChart/OrgChartTree";
import { ExportDropdown } from "../components/OrgChart/ExportDropdown";
import type { Department, Employee, TreeDepartmentNode } from "../types";
import { api } from "../utils/api";

const TITLE_RANK = [
  "代表取締役",
  "本部長",
  "事業部長",
  "部長",
  "課長",
  "担当課長",
  "主任",
  "主任2",
  "主任２",
  "課員",
];

// Pure function: Sorts employees by their defined title rank
export function sortByTitleRank(employees: any[]): any[] {
  return [...employees].sort((a, b) => {
    const rankA = TITLE_RANK.indexOf(a.title);
    const rankB = TITLE_RANK.indexOf(b.title);

    const indexA = rankA === -1 ? 99 : rankA;
    const indexB = rankB === -1 ? 99 : rankB;

    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return a.lastName.localeCompare(b.lastName);
  });
}

// Pure function: Builds hierarchical tree from flat departments
export function buildDepartmentTree(
  departments: Department[],
): TreeDepartmentNode[] {
  const nodeMap = new Map<string, TreeDepartmentNode>();
  const roots: TreeDepartmentNode[] = [];

  // Create nodes for all departments mapping both ID and Name to node
  departments.forEach((dept) => {
    const node: TreeDepartmentNode = {
      department: dept,
      employees: [],
      children: [],
    };
    nodeMap.set(dept.id, node);
    nodeMap.set(dept.name, node);
  });

  // Connect child departments to their parent departments (matching parent ID or Name)
  departments.forEach((dept) => {
    const node = nodeMap.get(dept.id)!;
    if (dept.parentName && nodeMap.has(dept.parentName)) {
      const parentNode = nodeMap.get(dept.parentName)!;
      if (parentNode !== node && !parentNode.children.includes(node)) {
        parentNode.children.push(node);
      }
    } else {
      if (!roots.includes(node)) {
        roots.push(node);
      }
    }
  });

  return roots;
}

// Pure function: Attaches primary and concurrent employees to department tree nodes
export function attachEmployees(
  tree: TreeDepartmentNode[],
  employees: Employee[],
): void {
  const traverse = (node: TreeDepartmentNode) => {
    // 1. Gather primary employees
    const primary = employees.filter(
      (e) => e.department === node.department.name,
    );

    // 2. Gather concurrent employees (Kenmu)
    const concurrent = employees
      .filter((e) => e.concurrentDepartments.includes(node.department.name))
      .map((e) => ({ ...e, isConcurrent: true }));

    // 3. Combine and sort members by rank
    const allMembers = [
      ...primary.map((e) => ({ ...e, isConcurrent: false })),
      ...concurrent,
    ];

    node.employees = sortByTitleRank(allMembers);

    // 4. Recurse down to children
    node.children.forEach(traverse);
  };

  tree.forEach(traverse);
}

// Data loading: Fetch all raw data and map to TS interfaces
async function getOrgChartData(
  date?: string,
): Promise<{ departments: Department[]; employees: Employee[] }> {
  let queryDate = date;
  if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const localStartOfDay = new Date(date);
    queryDate = localStartOfDay.toISOString();
  }
  const [deptsRaw, usersRaw, orgChartRaw] = await Promise.all([
    api.get<any[]>("/api/departments", queryDate),
    api.get<any[]>("/api/users", queryDate),
    api.get<any[]>("/api/orgchart", queryDate),
  ]);

  const departments: Department[] = deptsRaw.map((d) => ({
    id: d.department_id,
    name: d.name,
    parentName: d.parent_department_id,
    head: d.department_head,
  }));

  const deptIdToName = new Map<string, string>();
  departments.forEach((d) => deptIdToName.set(d.id, d.name));

  // Traverse the server tree to collect active concurrent duties
  const concurrentMap = new Map<string, string[]>();
  const traverse = (node: any) => {
    node.members.forEach((m: any) => {
      if (m.is_concurrent) {
        const list = concurrentMap.get(m.user_id) || [];
        if (!list.includes(node.department.name)) {
          list.push(node.department.name);
        }
        concurrentMap.set(m.user_id, list);
      }
    });
    node.children.forEach(traverse);
  };
  orgChartRaw.forEach(traverse);

  const employees: Employee[] = usersRaw
    .filter((u: any) => u.active === 1)
    .map((u) => ({
      id: u.user_id,
      lastName: u.last_name,
      firstName: u.first_name,
      department: deptIdToName.get(u.department_id) || "",
      title: u.title,
      concurrentDepartments: concurrentMap.get(u.user_id) || [],
    }));

  return { departments, employees };
}

export const OrgChartPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isJa = i18n.language.startsWith("ja");

  const [treeRoots, setTreeRoots] = useState<TreeDepartmentNode[]>([]);
  const [rawDepartments, setRawDepartments] = useState<Department[]>([]);
  const [rawEmployees, setRawEmployees] = useState<Employee[]>([]);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatQueryString = (d: string, t: string) => {
    if (!d) return "";
    const timeVal = t.trim() ? t.trim() : "00:00";
    const localDate = new Date(`${d}T${timeVal}:00`);
    return isNaN(localDate.getTime()) ? `${d}T${timeVal}:00` : localDate.toISOString();
  };

  const setDateToCurrentTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setDate(`${year}-${month}-${day}`);
    setTime(`${hours}:${minutes}`);
  };

  const loadChart = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryStr = formatQueryString(date, time);
      // 1. Fetch raw data sources
      const { departments, employees } = await getOrgChartData(queryStr);
      setRawDepartments(departments);
      setRawEmployees(employees);

      // 2. Build the department tree
      const tree = buildDepartmentTree(departments);

      // 3. Attach primary and concurrent employees
      attachEmployees(tree, employees);

      setTreeRoots(tree);
    } catch (err: any) {
      setError(err.message || t("orgChart.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChart();
  }, [date, time]);

  // Determine display year (e.g. 2024)
  const displayYear = date
    ? date.split("-")[0]
    : new Date().getFullYear().toString();

  return (
    <div className="space-y-6">
      {/* Print CSS Settings */}
      <style>{`
        @media print {
          @page {
            size: A3 landscape;
            margin: 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hide {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header controls - Hidden on print */}
      <div className="bg-card p-6 rounded-2xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 print-hide">
        {/* Date & Time Selector */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase">
              {t("orgChart.viewHistorical")}
            </label>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-muted border border-input text-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
              <div className="flex items-center gap-1 bg-muted border border-input rounded-lg px-2 py-1.5 text-foreground">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="00:00"
                  className="text-sm bg-transparent text-foreground focus:outline-none font-mono"
                />
              </div>
              <button
                onClick={setDateToCurrentTime}
                className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1.5 rounded-lg border border-border transition-colors font-medium flex items-center gap-1 cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5 text-primary" />
                {isJa ? "現在時刻" : "Current Time"}
              </button>
              {(date || time) && (
                <button
                  onClick={() => {
                    setDate("");
                    setTime("");
                  }}
                  className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2.5 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  {t("orgChart.viewCurrent")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadChart()}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("orgChart.refresh")}
          </button>

          {/* Download Dropdown */}
          <ExportDropdown
            treeRoots={treeRoots}
            departments={rawDepartments}
            employees={rawEmployees}
            date={date}
            disabled={loading}
          />
        </div>
      </div>

      {/* Org Chart Render Area */}
      <div className="relative w-full overflow-x-auto print:overflow-visible print-full-width">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border gap-4 print-hide">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">
              {t("orgChart.loading")}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border text-destructive print-hide">
            <p className="font-semibold">{error}</p>
          </div>
        ) : (
          <div
            id="org-chart-render-area"
            className="w-fit bg-white text-black p-8 border border-black min-w-[1200px]"
          >
            {/* Page Title: {年度}年度組織図 */}
            <div className="text-left mb-6 border-b-2 border-black pb-2 flex justify-between items-center">
              <h1
                className="text-2xl font-bold font-sans"
                style={{
                  fontFamily:
                    '"Yu Gothic", "游ゴシック", "Noto Sans JP", sans-serif',
                }}
              >
                {t("orgChart.yearChart", { year: displayYear })}
              </h1>
              <img
                src="/assets/images/syslabobesidename.svg"
                alt="SYSLABO"
                className="h-7 object-contain"
              />
            </div>

            {/* Tree root elements stacked vertically */}
            <div className="space-y-6">
              {treeRoots.map((rootNode) => (
                <div
                  key={rootNode.department.id}
                  className="border-b border-dashed border-gray-400 pb-6 last:border-b-0 last:pb-0"
                >
                  <OrgChartTree
                    node={rootNode}
                    isLast={true}
                    ancestorsIsLast={[]}
                    depth={0}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
