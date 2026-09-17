import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api";
import type { ChangeHistoryEntry } from "../types/index";
import { User, GitBranch, ShieldCheck, Clock } from "lucide-react";

export const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tableFilter, setTableFilter] = useState<string>("");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url = tableFilter
        ? `/api/history?table_name=${tableFilter}`
        : "/api/history";
      const data = await api.get<ChangeHistoryEntry[]>(url);
      setHistory(data);
    } catch (err: any) {
      alert(`Failed to load history log: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [tableFilter]);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr.replace(" ", "T"));
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-card p-6 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground text-base">
            {t("history.title")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            A log of all changes made to employee or department information is listed below.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">
            Filter:
          </label>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="bg-muted border border-input text-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          >
            <option value="" className="bg-card text-foreground">
              {t("history.filterAll")}
            </option>
            <option value="users" className="bg-card text-foreground">
              {t("history.filterUsers")}
            </option>
            <option value="departments" className="bg-card text-foreground">
              {t("history.filterDepts")}
            </option>
          </select>
        </div>
      </div>

      {/* History Timeline */}
      <div className="bg-card rounded-2xl border border-border p-6">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No change history found.
          </div>
        ) : (
          <div className="relative border-l-2 border-border ml-4 py-2 space-y-8">
            {history.map((entry) => {
              const isUser = entry.table_name === "users";
              return (
                <div key={entry.id} className="relative pl-6 group">
                  {/* Timeline dot */}
                  <span
                    className={`absolute -left-[11px] top-1.5 h-5 w-5 rounded-full border-4 border-card flex items-center justify-center shadow-sm text-white ${
                      entry.action_type === "CREATE"
                        ? "bg-emerald-500"
                        : entry.action_type === "UPDATE"
                          ? "bg-primary"
                          : "bg-destructive"
                    }`}
                  ></span>

                  {/* Log Content Card */}
                  <div className="bg-muted/40 border border-border/60 hover:border-border p-4 rounded-xl transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {/* Table type tag */}
                        <span
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isUser
                              ? "bg-primary/10 text-primary"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isUser ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <GitBranch className="h-3 w-3" />
                          )}
                          {isUser ? "Employee" : "Department"}
                        </span>

                        {/* Action type tag */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            entry.action_type === "CREATE"
                              ? "bg-emerald-100 text-emerald-800"
                              : entry.action_type === "UPDATE"
                                ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {entry.action_type === "CREATE"
                            ? "Added"
                            : entry.action_type === "UPDATE"
                              ? "Modified"
                              : "Deactivated"}
                        </span>

                        <span className="text-muted-foreground font-mono text-xs font-semibold">
                          ID: {entry.record_id}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(entry.changed_at)}
                      </span>
                    </div>

                    {/* Change Description */}
                    <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                      {entry.description}
                    </p>

                    {/* Metadata */}
                    <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
                        {t("history.changedBy")}:{" "}
                        <span className="font-semibold text-foreground/80">
                          {entry.changed_by || "System"}
                        </span>
                      </span>
                      <span className="font-mono">
                        System Log ID: #{entry.id}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
