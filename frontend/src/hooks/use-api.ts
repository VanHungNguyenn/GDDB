import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Class, Student, StudentDetail, EvaluationDomain,
  Evaluation, ReportData, PaginatedResult, UserWithCount,
} from "@/types";

// ─── Classes ──────────────────────────────────────────────

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get<Class[]>("/classes")).data,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => api.post("/classes", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string }) =>
      api.patch(`/classes/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

// ─── Students ─────────────────────────────────────────────

export function useStudents(classId: string | undefined, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["students", classId, page, limit],
    queryFn: async () =>
      (await api.get<PaginatedResult<Student>>("/students", { params: { classId, page, limit } })).data,
    enabled: !!classId,
  });
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: ["students", id],
    queryFn: async () => (await api.get<StudentDetail>(`/students/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { firstName: string; lastName: string; classId: string; dateOfBirth?: string; parentName?: string; parentPhone?: string }) =>
      api.post("/students", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; firstName?: string; lastName?: string; dateOfBirth?: string; parentName?: string; parentPhone?: string }) =>
      api.patch(`/students/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

// ─── Evaluation Domains ───────────────────────────────────

export function useDomains() {
  return useQuery({
    queryKey: ["domains"],
    queryFn: async () => (await api.get<EvaluationDomain[]>("/evaluation-domains")).data,
  });
}

// ─── Evaluations ──────────────────────────────────────────

export function useEvaluationsByClass(classId: string | undefined, year: number, month: number) {
  return useQuery({
    queryKey: ["evaluations", "class", classId, year, month],
    queryFn: async () =>
      (await api.get<Evaluation[]>("/evaluations", { params: { classId, year, month } })).data,
    enabled: !!classId,
  });
}

export function useEvaluationByStudent(studentId: string | undefined, year: number, month: number) {
  return useQuery({
    queryKey: ["evaluations", "student", studentId, year, month],
    queryFn: async () =>
      (await api.get<Evaluation>("/evaluations/by-student", { params: { studentId, year, month } })).data,
    enabled: !!studentId,
    retry: false,
  });
}

export function useEvaluation(id: string | undefined) {
  return useQuery({
    queryKey: ["evaluations", id],
    queryFn: async () => (await api.get<Evaluation>(`/evaluations/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: string; year: number; month: number; notes?: string }) =>
      api.post<Evaluation>("/evaluations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluations"] }),
  });
}

export function useUpdateSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sections }: { id: string; sections: { domainId: string; indicator?: string | null; note?: string | null }[] }) =>
      api.patch(`/evaluations/${id}/sections`, { sections }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluations"] }),
  });
}

export function useFinalizeEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/evaluations/${id}/finalize`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluations"] }),
  });
}

// ─── Users (Admin) ───────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<UserWithCount[]>("/users")).data,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) =>
      api.post("/users", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; firstName?: string; lastName?: string; password?: string; role?: string }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

// ─── Reports ──────────────────────────────────────────────

export function useReport(studentId: string | undefined, year: number, month: number) {
  return useQuery({
    queryKey: ["reports", studentId, year, month],
    queryFn: async () =>
      (await api.get<ReportData>(`/reports/student/${studentId}`, { params: { year, month } })).data,
    enabled: !!studentId && year > 0 && month > 0,
    retry: false,
  });
}

export async function downloadDocx(studentId: string, year: number, month: number) {
  const response = await api.get(`/reports/student/${studentId}/docx`, {
    params: { year, month },
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  const disposition = response.headers["content-disposition"];
  const match = disposition?.match(/filename="?(.+)"?/);
  a.download = match?.[1] || `report_${month}_${year}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
