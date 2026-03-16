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
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/classes", label: "Lớp học & Học sinh", icon: School },
  { href: "/evaluations", label: "Đánh giá", icon: ClipboardList },
  { href: "/reports", label: "Báo cáo", icon: FileText },
  { href: "/users", label: "Giáo viên", icon: UserCog, adminOnly: true },
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
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-100 bg-white transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* ── Logo ────────────────────────────── */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-slate-100",
          collapsed ? "justify-center px-0" : "px-5",
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[15px] font-bold tracking-tight text-slate-900">
                Tam Anh
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                GDDB System
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* ── Navigation ──────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>
        )}
        {navItems.filter((item) => !item.adminOnly || user?.role === "ADMIN").map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/5"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-600" />
              )}
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                  isActive
                    ? "text-indigo-600"
                    : "text-slate-400 group-hover:text-slate-600",
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Collapse toggle ─────────────────── */}
      <div className="border-t border-slate-100 px-3 py-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-400 transition-all duration-200 hover:bg-slate-50 hover:text-slate-600 cursor-pointer"
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

      {/* ── User footer ─────────────────────── */}
      <div className="border-t border-slate-100 p-3">
        <div
          className={cn(
            "flex items-center rounded-xl p-2 transition-colors",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
            {user?.lastName?.charAt(0) ?? "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-800">
                {user?.lastName} {user?.firstName}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {user?.role === "ADMIN" ? "Quản trị viên" : "Giáo viên"}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500 cursor-pointer"
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
