# Frontend Architecture Guide

## Overview

Frontend được xây dựng bằng:

- Next.js (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- React Hook Form
- Axios
- TanStack Query (React Query)

Ứng dụng này dùng để quản lý:

- giáo viên
- lớp học
- học sinh
- đánh giá hàng tháng
- xuất báo cáo DOCX

---

# Tech Stack

| Tool            | Purpose              |
| --------------- | -------------------- |
| Next.js         | React framework      |
| shadcn/ui       | UI component library |
| TailwindCSS     | Styling              |
| React Query     | API state management |
| React Hook Form | Form handling        |
| Axios           | HTTP requests        |

---

# Project Structure

frontend
│
├─ app
│ ├─ login
│ ├─ dashboard
│ ├─ classes
│ ├─ students
│ ├─ evaluations
│ ├─ reports
│ └─ settings
│
├─ components
│ ├─ ui
│ ├─ forms
│ ├─ layout
│ └─ tables
│
├─ lib
│ ├─ api.ts
│ ├─ auth.ts
│ └─ utils.ts
│
├─ hooks
│
└─ types

---

# Application Pages

## 1 Login

/login

Features:

- email
- password
- call API:

POST /api/auth/login

Store JWT token.

---

# Dashboard

/dashboard

Show summary:

- total classes
- total students
- evaluations this month

---

# Classes Management

/classes

Features:

- list classes
- create class
- edit class
- delete class

API:

GET /api/classes
POST /api/classes
PATCH /api/classes/:id
DELETE /api/classes/:id

---

# Students Management

/students

Features:

- list students by class
- create student
- edit student
- delete student
- view student detail

API:

GET /api/students?classId=
POST /api/students
PATCH /api/students/:id
DELETE /api/students/:id

---

# Evaluation Form

/evaluations/:studentId

Features:

- select month
- load evaluation domains
- textarea for notes
- select indicator

Example UI:

Domain: Giao tiếp
[ textarea ]

Indicator:
(+) (+/-) (-)

API:

POST /api/evaluations
PATCH /api/evaluations/:id/sections
POST /api/evaluations/:id/finalize

---

# Reports

/reports

Features:

- choose student
- choose month
- preview report
- download DOCX

API:

GET /api/reports/student/:studentId
GET /api/reports/student/:studentId/docx

---

# UI Components

Use shadcn/ui components:

Button
Input
Textarea
Select
Table
Card
Dialog
Tabs
Form

---

# Evaluation Form Layout

Domain: Giao tiếp
[ textarea ]

Indicator:
(+)
(+/-)
(-)

Repeat for each domain.

---

# State Management

Use:

React Query

Example:

useQuery(["students", classId], fetchStudents)

---

# API Client

Create:

lib/api.ts

Axios instance:

baseURL = http://localhost:3001/api

Add JWT token in interceptor.

---

# Authentication

Store JWT in:

localStorage

Protect routes using middleware.

---

# DOCX Export

Frontend simply calls:

GET /api/reports/student/:id/docx

Browser downloads file.

---

# Development Commands

Run frontend:

npm run dev

Backend API:

http://localhost:3001

Frontend:

http://localhost:3000

---

# Future Improvements

Possible features:

- PDF export
- Admin dashboard
- evaluation analytics
