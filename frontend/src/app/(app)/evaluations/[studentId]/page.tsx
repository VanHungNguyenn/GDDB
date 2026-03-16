"use client";

import { useState, useEffect, use } from "react";
import {
  useStudent, useEvaluationByStudent, useCreateEvaluation,
  useUpdateSections, useFinalizeEvaluation, useDomains,
} from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Lock } from "lucide-react";
import Link from "next/link";
import type { EvaluationIndicator } from "@/types";

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const INDICATOR_OPTIONS: { value: EvaluationIndicator; label: string; color: string }[] = [
  { value: "ACHIEVED", label: "+", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { value: "NEEDS_ASSISTANCE", label: "+/-", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { value: "NOT_ACHIEVED", label: "-", color: "bg-red-100 text-red-800 border-red-300" },
];

export default function EvaluationPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: student } = useStudent(studentId);
  const { data: domains } = useDomains();
  const { data: evaluation, isError } = useEvaluationByStudent(studentId, year, month);

  const createEvaluation = useCreateEvaluation();
  const updateSections = useUpdateSections();
  const finalizeEvaluation = useFinalizeEvaluation();

  // Local state for section edits
  const [localSections, setLocalSections] = useState<
    Record<string, { note: string; indicator: EvaluationIndicator | null }>
  >({});

  // Sync from server data
  useEffect(() => {
    if (evaluation?.sections) {
      const map: typeof localSections = {};
      for (const s of evaluation.sections) {
        map[s.domainId] = { note: s.note ?? "", indicator: s.indicator };
      }
      setLocalSections(map);
    }
  }, [evaluation]);

  const handleCreate = async () => {
    await createEvaluation.mutateAsync({ studentId, year, month });
  };

  const handleSave = async () => {
    if (!evaluation) return;
    const sections = Object.entries(localSections).map(([domainId, data]) => ({
      domainId,
      indicator: data.indicator,
      note: data.note || null,
    }));
    await updateSections.mutateAsync({ id: evaluation.id, sections });
  };

  const handleFinalize = async () => {
    if (!evaluation) return;
    if (confirm("Hoàn tất đánh giá? Sau khi hoàn tất sẽ không thể chỉnh sửa.")) {
      await handleSave();
      await finalizeEvaluation.mutateAsync(evaluation.id);
    }
  };

  const updateSection = (domainId: string, field: "note" | "indicator", value: string | null) => {
    setLocalSections((prev) => ({
      ...prev,
      [domainId]: { ...prev[domainId], [field]: value },
    }));
  };

  const isFinalized = evaluation?.status === "FINALIZED";

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/evaluations" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold">
          {student ? `${student.lastName} ${student.firstName}` : "Đang tải..."}
        </h1>
        {student?.class && <p className="text-muted-foreground">{student.class.name}</p>}
      </div>

      {/* Month/Year selector */}
      <div className="mb-6 flex items-center gap-4">
        <Select value={month.toString()} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFinalized && <Badge variant="success">Đã hoàn tất</Badge>}
        {evaluation && !isFinalized && <Badge variant="warning">Bản nháp</Badge>}
      </div>

      {/* No evaluation yet */}
      {isError && !evaluation && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="mb-4 text-muted-foreground">Chưa có đánh giá cho {MONTHS[month - 1]} {year}</p>
            <Button onClick={handleCreate} disabled={createEvaluation.isPending}>
              {createEvaluation.isPending ? "Đang tạo..." : "Tạo đánh giá"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Evaluation sections */}
      {evaluation && domains && (
        <>
          <div className="space-y-4">
            {domains.map((domain) => {
              const section = localSections[domain.id] ?? { note: "", indicator: null };
              return (
                <Card key={domain.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{domain.name}</CardTitle>
                      {/* Indicator buttons */}
                      <div className="flex gap-1">
                        {INDICATOR_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={isFinalized}
                            onClick={() =>
                              updateSection(
                                domain.id,
                                "indicator",
                                section.indicator === opt.value ? null : opt.value
                              )
                            }
                            className={`rounded-md border px-3 py-1 text-sm font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                              section.indicator === opt.value
                                ? opt.color
                                : "border-border bg-background text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Nhập nội dung đánh giá cho lĩnh vực này..."
                      value={section.note}
                      onChange={(e) => updateSection(domain.id, "note", e.target.value)}
                      disabled={isFinalized}
                      rows={3}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action buttons */}
          {!isFinalized && (
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={handleSave} disabled={updateSections.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateSections.isPending ? "Đang lưu..." : "Lưu nháp"}
              </Button>
              <Button onClick={handleFinalize} disabled={finalizeEvaluation.isPending}>
                <Lock className="mr-2 h-4 w-4" />
                {finalizeEvaluation.isPending ? "Đang hoàn tất..." : "Hoàn tất đánh giá"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
