import React from "react";
import { Briefcase, Code2, LifeBuoy, Settings, Layers, PlusCircle, MinusCircle, ArrowRightLeft } from "lucide-react";
import type { TreeDepartmentNode, Employee } from "../../types";

export type EmployeeDiffStatus = "added" | "removed" | "transferred" | "unchanged";

export interface DiffInfo {
  status: EmployeeDiffStatus;
  details?: string;
}

interface DiffOrgChartTreeProps {
  node: TreeDepartmentNode;
  isLast: boolean;
  depth: number;
  diffMap: Map<string, DiffInfo>;
}

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

const getDeptStyle = (id: string) => {
  if (id.startsWith("241")) {
    return {
      bgClass: "bg-chart-1/10 text-black",
      borderClass: "border-l-4 border-l-chart-1 border-y border-r border-black/40",
    };
  }
  if (id.startsWith("243")) {
    return {
      bgClass: "bg-chart-2/10 text-black",
      borderClass: "border-l-4 border-l-chart-2 border-y border-r border-black/40",
    };
  }
  if (id.startsWith("245")) {
    return {
      bgClass: "bg-chart-3/10 text-black",
      borderClass: "border-l-4 border-l-chart-3 border-y border-r border-black/40",
    };
  }
  if (id.startsWith("249")) {
    return {
      bgClass: "bg-chart-4/10 text-black",
      borderClass: "border-l-4 border-l-chart-4 border-y border-r border-black/40",
    };
  }
  return {
    bgClass: "bg-chart-5/10 text-black",
    borderClass: "border-l-4 border-l-chart-5 border-y border-r border-black/40",
  };
};

const getDeptIcon = (id: string) => {
  const iconSize = "h-3.5 w-3.5 mr-1 text-black/75 shrink-0";
  if (id.startsWith("241")) return <Briefcase className={iconSize} />;
  if (id.startsWith("243")) return <Code2 className={iconSize} />;
  if (id.startsWith("245")) return <LifeBuoy className={iconSize} />;
  if (id.startsWith("249")) return <Settings className={iconSize} />;
  return <Layers className={iconSize} />;
};

export const DiffOrgChartTree: React.FC<DiffOrgChartTreeProps> = ({
  node,
  isLast,
  depth,
  diffMap,
}) => {
  const { department, employees, children } = node;
  const isRoot = depth === 0;

  const sortedEmployees = [...employees].sort((a, b) => {
    const rankA = TITLE_RANK.indexOf(a.title);
    const rankB = TITLE_RANK.indexOf(b.title);
    const indexA = rankA === -1 ? 99 : rankA;
    const indexB = rankB === -1 ? 99 : rankB;
    if (indexA !== indexB) return indexA - indexB;
    return a.lastName.localeCompare(b.lastName);
  });

  const titleGroups: { title: string; employees: Employee[] }[] = [];
  sortedEmployees.forEach((emp) => {
    let group = titleGroups.find((g) => g.title === emp.title);
    if (!group) {
      group = { title: emp.title, employees: [] };
      titleGroups.push(group);
    }
    group.employees.push(emp);
  });

  const deptChildren: (
    | { type: "title"; title: string; employees: Employee[] }
    | { type: "dept"; node: TreeDepartmentNode }
  )[] = [
    ...titleGroups.map((g) => ({
      type: "title" as const,
      title: g.title,
      employees: g.employees,
    })),
    ...children.map((c) => ({ type: "dept" as const, node: c })),
  ];

  const style = getDeptStyle(department.id);

  const renderEmpCard = (emp: Employee, idx: number) => {
    const info = diffMap.get(emp.id) || { status: "unchanged" };
    let borderBgClass = "border-black bg-white text-black";
    let badge = null;

    if (info.status === "added") {
      borderBgClass = "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-500/30";
      badge = (
        <span className="flex items-center gap-0.5 text-[9px] bg-emerald-600 text-white px-1 rounded font-mono uppercase tracking-wider ml-1">
          <PlusCircle className="h-2.5 w-2.5" /> Added
        </span>
      );
    } else if (info.status === "removed") {
      borderBgClass = "border-red-600 bg-red-50 text-red-950 line-through opacity-75 ring-2 ring-red-500/30";
      badge = (
        <span className="flex items-center gap-0.5 text-[9px] bg-red-600 text-white px-1 rounded font-mono uppercase tracking-wider ml-1 no-underline">
          <MinusCircle className="h-2.5 w-2.5" /> Left
        </span>
      );
    } else if (info.status === "transferred") {
      borderBgClass = "border-amber-600 bg-amber-50 text-amber-950 font-semibold ring-2 ring-amber-500/30";
      badge = (
        <span className="flex items-center gap-0.5 text-[9px] bg-amber-600 text-white px-1 rounded font-mono uppercase tracking-wider ml-1">
          <ArrowRightLeft className="h-2.5 w-2.5" /> Transferred
        </span>
      );
    }

    return (
      <div
        key={`${emp.id}-${emp.isConcurrent ? "concurrent" : "primary"}-${idx}`}
        className={`border px-3 py-1 text-[11px] min-w-[100px] flex items-center justify-between gap-1 rounded-sm shadow-xs transition-all ${borderBgClass}`}
        title={info.details || `${emp.firstName} ${emp.lastName} (${emp.title})`}
      >
        <span>
          {emp.isConcurrent
            ? `(兼) ${emp.firstName} ${emp.lastName}`
            : `${emp.firstName} ${emp.lastName}`}
        </span>
        {badge}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col relative ${!isRoot ? "pl-6" : ""}`}
      style={{ fontFamily: '"Yu Gothic", "游ゴシック", "Noto Sans JP", sans-serif' }}
    >
      {!isRoot && (
        <>
          <div
            className="absolute bg-black print:bg-black w-px -z-10"
            style={{
              left: "12px",
              top: "0px",
              bottom: isLast ? "calc(100% - 24px)" : "0px",
            }}
          ></div>
          <div
            className="absolute bg-black print:bg-black h-px -z-10"
            style={{ left: "12px", width: "12px", top: "24px" }}
          ></div>
        </>
      )}

      <div className="flex items-stretch min-h-[48px] relative break-inside-avoid">
        <div className="flex items-center py-0 z-10">
          <div
            className={`px-4 py-0 font-bold text-xs min-w-[140px] h-10 leading-10 flex items-center justify-center gap-1 text-center shrink-0 bg-white border border-black rounded-sm shadow-sm ${style.borderClass} ${style.bgClass}`}
          >
            {getDeptIcon(department.id)}
            <span className="truncate">{department.name}</span>
          </div>
        </div>
      </div>

      {deptChildren.length > 0 && (
        <div className="flex flex-col relative">
          {deptChildren.map((child, index) => {
            const isChildLast = index === deptChildren.length - 1;

            if (child.type === "dept") {
              return (
                <DiffOrgChartTree
                  key={child.node.department.name}
                  node={child.node}
                  isLast={isChildLast}
                  depth={depth + 1}
                  diffMap={diffMap}
                />
              );
            }

            const showInLine = child.employees.length <= 3;

            return (
              <div key={child.title} className="flex flex-col relative pl-6">
                <div
                  className="absolute bg-black print:bg-black w-px -z-10"
                  style={{
                    left: "12px",
                    top: "0px",
                    bottom: isChildLast ? "calc(100% - 24px)" : "0px",
                  }}
                ></div>
                <div
                  className="absolute bg-black print:bg-black h-px -z-10"
                  style={{ left: "12px", width: "12px", top: "24px" }}
                ></div>

                <div className="flex items-stretch min-h-[48px] relative break-inside-avoid">
                  <div className="flex items-center py-0 z-10 gap-0">
                    <div
                      className={`border border-black px-3 py-0 text-[11px] font-semibold text-center min-w-[90px] h-8 leading-8 flex items-center justify-center text-black shrink-0 rounded-sm shadow-xs ${style.bgClass}`}
                    >
                      {child.title}
                    </div>

                    {showInLine && (
                      <>
                        <div className="w-2 h-px bg-black shrink-0"></div>
                        <div className="flex gap-1.5 items-center">
                          {child.employees.map((emp, idx) => renderEmpCard(emp, idx))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {!showInLine && (
                  <div className="flex flex-col relative pl-6">
                    <div
                      className="absolute bg-black print:bg-black w-px -z-10"
                      style={{ left: "12px", top: "0px", bottom: "24px" }}
                    ></div>
                    <div
                      className="absolute bg-black print:bg-black h-px -z-10"
                      style={{ left: "12px", width: "12px", top: "24px" }}
                    ></div>

                    <div className="flex items-stretch min-h-[48px] relative break-inside-avoid">
                      <div className="flex items-center py-0 z-10">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 max-w-5xl">
                          {child.employees.map((emp, idx) => renderEmpCard(emp, idx))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
