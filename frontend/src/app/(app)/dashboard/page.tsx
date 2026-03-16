"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useClasses, useEvaluationsByClass } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  School,
  Users,
  ClipboardCheck,
  FileText,
  ArrowRight,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

const MONTH_NAMES = [
  "",
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

// ── Skeleton primitives ──────────────────────────
function SkeletonCard() {
  return (
    <div className="h-35 animate-pulse rounded-2xl border border-slate-100 bg-white p-6">
      <div className="flex justify-between">
        <div className="h-3 w-20 rounded-md bg-slate-100" />
        <div className="h-9 w-9 rounded-xl bg-slate-100" />
      </div>
      <div className="mt-5 h-7 w-16 rounded-md bg-slate-100" />
      <div className="mt-2 h-3 w-28 rounded-md bg-slate-50" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-xl p-4">
      <div className="h-10 w-10 rounded-xl bg-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded-md bg-slate-100" />
        <div className="h-2.5 w-20 rounded-md bg-slate-50" />
      </div>
      <div className="h-6 w-20 rounded-full bg-slate-100" />
    </div>
  );
}

// ── Stat card config ─────────────────────────────
const STAT_CONFIGS = [
  {
    key: "classes",
    label: "Lớp học",
    icon: School,
    bg: "bg-blue-50",
    text: "text-blue-600",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    key: "students",
    label: "Học sinh",
    icon: Users,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    key: "evaluations",
    label: "Đánh giá tháng này",
    icon: ClipboardCheck,
    bg: "bg-amber-50",
    text: "text-amber-600",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    key: "progress",
    label: "Tiến độ",
    icon: TrendingUp,
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    gradient: "from-indigo-500 to-violet-600",
  },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: classes, isLoading: classesLoading } = useClasses();

  const classIds = useMemo(() => (classes ?? []).slice(0, 6).map((c) => c.id), [classes]);
  const { data: evals0 } = useEvaluationsByClass(classIds[0], currentYear, currentMonth);
  const { data: evals1 } = useEvaluationsByClass(classIds[1], currentYear, currentMonth);
  const { data: evals2 } = useEvaluationsByClass(classIds[2], currentYear, currentMonth);
  const { data: evals3 } = useEvaluationsByClass(classIds[3], currentYear, currentMonth);
  const { data: evals4 } = useEvaluationsByClass(classIds[4], currentYear, currentMonth);
  const { data: evals5 } = useEvaluationsByClass(classIds[5], currentYear, currentMonth);

  const evalsMap = useMemo(() => {
    const map = new Map<string, typeof evals0>();
    const evalsList = [evals0, evals1, evals2, evals3, evals4, evals5];
    classIds.forEach((id, i) => {
      if (id && evalsList[i]) map.set(id, evalsList[i]);
    });
    return map;
  }, [classIds, evals0, evals1, evals2, evals3, evals4, evals5]);

  const allEvals = useMemo(() => Array.from(evalsMap.values()).flat(), [evalsMap]);

  const totalClasses = classes?.length ?? 0;
  const totalStudents = classes?.reduce((s, c) => s + (c._count?.students ?? 0), 0) ?? 0;
  const totalEvals = allEvals.length;
  const finalizedEvals = allEvals.filter((e) => e?.status === "FINALIZED").length;
  const draftEvals = totalEvals - finalizedEvals;
  const notStarted = Math.max(0, totalStudents - totalEvals);
  const completionRate = totalStudents > 0 ? Math.round((totalEvals / totalStudents) * 100) : 0;

  const isLoading = classesLoading;

  const hour = now.getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const statValues: Record<string, { value: string; sub: string }> = {
    classes:     { value: String(totalClasses),   sub: "đang hoạt động" },
    students:    { value: String(totalStudents),  sub: `trong ${totalClasses} lớp` },
    evaluations: { value: String(totalEvals),     sub: `${finalizedEvals} hoàn thành · ${draftEvals} nháp` },
    progress:    { value: `${completionRate}%`,   sub: `${totalEvals}/${totalStudents} học sinh` },
  };

  return (
    <div className="space-y-8">
      {/* ══════════════ Header ══════════════ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {greeting}, {user?.lastName} {user?.firstName}
            </h1>
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-1 text-[14px] text-slate-500">
            {MONTH_NAMES[currentMonth]} {currentYear} — Tổng quan hệ thống đánh giá
          </p>
        </div>
        <Link
          href="/classes"
          className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          Tạo lớp mới
        </Link>
      </div>

      {/* ══════════════ Stat Cards ══════════════ */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_CONFIGS.map((cfg) => {
            const v = statValues[cfg.key];
            const isProgress = cfg.key === "progress";
            return (
              <Card key={cfg.key} className="group relative overflow-hidden border-slate-200/40">
                {/* Decorative gradient blob */}
                <div
                  className={cn(
                    "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.06] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.12]",
                    `bg-linear-to-br`,
                    cfg.gradient,
                  )}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[13px] font-medium text-slate-500">
                    {cfg.label}
                  </CardTitle>
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                      cfg.bg,
                    )}
                  >
                    <cfg.icon className={cn("h-4.5 w-4.5", cfg.text)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">
                    {v.value}
                  </p>
                  {isProgress ? (
                    <div className="mt-3 space-y-1.5">
                      <div className="h-1.5-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
                          style={{ width: `${Math.min(completionRate, 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] font-medium text-slate-400">{v.sub}</p>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[12px] font-medium text-slate-400">{v.sub}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ══════════════ Main Grid ══════════════ */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* ── Class list (2/3) ── */}
        <div className="xl:col-span-2">
          <Card className="border-slate-200/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Danh sách lớp học</CardTitle>
                <CardDescription className="mt-1">
                  Tình trạng đánh giá {MONTH_NAMES[currentMonth]}
                </CardDescription>
              </div>
              <Link
                href="/classes"
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-indigo-600 transition-colors duration-200 hover:bg-indigo-50"
              >
                Xem tất cả
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-1">
                  {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
                </div>
              ) : totalClasses === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                    <School className="h-7 w-7 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Chưa có lớp học nào</p>
                  <p className="mt-1 text-[13px] text-slate-400">
                    Bắt đầu bằng cách tạo lớp học đầu tiên
                  </p>
                  <Link
                    href="/classes"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo lớp đầu tiên
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {classes?.map((cls) => {
                    const classEvals = evalsMap.get(cls.id) ?? [];
                    const studentCount = cls._count?.students ?? 0;
                    const evalCount = classEvals.length;
                    const finalCount = classEvals.filter((e) => e.status === "FINALIZED").length;
                    const pct = studentCount > 0 ? Math.round((evalCount / studentCount) * 100) : 0;
                    const isComplete = finalCount === studentCount && studentCount > 0;

                    return (
                      <Link
                        key={cls.id}
                        href="/classes"
                        className="group flex items-center justify-between rounded-xl p-4 transition-all duration-200 hover:bg-slate-50/80"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 shadow-sm shadow-blue-500/5">
                            <School className="h-4.5 w-4.5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-slate-800 transition-colors duration-200 group-hover:text-indigo-700">
                              {cls.name}
                            </p>
                            <p className="text-[12px] text-slate-400">{studentCount} học sinh</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {studentCount > 0 && (
                            <div className="flex items-center gap-2.5">
                              {/* Mini progress ring */}
                              <div className="relative h-9 w-9">
                                <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
                                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                                  <circle
                                    cx="18" cy="18" r="14" fill="none"
                                    stroke={isComplete ? "#10b981" : "#6366f1"}
                                    strokeWidth="3"
                                    strokeDasharray={`${pct * 0.88} 100`}
                                    strokeLinecap="round"
                                    className="transition-all duration-700"
                                  />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-600">
                                  {pct}%
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-[13px] font-semibold text-slate-700">{evalCount}/{studentCount}</p>
                                <p className="text-[11px] text-slate-400">đánh giá</p>
                              </div>
                            </div>
                          )}

                          {isComplete ? (
                            <Badge className="rounded-lg border-0 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                              Hoàn tất
                            </Badge>
                          ) : evalCount > 0 ? (
                            <Badge className="rounded-lg border-0 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                              Đang thực hiện
                            </Badge>
                          ) : (
                            <Badge className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                              Chưa bắt đầu
                            </Badge>
                          )}

                          <ArrowRight className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="border-slate-200/40">
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                {
                  href: "/evaluations",
                  icon: ClipboardCheck,
                  label: "Đánh giá học sinh",
                  desc: "Tạo / cập nhật đánh giá",
                  bg: "bg-amber-50",
                  text: "text-amber-600",
                },
                {
                  href: "/reports",
                  icon: FileText,
                  label: "Xuất báo cáo",
                  desc: "Xem trước & tải file DOCX",
                  bg: "bg-violet-50",
                  text: "text-violet-600",
                },
                {
                  href: "/students",
                  icon: Users,
                  label: "Quản lý học sinh",
                  desc: "Thêm, sửa, xóa thông tin",
                  bg: "bg-emerald-50",
                  text: "text-emerald-600",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3.5 rounded-xl p-3.5 transition-all duration-200 hover:bg-slate-50/80"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                      item.bg,
                    )}
                  >
                    <item.icon className={cn("h-4.5 w-4.5", item.text)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900">
                      {item.label}
                    </p>
                    <p className="text-[12px] text-slate-400">{item.desc}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Evaluation status breakdown */}
          <Card className="border-slate-200/40">
            <CardHeader>
              <CardTitle>Trạng thái đánh giá</CardTitle>
              <CardDescription>{MONTH_NAMES[currentMonth]} {currentYear}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Donut chart */}
              <div className="flex items-center justify-center py-2">
                <div className="relative h-32 w-32">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    {totalStudents > 0 && (
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#10b981" strokeWidth="10"
                        strokeDasharray={`${(finalizedEvals / totalStudents) * 251.2} 251.2`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    )}
                    {totalStudents > 0 && draftEvals > 0 && (
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#f59e0b" strokeWidth="10"
                        strokeDasharray={`${(draftEvals / totalStudents) * 251.2} 251.2`}
                        strokeDashoffset={`${-(finalizedEvals / totalStudents) * 251.2}`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-800">{completionRate}%</span>
                    <span className="text-[10px] font-medium text-slate-400">hoàn thành</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              {[
                { label: "Đã hoàn thành", value: finalizedEvals, dotBg: "bg-emerald-500" },
                { label: "Đang thực hiện", value: draftEvals, dotBg: "bg-amber-500" },
                { label: "Chưa tạo", value: notStarted, dotBg: "bg-slate-300" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-2 w-2 rounded-full", item.dotBg)} />
                    <span className="text-[13px] font-medium text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-[14px] font-bold text-slate-800">{item.value}</span>
                </div>
              ))}

              {/* Alert */}
              {totalStudents > 0 && notStarted > 0 && (
                <div className="rounded-xl border border-amber-200/60 bg-linear-to-r from-amber-50 to-orange-50/50 p-3.5">
                  <p className="text-[12px] font-medium leading-relaxed text-amber-800">
                    Còn <span className="font-bold">{notStarted}</span> học sinh chưa có đánh giá
                    trong {MONTH_NAMES[currentMonth].toLowerCase()}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
