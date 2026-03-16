# GDDB API Reference

**Base URL:** `http://localhost:3001/api`

**Authentication:** All endpoints except `POST /auth/login` require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## Auth

### POST /api/auth/login

Login and receive a JWT token.

**Auth:** None

**Request:**
```json
{
  "email": "teacher1@example.com",
  "password": "teacher123"
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "teacher1@example.com",
    "firstName": "Nguyen Thi",
    "lastName": "Hoa",
    "role": "TEACHER"
  }
}
```

**Error `401`:**
```json
{ "statusCode": 401, "message": "Invalid credentials" }
```

---

### GET /api/auth/me

Get the current authenticated user's profile.

**Auth:** JWT

**Response `200`:**
```json
{
  "id": "a1b2c3d4-...",
  "email": "teacher1@example.com",
  "firstName": "Nguyen Thi",
  "lastName": "Hoa",
  "role": "TEACHER",
  "createdAt": "2026-01-15T08:00:00.000Z",
  "updatedAt": "2026-01-15T08:00:00.000Z"
}
```

---

## Classes

### POST /api/classes

Create a new class for the current teacher.

**Auth:** JWT

**Request:**
```json
{
  "name": "Lop Mat Troi"
}
```

**Response `201`:**
```json
{
  "id": "c1d2e3f4-...",
  "name": "Lop Mat Troi",
  "teacherId": "a1b2c3d4-...",
  "createdAt": "2026-03-15T10:00:00.000Z",
  "updatedAt": "2026-03-15T10:00:00.000Z",
  "_count": { "students": 0 }
}
```

---

### GET /api/classes

List all classes for the current teacher.

**Auth:** JWT

**Response `200`:**
```json
[
  {
    "id": "c1d2e3f4-...",
    "name": "Lop Cau Vong",
    "teacherId": "a1b2c3d4-...",
    "createdAt": "2026-01-15T08:00:00.000Z",
    "updatedAt": "2026-01-15T08:00:00.000Z",
    "_count": { "students": 6 }
  },
  {
    "id": "c2d3e4f5-...",
    "name": "Lop Mat Troi",
    "teacherId": "a1b2c3d4-...",
    "createdAt": "2026-01-15T08:00:00.000Z",
    "updatedAt": "2026-01-15T08:00:00.000Z",
    "_count": { "students": 8 }
  }
]
```

---

### GET /api/classes/:id

Get class detail with students list.

**Auth:** JWT

**Response `200`:**
```json
{
  "id": "c1d2e3f4-...",
  "name": "Lop Mat Troi",
  "teacherId": "a1b2c3d4-...",
  "createdAt": "2026-01-15T08:00:00.000Z",
  "updatedAt": "2026-01-15T08:00:00.000Z",
  "_count": { "students": 2 },
  "students": [
    {
      "id": "s1a2b3c4-...",
      "firstName": "An",
      "lastName": "Nguyen",
      "dateOfBirth": "2020-05-12T00:00:00.000Z",
      "parentName": "Nguyen Thanh",
      "parentPhone": "0901234567",
      "classId": "c1d2e3f4-...",
      "createdAt": "2026-01-15T08:00:00.000Z",
      "updatedAt": "2026-01-15T08:00:00.000Z"
    }
  ]
}
```

**Error `403`:** Teacher does not own this class.

---

### PATCH /api/classes/:id

Update a class.

**Auth:** JWT

**Request:**
```json
{
  "name": "Lop Mat Troi - Updated"
}
```

**Response `200`:** Updated class object (same shape as create).

---

### DELETE /api/classes/:id

Delete a class and all its students.

**Auth:** JWT

**Response `200`:** Deleted class object.

---

## Students

### POST /api/students

Create a new student in a class.

**Auth:** JWT

**Request:**
```json
{
  "firstName": "An",
  "lastName": "Nguyen",
  "dateOfBirth": "2020-05-12",
  "parentName": "Nguyen Thanh",
  "parentPhone": "0901234567",
  "classId": "c1d2e3f4-..."
}
```

**Response `201`:**
```json
{
  "id": "s1a2b3c4-...",
  "firstName": "An",
  "lastName": "Nguyen",
  "dateOfBirth": "2020-05-12T00:00:00.000Z",
  "parentName": "Nguyen Thanh",
  "parentPhone": "0901234567",
  "classId": "c1d2e3f4-...",
  "createdAt": "2026-03-15T10:00:00.000Z",
  "updatedAt": "2026-03-15T10:00:00.000Z"
}
```

---

### GET /api/students?classId=&page=&limit=

List students in a class (paginated).

**Auth:** JWT

**Query params:**

| Param | Type | Required | Default |
|-------|------|----------|---------|
| `classId` | UUID | Yes | — |
| `page` | int | No | 1 |
| `limit` | int | No | 20 (max 100) |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "s1a2b3c4-...",
      "firstName": "An",
      "lastName": "Nguyen",
      "dateOfBirth": "2020-05-12T00:00:00.000Z",
      "parentName": "Nguyen Thanh",
      "parentPhone": "0901234567",
      "classId": "c1d2e3f4-...",
      "createdAt": "2026-01-15T08:00:00.000Z",
      "updatedAt": "2026-01-15T08:00:00.000Z"
    }
  ],
  "meta": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### GET /api/students/:id

Get student detail with class info and recent evaluations.

**Auth:** JWT

**Response `200`:**
```json
{
  "id": "s1a2b3c4-...",
  "firstName": "An",
  "lastName": "Nguyen",
  "dateOfBirth": "2020-05-12T00:00:00.000Z",
  "parentName": "Nguyen Thanh",
  "parentPhone": "0901234567",
  "classId": "c1d2e3f4-...",
  "createdAt": "2026-01-15T08:00:00.000Z",
  "updatedAt": "2026-01-15T08:00:00.000Z",
  "class": {
    "id": "c1d2e3f4-...",
    "name": "Lop Mat Troi",
    "teacherId": "a1b2c3d4-..."
  },
  "evaluations": [
    {
      "id": "e1f2g3h4-...",
      "year": 2026,
      "month": 2,
      "status": "FINALIZED",
      "notes": null,
      "createdAt": "2026-02-15T08:00:00.000Z"
    }
  ]
}
```

---

### PATCH /api/students/:id

Update a student.

**Auth:** JWT

**Request:**
```json
{
  "parentPhone": "0987654321"
}
```

**Response `200`:** Updated student object.

---

### DELETE /api/students/:id

Delete a student and all their evaluations.

**Auth:** JWT

**Response `200`:** Deleted student object.

---

## Evaluation Domains

### GET /api/evaluation-domains

List all evaluation domains.

**Auth:** JWT

**Response `200`:**
```json
[
  { "id": "d1e2f3-...", "name": "Van dong tho", "order": 1, "createdAt": "...", "updatedAt": "..." },
  { "id": "d2e3f4-...", "name": "Van dong tinh", "order": 2, "createdAt": "...", "updatedAt": "..." },
  { "id": "d3e4f5-...", "name": "Ky nang Bat chuoc", "order": 3, "createdAt": "...", "updatedAt": "..." },
  { "id": "d4e5f6-...", "name": "Luyen hoi/co quan cau am", "order": 4, "createdAt": "...", "updatedAt": "..." },
  { "id": "d5e6f7-...", "name": "Nhan thuc", "order": 5, "createdAt": "...", "updatedAt": "..." },
  { "id": "d6e7f8-...", "name": "Ngon ngu the hien", "order": 6, "createdAt": "...", "updatedAt": "..." },
  { "id": "d7e8f9-...", "name": "Ngon ngu tiep nhan", "order": 7, "createdAt": "...", "updatedAt": "..." },
  { "id": "d8e9f0-...", "name": "Ky nang tu phuc vu", "order": 8, "createdAt": "...", "updatedAt": "..." },
  { "id": "d9e0f1-...", "name": "Ky nang Giao tiep - Xa hoi", "order": 9, "createdAt": "...", "updatedAt": "..." },
  { "id": "d0e1f2-...", "name": "Tap trung chu y - Giao tiep mat", "order": 10, "createdAt": "...", "updatedAt": "..." },
  { "id": "d1e2f3-...", "name": "Cac van de ve hanh vi", "order": 11, "createdAt": "...", "updatedAt": "..." }
]
```

---

### POST /api/evaluation-domains

Create a new evaluation domain.

**Auth:** JWT + **ADMIN only**

**Request:**
```json
{
  "name": "Ky nang moi",
  "order": 12
}
```

**Response `201`:**
```json
{
  "id": "d-new-...",
  "name": "Ky nang moi",
  "order": 12,
  "createdAt": "2026-03-15T10:00:00.000Z",
  "updatedAt": "2026-03-15T10:00:00.000Z"
}
```

**Error `403`:** Non-admin user.

---

### PATCH /api/evaluation-domains/:id

Update domain name or order.

**Auth:** JWT + **ADMIN only**

**Request:**
```json
{
  "name": "Updated name",
  "order": 5
}
```

**Response `200`:** Updated domain object.

---

### DELETE /api/evaluation-domains/:id

Delete an evaluation domain.

**Auth:** JWT + **ADMIN only**

**Response `200`:** Deleted domain object.

---

## Evaluations

### POST /api/evaluations

Create a monthly evaluation for a student. Automatically generates one `EvaluationSection` per existing domain.

**Auth:** JWT

**Request:**
```json
{
  "studentId": "s1a2b3c4-...",
  "year": 2026,
  "month": 3,
  "notes": "Optional general note"
}
```

**Response `201`:**
```json
{
  "id": "e1f2g3h4-...",
  "studentId": "s1a2b3c4-...",
  "teacherId": "a1b2c3d4-...",
  "year": 2026,
  "month": 3,
  "notes": "Optional general note",
  "status": "DRAFT",
  "finalizedAt": null,
  "finalizedById": null,
  "createdAt": "2026-03-15T10:00:00.000Z",
  "updatedAt": "2026-03-15T10:00:00.000Z",
  "student": { "id": "...", "firstName": "An", "lastName": "Nguyen", "..." : "..." },
  "sections": [
    {
      "id": "sec1-...",
      "evaluationId": "e1f2g3h4-...",
      "domainId": "d1e2f3-...",
      "note": null,
      "indicator": null,
      "domain": { "id": "d1e2f3-...", "name": "Van dong tho", "order": 1 }
    },
    {
      "id": "sec2-...",
      "evaluationId": "e1f2g3h4-...",
      "domainId": "d2e3f4-...",
      "note": null,
      "indicator": null,
      "domain": { "id": "d2e3f4-...", "name": "Van dong tinh", "order": 2 }
    }
  ],
  "finalizedBy": null
}
```

**Error `409`:** Evaluation already exists for this student/month/year.

---

### GET /api/evaluations?classId=&year=&month=

List all evaluations for a class in a given month.

**Auth:** JWT

**Query params:**

| Param | Type | Required |
|-------|------|----------|
| `classId` | UUID | Yes |
| `year` | int | Yes |
| `month` | int (1-12) | Yes |

**Response `200`:** Array of evaluation objects (same shape as create response), ordered by student last name.

---

### GET /api/evaluations/by-student?studentId=&year=&month=

Get a single evaluation for a specific student and month.

**Auth:** JWT

**Query params:**

| Param | Type | Required |
|-------|------|----------|
| `studentId` | UUID | Yes |
| `year` | int | Yes |
| `month` | int (1-12) | Yes |

**Response `200`:** Single evaluation object with sections.

**Error `404`:** No evaluation found for the given period.

---

### GET /api/evaluations/:id

Get evaluation by ID.

**Auth:** JWT

**Response `200`:** Evaluation object with sections, student, and finalizedBy.

---

### PATCH /api/evaluations/:id/sections

Update evaluation sections (notes and indicators).

**Auth:** JWT

**Request:**
```json
{
  "sections": [
    {
      "domainId": "d1e2f3-...",
      "indicator": "ACHIEVED",
      "note": "Student completed all motor tasks independently"
    },
    {
      "domainId": "d2e3f4-...",
      "indicator": "NEEDS_ASSISTANCE",
      "note": "Can hold pen but needs help with cutting"
    },
    {
      "domainId": "d3e4f5-...",
      "indicator": "NOT_ACHIEVED",
      "note": null
    }
  ]
}
```

**Indicator values:** `"ACHIEVED"` | `"NEEDS_ASSISTANCE"` | `"NOT_ACHIEVED"` | `null`

**Response `200`:** Full evaluation object with updated sections.

**Error `400`:** Evaluation is finalized.

---

### PATCH /api/evaluations/:id/notes

Update the evaluation's general notes.

**Auth:** JWT

**Request:**
```json
{
  "notes": "Overall good progress this month"
}
```

**Response `200`:** Updated evaluation object.

**Error `400`:** Evaluation is finalized.

---

### POST /api/evaluations/:id/finalize

Finalize an evaluation. Locks it from further edits.

**Auth:** JWT

**Response `200`:**
```json
{
  "id": "e1f2g3h4-...",
  "status": "FINALIZED",
  "finalizedAt": "2026-03-15T14:30:00.000Z",
  "finalizedById": "a1b2c3d4-...",
  "finalizedBy": {
    "id": "a1b2c3d4-...",
    "firstName": "Nguyen Thi",
    "lastName": "Hoa"
  },
  "sections": [ "..." ]
}
```

**Error `400`:** Already finalized.

---

## Reports

### GET /api/reports/student/:studentId?year=&month=

Get a structured report (JSON) for a student's monthly evaluation.

**Auth:** JWT

**Query params:**

| Param | Type | Required |
|-------|------|----------|
| `year` | int | Yes |
| `month` | int (1-12) | Yes |

**Response `200`:**
```json
{
  "student": {
    "id": "s1a2b3c4-...",
    "name": "Nguyen An",
    "dateOfBirth": "2020-05-12T00:00:00.000Z",
    "parentName": "Nguyen Thanh",
    "parentPhone": "0901234567",
    "className": "Lop Mat Troi"
  },
  "evaluation": {
    "id": "e1f2g3h4-...",
    "month": 3,
    "year": 2026,
    "status": "FINALIZED",
    "notes": "Good progress this month",
    "teacherName": "Hoa Nguyen Thi",
    "finalizedAt": "2026-03-15T14:30:00.000Z"
  },
  "sections": [
    {
      "domain": "Van dong tho",
      "note": "Walks steadily, runs well. Practicing jumping.",
      "indicator": "ACHIEVED"
    },
    {
      "domain": "Van dong tinh",
      "note": "Holds pen well, coloring within lines.",
      "indicator": "NEEDS_ASSISTANCE"
    },
    {
      "domain": "Ky nang Bat chuoc",
      "note": null,
      "indicator": "NOT_ACHIEVED"
    }
  ]
}
```

---

### GET /api/reports/student/:studentId/docx?year=&month=

Download the evaluation report as a Word document (DOCX).

**Auth:** JWT

**Query params:**

| Param | Type | Required |
|-------|------|----------|
| `year` | int | Yes |
| `month` | int (1-12) | Yes |

**Response:** Binary DOCX file download.

**Headers:**
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="KHGDCN_Nguyen_An_T3_2026.docx"
```

**Usage (frontend):**
```javascript
const response = await fetch(
  `/api/reports/student/${studentId}/docx?year=2026&month=3`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'report.docx';
a.click();
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

| Status | Meaning |
|--------|---------|
| `400` | Validation error or business rule violation (e.g., finalized evaluation) |
| `401` | Missing or invalid JWT token |
| `403` | Access denied (wrong teacher or non-admin) |
| `404` | Resource not found |
| `409` | Conflict (e.g., duplicate evaluation for same month) |

---

## Enums

### Role
```
ADMIN | TEACHER
```

### EvaluationIndicator
```
ACHIEVED         → displayed as "+"
NEEDS_ASSISTANCE → displayed as "+/-"
NOT_ACHIEVED     → displayed as "-"
```

### EvaluationStatus
```
DRAFT | FINALIZED
```
