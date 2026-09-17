import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { GitBranch, History, Network, Users, Upload, GitCompare } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    { path: "/", label: t("nav.orgChart"), icon: Network },
    { path: "/compare", label: t("nav.compare"), icon: GitCompare },
    { path: "/users", label: t("nav.employees"), icon: Users },
    { path: "/departments", label: t("nav.departments"), icon: GitBranch },
    { path: "/history", label: t("nav.history"), icon: History },
    { path: "/upload", label: t("nav.upload"), icon: Upload },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden print:bg-white print:text-black print:h-auto print:overflow-visible">
      {/* Sidebar - Hidden on print */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col print:hidden shrink-0">
        <div className="p-5 border-b border-sidebar-border flex flex-col gap-2.5">
          <img
            src="/assets/images/syslabobesidename.svg"
            alt="SYSLABO"
            className="h-7 w-auto self-start"
          />
          <p className="text-[10px] text-sidebar-foreground/50 tracking-wider font-semibold uppercase">
            {t("nav.portalTitle")}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:h-auto">
        {/* Header - Hidden on print */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 print:hidden shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-lg text-foreground">
              {menuItems.find((item) => item.path === location.pathname)
                ?.label || t("nav.portalTitle")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
};
