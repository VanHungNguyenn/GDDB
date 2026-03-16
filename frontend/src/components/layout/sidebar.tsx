"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  School,
  UserCog,
  ClipboardList,
  FileText,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard",   label: "Tổng quan",         icon: LayoutDashboard },
  { href: "/classes",     label: "Lớp học & Học sinh", icon: School },
  { href: "/evaluations", label: "Đánh giá",           icon: ClipboardList },
  { href: "/reports",     label: "Báo cáo",            icon: FileText },
  { href: "/users",       label: "Giáo viên",          icon: UserCog, adminOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col",
        "border-r border-sidebar-border bg-sidebar",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-18" : "w-65",
      )}
    >
      {/* ── Logo ──────────────────────────────────── */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-0" : "px-5",
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
                Tam Anh
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                GDDB System
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* ── Navigation ────────────────────────────── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
        )}
        {navItems
          .filter((item) => !item.adminOnly || user?.role === "ADMIN")
          .map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-sidebar-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <item.icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-sidebar-foreground",
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
      </nav>

      {/* ── Collapse toggle ─────────────────────────── */}
      <div className="border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center">
          <button
            onClick={onToggle}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2",
              "text-sm font-medium text-muted-foreground",
              "transition-all duration-200 hover:bg-accent/50 hover:text-sidebar-foreground cursor-pointer",
            )}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Thu gọn</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── User footer ───────────────────────────── */}
      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center rounded-xl p-2 transition-colors",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
            {user?.lastName?.charAt(0) ?? "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {user?.lastName} {user?.firstName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.role === "ADMIN" ? "Quản trị viên" : "Giáo viên"}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
