import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  GitCompare,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  Calendar,
  RefreshCw,
  Columns2,
  GitCommit,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  buildDepartmentTree,
  attachEmployees,
} from "./OrgChartPage";
import { DiffOrgChartTree, type DiffInfo } from "../components/OrgChart/DiffOrgChartTree";
import { OrgChartTree } from "../components/OrgChart/OrgChartTree";
import type { Department, Employee, TreeDepartmentNode } from "../types";
import { computeOrgDiff, type DiffResult } from "../utils/diffUtils";
import { api } from "../utils/api";

async function fetchSnapshot(
  date?: string,
): Promise<{ departments: Department[]; employees: Employee[] }> {
  let queryDate = date;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const localStartOfDay = new Date(`${date}T00:00:00.000`);
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

export const ComparePage: React.FC = () => {
  const { i18n } = useTranslation();
  const isJa = i18n.language.startsWith("ja");

  // Default Base Date = 2024-04-01 at 00:00 (1 year prior), Target Date = current
  const [baseDate, setBaseDate] = useState<string>("2024-04-01");
  const [baseTime, setBaseTime] = useState<string>("00:00");
  const [targetDate, setTargetDate] = useState<string>("");
  const [targetTime, setTargetTime] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [snapshotA, setSnapshotA] = useState<{
    departments: Department[];
    employees: Employee[];
    tree: TreeDepartmentNode[];
  }>({ departments: [], employees: [], tree: [] });

  const [snapshotB, setSnapshotB] = useState<{
    departments: Department[];
    employees: Employee[];
    tree: TreeDepartmentNode[];
  }>({ departments: [], employees: [], tree: [] });

  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [unifiedTree, setUnifiedTree] = useState<TreeDepartmentNode[]>([]);
  const [diffMap, setDiffMap] = useState<Map<string, DiffInfo>>(new Map());

  const [viewMode, setViewMode] = useState<"unified" | "sideBySide">("unified");

  const formatQueryString = (d: string, t: string) => {
    if (!d) return "";
    const time = t.trim() ? t.trim() : "00:00";
    const localDate = new Date(`${d}T${time}:00`);
    return isNaN(localDate.getTime()) ? `${d}T${time}:00` : localDate.toISOString();
  };

  const formatDisplayText = (d: string, t: string) => {
    if (!d) return isJa ? "現在" : "Current";
    const time = t.trim() ? t.trim() : "00:00";
    return `${d} ${time}`;
  };

  const setBaseToCurrentTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setBaseDate(`${year}-${month}-${day}`);
    setBaseTime(`${hours}:${minutes}`);
  };

  const setTargetToCurrentTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setTargetDate(`${year}-${month}-${day}`);
    setTargetTime(`${hours}:${minutes}`);
  };

  const loadComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryA = formatQueryString(baseDate, baseTime);
      const queryB = formatQueryString(targetDate, targetTime);

      const [dataA, dataB] = await Promise.all([
        fetchSnapshot(queryA),
        fetchSnapshot(queryB),
      ]);

      const treeA = buildDepartmentTree(dataA.departments);
      attachEmployees(treeA, dataA.employees);

      const treeB = buildDepartmentTree(dataB.departments);
      attachEmployees(treeB, dataB.employees);

      setSnapshotA({ ...dataA, tree: treeA });
      setSnapshotB({ ...dataB, tree: treeB });

      // Compute diff
      const diff = computeOrgDiff(dataA.employees, dataB.employees);
      setDiffResult(diff);

      // Build unified diff map and unified tree
      const dMap = new Map<string, DiffInfo>();
      diff.added.forEach((e) => dMap.set(e.id, { status: "added" }));
      diff.removed.forEach((e) => dMap.set(e.id, { status: "removed" }));
      diff.transferred.forEach((t) =>
        dMap.set(t.employee.id, {
          status: "transferred",
          details: `Changed: ${t.oldDepartment} (${t.oldTitle}) → ${t.newDepartment} (${t.newTitle})`,
        }),
      );
      setDiffMap(dMap);

      // Build unified tree (includes Snapshot B tree + removed employees injected for visual diff)
      const uDepts = [...dataB.departments];
      // Include any department from A missing in B
      dataA.departments.forEach((dA) => {
        if (!uDepts.some((dB) => dB.id === dA.id || dB.name === dA.name)) {
          uDepts.push(dA);
        }
      });

      const combinedEmployees = [...dataB.employees];
      diff.removed.forEach((rem) => {
        if (!combinedEmployees.some((e) => e.id === rem.id)) {
          combinedEmployees.push(rem);
        }
      });

      const uTree = buildDepartmentTree(uDepts);
      attachEmployees(uTree, combinedEmployees);
      setUnifiedTree(uTree);
    } catch (err: any) {
      setError(err.message || "Failed to calculate comparison");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, [baseDate, baseTime, targetDate, targetTime]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <GitCompare className="h-6 w-6 text-primary" />
            {isJa ? "組織図比較・差分表示 (Difference View)" : "Org Chart Difference View"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isJa
              ? "2つの指定日時（日付・時刻）の組織・社員データを比較し、新入社・退職・部署異動をGitHub形式で表示します"
              : "Compare organizational snapshots across two dates and times with GitHub PR-style diff highlights"}
          </p>
        </div>

        {/* Preset & Refresh Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBaseDate("2024-04-01");
              setBaseTime("00:00");
              setTargetDate("");
              setTargetTime("");
            }}
            className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-xl transition-colors font-medium cursor-pointer"
          >
            {isJa ? "1年前と比較" : "Compare 1 Year Ago"}
          </button>
          <button
            onClick={loadComparison}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {isJa ? "再計算" : "Recalculate"}
          </button>
        </div>
      </div>

      {/* Date & Time Selectors & Mode Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Base Date Selector */}
        <div className="md:col-span-4 bg-card p-4 rounded-xl border border-border shadow-xs flex flex-col gap-2 justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isJa ? "比較元 (Base Snapshot)" : "Base Snapshot"}
            </p>
            <span className="text-xs font-mono bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
              Snapshot A
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2.5 py-1">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="text-sm bg-transparent text-foreground focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2.5 py-1">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <input
                type="time"
                value={baseTime}
                onChange={(e) => setBaseTime(e.target.value)}
                placeholder="00:00"
                className="text-sm bg-transparent text-foreground focus:outline-none"
              />
            </div>
            <button
              onClick={setBaseToCurrentTime}
              title={isJa ? "現在時刻に設定" : "Set to Current Time"}
              className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1.5 rounded-lg border border-border transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5 text-primary" />
              {isJa ? "現在時刻" : "Current Time"}
            </button>
          </div>
        </div>

        {/* Arrow Indicator */}
        <div className="md:col-span-1 flex justify-center">
          <div className="p-2 rounded-full bg-muted text-muted-foreground">
            <GitCommit className="h-5 w-5" />
          </div>
        </div>

        {/* Target Date Selector */}
        <div className="md:col-span-4 bg-card p-4 rounded-xl border border-border shadow-xs flex flex-col gap-2 justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isJa ? "比較先 (Target Snapshot)" : "Target Snapshot"}
            </p>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded">
              Snapshot B ({formatDisplayText(targetDate, targetTime)})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2.5 py-1">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="text-sm bg-transparent text-foreground focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2.5 py-1">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                placeholder="00:00"
                className="text-sm bg-transparent text-foreground focus:outline-none"
              />
            </div>
            <button
              onClick={setTargetToCurrentTime}
              title={isJa ? "現在時刻に設定" : "Set to Current Time"}
              className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1.5 rounded-lg border border-border transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5 text-primary" />
              {isJa ? "現在時刻" : "Current Time"}
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="md:col-span-3 flex justify-end">
          <div className="inline-flex rounded-xl bg-muted p-1 border border-border">
            <button
              onClick={() => setViewMode("unified")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === "unified"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              {isJa ? "統合ディフ" : "Unified"}
            </button>
            <button
              onClick={() => setViewMode("sideBySide")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === "sideBySide"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              {isJa ? "並べて比較" : "Side-by-Side"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar (GitHub PR Style) */}
      {diffResult && (
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">
                {isJa ? "差分サマリー (Change Summary)" : "Diff Metrics Summary"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-medium font-mono">
              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 px-3 py-1 rounded-lg">
                <PlusCircle className="h-3.5 w-3.5" /> +{diffResult.summary.addedCount} {isJa ? "名 新規追加" : "Added"}
              </span>
              <span className="flex items-center gap-1 bg-red-500/10 text-red-600 border border-red-500/30 px-3 py-1 rounded-lg">
                <MinusCircle className="h-3.5 w-3.5" /> -{diffResult.summary.removedCount} {isJa ? "名 退職・除外" : "Removed"}
              </span>
              <span className="flex items-center gap-1 bg-amber-500/10 text-amber-600 border border-amber-500/30 px-3 py-1 rounded-lg">
                <ArrowRightLeft className="h-3.5 w-3.5" /> ~{diffResult.summary.transferredCount} {isJa ? "名 部署異動/役職変更" : "Transferred"}
              </span>
              <span className="flex items-center gap-1 bg-secondary text-secondary-foreground border border-border px-3 py-1 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" /> {diffResult.summary.unchangedCount} {isJa ? "名 変更なし" : "Unchanged"}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {isJa
              ? `【${formatDisplayText(baseDate, baseTime)}】から【${formatDisplayText(targetDate, targetTime)}】までの変更点: 新規追加 ${diffResult.summary.addedCount}名、退職/除外 ${diffResult.summary.removedCount}名、部署異動・役職変更 ${diffResult.summary.transferredCount}名です。`
              : `Comparison between [${formatDisplayText(baseDate, baseTime)}] and [${formatDisplayText(targetDate, targetTime)}]: ${diffResult.summary.addedCount} added, ${diffResult.summary.removedCount} removed, and ${diffResult.summary.transferredCount} transferred.`}
          </p>

          {/* List of Transfers if any */}
          {diffResult.transferred.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {isJa ? "主な異動・変更履歴:" : "Transfers & Role Changes:"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {diffResult.transferred.map((tr) => (
                  <div
                    key={tr.employee.id}
                    className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-foreground flex items-center justify-between"
                  >
                    <span className="font-semibold">
                      {tr.employee.firstName} {tr.employee.lastName}
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {tr.oldDepartment} ({tr.oldTitle}) ➔ {tr.newDepartment} ({tr.newTitle})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border gap-4">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">
            {isJa ? "差分データを計算・取得中..." : "Calculating snapshot diff..."}
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border text-destructive">
          <p className="font-semibold">{error}</p>
        </div>
      ) : viewMode === "unified" ? (
        /* Unified Diff View */
        <div className="relative w-full overflow-x-auto bg-card rounded-2xl border border-border p-6">
          <div className="text-left mb-6 border-b border-border pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {isJa ? "統合組織図差分 (Unified Organogram Diff)" : "Unified Organogram Diff"}
              </h2>
              <p className="text-xs text-muted-foreground">
                🟢 {isJa ? "新規追加" : "Added"} | 🔴 {isJa ? "退職/除外" : "Removed"} | 🟡 {isJa ? "部署異動" : "Transferred"}
              </p>
            </div>
            <span className="text-xs font-mono bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md">
              Unified View Mode
            </span>
          </div>

          <div className="w-fit bg-white text-black p-8 border border-black min-w-[1100px] rounded-lg shadow-sm">
            <div className="space-y-6">
              {unifiedTree.map((rootNode) => (
                <div
                  key={rootNode.department.id}
                  className="border-b border-dashed border-gray-400 pb-6 last:border-b-0 last:pb-0"
                >
                  <DiffOrgChartTree
                    node={rootNode}
                    isLast={true}
                    depth={0}
                    diffMap={diffMap}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Side-by-Side Comparison View */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Panel: Snapshot A (Base) */}
          <div className="bg-card rounded-2xl border border-border p-6 overflow-x-auto">
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">
                  {isJa ? "比較元 Snapshot A" : "Base Snapshot A"}
                </h3>
                <p className="text-xs font-mono text-muted-foreground">{formatDisplayText(baseDate, baseTime)}</p>
              </div>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                {snapshotA.employees.length} {isJa ? "名" : "employees"}
              </span>
            </div>

            <div className="w-fit bg-white text-black p-6 border border-black min-w-[600px] rounded-lg">
              <div className="space-y-6">
                {snapshotA.tree.map((rootNode) => (
                  <div
                    key={rootNode.department.id}
                    className="border-b border-dashed border-gray-400 pb-6 last:border-b-0 last:pb-0"
                  >
                    <OrgChartTree node={rootNode} isLast={true} ancestorsIsLast={[]} depth={0} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Snapshot B (Target) */}
          <div className="bg-card rounded-2xl border border-border p-6 overflow-x-auto">
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">
                  {isJa ? "比較先 Snapshot B" : "Target Snapshot B"}
                </h3>
                <p className="text-xs font-mono font-semibold text-emerald-600">
                  {formatDisplayText(targetDate, targetTime)}
                </p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 px-2 py-1 rounded">
                {snapshotB.employees.length} {isJa ? "名" : "employees"}
              </span>
            </div>

            <div className="w-fit bg-white text-black p-6 border border-black min-w-[600px] rounded-lg">
              <div className="space-y-6">
                {snapshotB.tree.map((rootNode) => (
                  <div
                    key={rootNode.department.id}
                    className="border-b border-dashed border-gray-400 pb-6 last:border-b-0 last:pb-0"
                  >
                    <OrgChartTree node={rootNode} isLast={true} ancestorsIsLast={[]} depth={0} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

