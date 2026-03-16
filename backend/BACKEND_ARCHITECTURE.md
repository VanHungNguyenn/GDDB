# GDDB Backend Architecture

## 1. Project Overview

GDDB (Giao Duc Dac Biet) is a web application for **Trung Tam Giao Duc Tre Dac Biet Tam Anh** — a special education center in Dong Nai, Vietnam.

The system allows teachers and administrators to:

- Manage **classes** and assign students
- Create **monthly evaluations** for each student
- Write **free-text notes** per evaluation domain and assign indicator scores
- **Finalize** evaluations to lock them from further edits
- **Export** evaluation reports as Word documents (DOCX)

### Evaluation model

Each student receives one evaluation per month. An evaluation contains **sections** — one per evaluation domain (e.g., Motor Skills, Cognition, Communication). Each section has:

- A **free-text note** written by the teacher describing the student's progress
- An **indicator**: `+` (Achieved), `+/-` (Needs Assistance), `-` (Not Achieved)

Evaluation domains are **dynamic** — administrators can create, rename, reorder, or delete them at any time.

---

## 2. Tech Stack

| Technology | Purpose |
|-----------|---------|
| **NestJS** | Backend framework (modules, dependency injection, guards, pipes) |
| **Prisma ORM** | Database access, schema management, migrations |
| **PostgreSQL** | Relational database (runs in Docker) |
| **JWT** | Authentication via `@nestjs/passport` + `passport-jwt` |
| **bcryptjs** | Password hashing |
| **class-validator** | DTO validation with decorators |
| **docx** | Programmatic Word document generation |
| **Docker** | PostgreSQL container via `docker compose` |

---

## 3. Project Folder Structure

```
src/
  main.ts                          # App bootstrap, global pipes, CORS
  app.module.ts                    # Root module, imports all feature modules
  prisma/
    prisma.module.ts               # Global Prisma module
    prisma.service.ts              # PrismaClient wrapper (connect/disconnect)
  common/
    dto/
      pagination.dto.ts            # Shared PaginationDto and PaginatedResult<T>
  modules/
    auth/                          # Authentication
      auth.module.ts
      auth.controller.ts           # POST /login, GET /me
      auth.service.ts              # JWT token generation, password verification
      dto/
        login.dto.ts
      guards/
        jwt-auth.guard.ts          # Passport JWT guard
        roles.guard.ts             # Role-based access control
      strategies/
        jwt.strategy.ts            # JWT validation, user lookup
      decorators/
        current-user.decorator.ts  # @CurrentUser() param decorator
        roles.decorator.ts         # @Roles() metadata decorator
    classes/                       # Class management
      classes.module.ts
      classes.controller.ts        # CRUD endpoints
      classes.service.ts           # Teacher ownership validation
      dto/
    students/                      # Student management
      students.module.ts
      students.controller.ts       # CRUD + paginated list
      students.service.ts          # Class ownership validation
      dto/
    evaluation-domains/            # Admin-managed evaluation domains
      evaluation-domains.module.ts
      evaluation-domains.controller.ts  # CRUD (write = ADMIN only)
      evaluation-domains.service.ts
      dto/
    evaluations/                   # Monthly evaluations
      evaluations.module.ts
      evaluations.controller.ts    # Create, query, update sections, finalize
      evaluations.service.ts       # Auto-section creation, finalization
      dto/
    reports/                       # Report generation
      reports.module.ts
      reports.controller.ts        # JSON report + DOCX download
      reports.service.ts           # Report data assembly
      docx-generator.service.ts    # Word document builder

prisma/
  schema.prisma                    # Database schema
  seed.ts                          # Seed script (domains, users, classes, students, evaluations)
```

### Module responsibilities

| Module | Responsibility |
|--------|---------------|
| `auth` | Login, JWT issuance, guards, role checking |
| `classes` | CRUD for classes, teacher-scoped access |
| `students` | CRUD for students, paginated listing, class ownership checks |
| `evaluation-domains` | Admin CRUD for evaluation domains (dynamic, not hardcoded) |
| `evaluations` | Create/read/update evaluations, auto-generate sections, finalization |
| `reports` | Assemble structured report data, generate DOCX exports |

---

## 4. Database Design

### Entity Relationship Diagram

```
User (ADMIN | TEACHER)
  |
  |── teaches ──► Class[]
  |                  |
  |                  └── contains ──► Student[]
  |                                      |
  |── creates ──────────────────► Evaluation[] (per student per month)
  |                                      |
  |── finalizes ────────────────► Evaluation.finalizedBy?
                                         |
                                         └── has ──► EvaluationSection[]
                                                         |
                                                         └── references ──► EvaluationDomain
```

### Models

**User**
```
id, email (unique), password (hashed), firstName, lastName
role: ADMIN | TEACHER
```

**Class**
```
id, name, teacherId → User
```

**Student**
```
id, firstName, lastName, dateOfBirth?, parentName?, parentPhone?
classId → Class (cascade delete)
```

**EvaluationDomain**
```
id, name (unique), order
```
Dynamic list managed by admins. Examples: "Van dong tho", "Nhan thuc", "Ngon ngu the hien".

**Evaluation**
```
id, studentId → Student, teacherId → User
year, month (unique per student)
notes?, status: DRAFT | FINALIZED
finalizedAt?, finalizedById? → User
```

**EvaluationSection**
```
id, evaluationId → Evaluation, domainId → EvaluationDomain
note? (free text), indicator?: ACHIEVED | NEEDS_ASSISTANCE | NOT_ACHIEVED
unique(evaluationId, domainId)
```

### Key constraints

- One evaluation per student per month: `@@unique([studentId, year, month])`
- One section per domain per evaluation: `@@unique([evaluationId, domainId])`
- Cascade deletes: Class → Students → Evaluations → Sections

---

## 5. Evaluation Workflow

```
1. Teacher creates evaluation
   POST /api/evaluations { studentId, year, month }
        │
        ▼
2. System auto-generates EvaluationSection
   for EVERY existing EvaluationDomain
   (ensures complete form)
        │
        ▼
3. Teacher fills in sections
   PATCH /api/evaluations/:id/sections
   { sections: [{ domainId, note, indicator }] }
        │
        ▼
4. Teacher adds general notes (optional)
   PATCH /api/evaluations/:id/notes
   { notes: "..." }
        │
        ▼
5. Teacher finalizes evaluation
   POST /api/evaluations/:id/finalize
   → status = FINALIZED
   → finalizedAt = now
   → finalizedById = teacherId
   → No further edits allowed
        │
        ▼
6. Report generation
   GET /api/reports/student/:id?year=&month=       → JSON
   GET /api/reports/student/:id/docx?year=&month=  → DOCX file
```

### Access control

- Teachers can only access students in their own classes
- Every read/write operation verifies: `student.class.teacherId === currentUser.id`
- Finalized evaluations reject all update attempts with `400 Bad Request`

---

## 6. DOCX Report Generation

The `DocxGeneratorService` builds a Word document matching the center's official paper form using the `docx` npm library.

### Document structure

```
┌─────────────────────────────────────────────┐
│  TRUNG TAM GIAO DUC TRE DAC BIET TAM ANH   │
│  Address                                    │
│  KE HOACH GIAO DUC CA NHAN THANG X NAM Y   │
│  Student: ___________     Age: ___          │
│  Therapist: ___________                     │
│  Legend: + / +/- / -                        │
├─────────────┬──────────────────┬────────────┤
│ Domain      │ Content          │ Assessment │
├─────────────┼──────────────────┼────────────┤
│ Ky nang     │ Van dong tho     │            │
│ Van dong    │ (note text)      │     +      │
│ (merged)    ├──────────────────┼────────────┤
│             │ Van dong tinh    │            │
│             │ (note text)      │    +/-     │
├─────────────┴──────────────────┼────────────┤
│ Ky nang Bat chuoc              │     -      │
│ (note text)                    │            │
├────────────────────────────────┼────────────┤
│ ...more domains...             │            │
├────────────────────────────────┴────────────┤
│  Phu huynh     Tri lieu vien    Phu trach   │
│                                             │
│  Notes/comments:                            │
│  ............................................│
└─────────────────────────────────────────────┘
```

### Domain grouping

Domains are grouped in the table to match the paper form:

| Group | Domains |
|-------|---------|
| Ky nang Van dong | Van dong tho, Van dong tinh |
| — | Ky nang Bat chuoc |
| — | Luyen hoi/co quan cau am |
| — | Nhan thuc |
| Ngon ngu | Ngon ngu the hien, Ngon ngu tiep nhan |
| Ky nang | Ky nang tu phuc vu, Ky nang Giao tiep - Xa hoi |
| — | Tap trung chu y – Giao tiep mat |
| — | Cac van de ve hanh vi |

Grouped domains use `rowSpan` merged cells. Standalone domains use `columnSpan`.

### Indicator mapping

| Enum value | Display | Meaning |
|-----------|---------|---------|
| `ACHIEVED` | `+` | Completed |
| `NEEDS_ASSISTANCE` | `+/-` | Needs help |
| `NOT_ACHIEVED` | `-` | Not completed |

---

## 7. Seed Data

The seed script (`prisma/seed.ts`) populates all core tables with realistic Vietnamese test data:

```bash
npx prisma db seed
```

What gets created:

| Table | Count | Details |
|-------|-------|---------|
| EvaluationDomain | 11 | Matching the official paper form |
| Users | 4 | 1 admin + 3 teachers |
| Classes | 6 | 2 per teacher |
| Students | 30-48 | 5-8 per class, Vietnamese names |
| Evaluations | ~70-96 | 2 months per student, ~40% finalized |
| EvaluationSections | ~770-1056 | 11 sections per evaluation |

### Test accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123` | ADMIN |
| `teacher1@example.com` | `teacher123` | TEACHER |
| `teacher2@example.com` | `teacher123` | TEACHER |
| `teacher3@example.com` | `teacher123` | TEACHER |

The seed is idempotent — uses `upsert` for domains and users, skips classes/students that already exist.

---

## 8. Development Commands

```bash
# Start PostgreSQL container
docker compose up -d

# Install dependencies
npm install

# Run database migration
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database
npx prisma db seed

# Start development server (with hot reload)
npm run start:dev

# Open Prisma Studio (database GUI)
npx prisma studio

# Build for production
npm run build

# Start production server
npm run start:prod
```

### Environment variables

Create a `.env` file in the backend root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/gddb
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
PORT=3001
```

The server runs on `http://localhost:3001` with global prefix `/api`.
