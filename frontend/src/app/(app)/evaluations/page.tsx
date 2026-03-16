"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClasses, useStudents } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList } from "lucide-react";

export default function EvaluationsIndexPage() {
  const router = useRouter();
  const { data: classes } = useClasses();
  const [classId, setClassId] = useState("");
  const { data: studentsResult } = useStudents(classId || undefined);

  return (
    <div>
      <h1 className="text-2xl font-bold">Đánh giá</h1>
      <p className="mb-6 text-muted-foreground">Chọn lớp, sau đó nhấn vào học sinh để mở đánh giá</p>

      <div className="mb-6 max-w-xs">
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn lớp" />
          </SelectTrigger>
          <SelectContent>
            {classes?.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {classId && studentsResult?.data.length === 0 && (
        <p className="text-muted-foreground">Chưa có học sinh trong lớp này.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {studentsResult?.data.map((s) => (
          <Card
            key={s.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push(`/evaluations/${s.id}`)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{s.lastName} {s.firstName}</p>
                <p className="text-xs text-muted-foreground">Nhấn để đánh giá</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
