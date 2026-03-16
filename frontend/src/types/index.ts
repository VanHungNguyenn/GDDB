// ─── Enums ────────────────────────────────────────────────

export type Role = "ADMIN" | "TEACHER";
export type EvaluationIndicator = "ACHIEVED" | "NEEDS_ASSISTANCE" | "NOT_ACHIEVED";
export type EvaluationStatus = "DRAFT" | "FINALIZED";

// ─── User ─────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

// ─── Class ────────────────────────────────────────────────

export interface UserWithCount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  _count: { classes: number };
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  teacher?: { id: string; firstName: string; lastName: string; email: string };
  _count: { students: number };
}

export interface ClassDetail extends Class {
  students: Student[];
}

// ─── Student ──────────────────────────────────────────────

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  parentName: string | null;
  parentPhone: string | null;
  classId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentDetail extends Student {
  class: { id: string; name: string; teacherId: string };
  evaluations: {
    id: string;
    year: number;
    month: number;
    status: EvaluationStatus;
    notes: string | null;
    createdAt: string;
  }[];
}

// ─── Evaluation Domain ────────────────────────────────────

export interface EvaluationDomain {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Evaluation ───────────────────────────────────────────

export interface EvaluationSection {
  id: string;
  evaluationId: string;
  domainId: string;
  note: string | null;
  indicator: EvaluationIndicator | null;
  domain: EvaluationDomain;
}

export interface Evaluation {
  id: string;
  studentId: string;
  teacherId: string;
  year: number;
  month: number;
  notes: string | null;
  status: EvaluationStatus;
  finalizedAt: string | null;
  finalizedById: string | null;
  createdAt: string;
  updatedAt: string;
  student: Student;
  sections: EvaluationSection[];
  finalizedBy: { id: string; firstName: string; lastName: string } | null;
}

// ─── Report ───────────────────────────────────────────────

export interface ReportData {
  student: {
    id: string;
    name: string;
    dateOfBirth: string | null;
    parentName: string | null;
    parentPhone: string | null;
    className: string;
  };
  evaluation: {
    id: string;
    month: number;
    year: number;
    status: EvaluationStatus;
    notes: string | null;
    teacherName: string;
    finalizedAt: string | null;
  };
  sections: {
    domain: string;
    note: string | null;
    indicator: EvaluationIndicator | null;
  }[];
}

// ─── Pagination ───────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
