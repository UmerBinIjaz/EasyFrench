# L'Académie — Full French LMS Platform

A complete Learning Management System for French language education, built with Next.js 14 (App Router), Prisma ORM, PostgreSQL (Neon DB), and Tailwind CSS. Inspired by the provided UI mockups.

---

## User Review Required

> [!IMPORTANT]
> **Neon DB Connection String**: You will need to provide a Neon DB PostgreSQL connection string (e.g., `postgresql://user:pass@host/db?sslmode=require`). The system will use a `.env.local` with `DATABASE_URL` and `NEXTAUTH_SECRET`. Please have this ready when we begin execution.

> [!IMPORTANT]
> **JWT Secret**: A `NEXTAUTH_SECRET` will be needed. We'll auto-generate a placeholder, but you should replace it in production.

> [!WARNING]
> **Certificate PDF Generation**: We'll use `@react-pdf/renderer` for server-side PDF generation. This works without external APIs and generates beautiful certificates directly on the server.

---

## Open Questions

> [!NOTE]
> We'll default to **NextAuth.js v4** (credentials provider) for authentication as it integrates cleanly with Next.js App Router and Prisma. If you prefer plain JWT middleware instead, let us know.

> [!NOTE]
> **Default Admin Account**: We'll seed a default admin/teacher account (`admin@lacademie.com` / `Admin@1234`) so you can log in immediately after setup.

---

## Proposed Changes

### 1. Project Initialization & Configuration

#### [NEW] `package.json` — Next.js 14 project with all dependencies
#### [NEW] `prisma/schema.prisma` — Complete DB schema
#### [NEW] `.env.local` — Environment variables template
#### [NEW] `tailwind.config.ts` — Custom theme with brand colors
#### [NEW] `next.config.js` — Next.js configuration

---

### 2. Database Schema (Prisma)

All models to be created:

| Model | Key Fields |
|---|---|
| `User` | id, name, email, password, role (ADMIN/TEACHER/STUDENT), avatar |
| `Course` | id, title, level (A1–B2/TCF/TEF), description, status, modules |
| `Module` | id, courseId, title, order, lessons |
| `Lesson` | id, moduleId, title, videoUrl, textContent, pdfUrl, order |
| `Enrollment` | id, studentId, courseId, enrolledAt, status |
| `Progress` | id, studentId, lessonId, completedAt, timeSpent |
| `Quiz` | id, lessonId/moduleId, title, questions |
| `QuizQuestion` | id, quizId, question, options (JSON), correctAnswer |
| `QuizResult` | id, studentId, quizId, score, totalQuestions, answers |
| `Certificate` | id, studentId, courseId, issuedAt, approvedBy, downloadUrl |
| `CertificateTemplate` | id, name, imageUrl, isActive |
| `WordOfDay` | id, word, definition, translation, date |
| `Announcement` | id, teacherId, title, body, courseId (optional) |

---

### 3. Authentication System

#### [NEW] `src/app/api/auth/[...nextauth]/route.ts`
- NextAuth v4 with Credentials provider
- bcrypt password verification
- JWT session with role embedded
- Role-based session callbacks

#### [NEW] `src/middleware.ts`
- Protect `/dashboard/*`, `/teacher/*`, `/admin/*`
- Redirect unauthenticated users to `/login`
- Redirect wrong-role users appropriately

#### [NEW] `src/app/(auth)/login/page.tsx`
#### [NEW] `src/app/(auth)/register/page.tsx`

---

### 4. Public Landing Page

#### [NEW] `src/app/page.tsx` — Landing page with:
- Hero section (French-themed, animated)
- Course listing (A1–B2, TCF, TEF cards)
- Features section
- Testimonials
- CTA to register/login
- Header & Footer

---

### 5. Student Dashboard (Role: STUDENT)

#### [NEW] `src/app/dashboard/page.tsx`
- Greeting + daily French word widget
- Progress overview (circular chart)
- Learning path cards (A1→B2 progression)
- Continue learning card (last lesson)
- Weekly activity chart
- Certificate download banner

#### [NEW] `src/app/dashboard/courses/page.tsx`
- Enrolled courses list with progress bars

#### [NEW] `src/app/dashboard/courses/[courseId]/page.tsx`
- Module accordion with lesson list
- Lock/unlock based on progress

#### [NEW] `src/app/dashboard/lessons/[lessonId]/page.tsx`
- Video player (iframe/HTML5)
- Course notes + PDF download
- Inline quiz (right sidebar)
- Prev/Next navigation
- Study time tracker

#### [NEW] `src/app/dashboard/tests/page.tsx`
- TCF/TEF practice tests
- Available quizzes

#### [NEW] `src/app/dashboard/certificates/page.tsx`
- Earned certificates grid
- Download certificate button

#### [NEW] `src/app/dashboard/profile/page.tsx`
- Profile update form

---

### 6. Teacher Dashboard (Role: TEACHER / ADMIN)

#### [NEW] `src/app/teacher/page.tsx` — Overview
- Stats: students, courses, quizzes, certificates
- Course management table (Cours, Modules, Leçons, Status)
- Quick Actions panel
- Recent Activity feed

#### [NEW] `src/app/teacher/courses/page.tsx`
- All courses list

#### [NEW] `src/app/teacher/courses/new/page.tsx`
- Course creation form (React Hook Form + Zod)

#### [NEW] `src/app/teacher/courses/[courseId]/page.tsx`
- Course editor with module/lesson management

#### [NEW] `src/app/teacher/courses/[courseId]/modules/new/page.tsx`
#### [NEW] `src/app/teacher/courses/[courseId]/modules/[moduleId]/lessons/new/page.tsx`

#### [NEW] `src/app/teacher/students/page.tsx`
- Student tracking table with search
- Progress indicators

#### [NEW] `src/app/teacher/quizzes/page.tsx` — Quiz Bank
- All quizzes

#### [NEW] `src/app/teacher/quizzes/new/page.tsx`
- Quiz creator (add MCQ questions dynamically)

#### [NEW] `src/app/teacher/certificates/page.tsx`
- Certificate & Tracking page (matches mockup exactly)
- Student tracking table
- Awaiting approval sidebar
- Template preview + change template
- Bulk issue button

---

### 7. API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | ANY | NextAuth handler |
| `/api/courses` | GET/POST | List/create courses |
| `/api/courses/[id]` | GET/PUT/DELETE | Course CRUD |
| `/api/courses/[id]/modules` | GET/POST | Module management |
| `/api/modules/[id]/lessons` | GET/POST | Lesson management |
| `/api/enrollments` | GET/POST | Enroll student |
| `/api/progress` | GET/POST | Mark lesson complete |
| `/api/quizzes` | GET/POST | Quiz management |
| `/api/quizzes/[id]/attempt` | POST | Submit quiz attempt |
| `/api/certificates` | GET/POST | Issue certificate |
| `/api/certificates/[id]/generate` | POST | Generate PDF certificate |
| `/api/certificates/templates` | GET/POST | Template management |
| `/api/students` | GET | List all students (teacher) |
| `/api/upload` | POST | File upload handler |

---

### 8. Components Library

#### [NEW] `src/components/ui/` — Base UI components
- Button, Input, Badge, Card, Modal, Tabs, ProgressBar, CircularProgress

#### [NEW] `src/components/layout/`
- `StudentSidebar.tsx`
- `TeacherSidebar.tsx`
- `TopBar.tsx`
- `Footer.tsx`

#### [NEW] `src/components/course/`
- `CourseCard.tsx`
- `ModuleAccordion.tsx`
- `LessonItem.tsx`
- `VideoPlayer.tsx`

#### [NEW] `src/components/quiz/`
- `QuizPlayer.tsx`
- `QuizCreator.tsx`
- `QuizResults.tsx`

#### [NEW] `src/components/certificate/`
- `CertificateCard.tsx`
- `CertificateGenerator.tsx`

#### [NEW] `src/components/charts/`
- `CircularProgress.tsx`
- `WeeklyActivityChart.tsx`

---

### 9. Seed Data

#### [NEW] `prisma/seed.ts`
- Admin/Teacher user (admin@lacademie.com / Admin@1234)
- Courses: A1, A2, B1, B2, TCF, TEF
- Sample modules and lessons per course
- Sample quiz questions
- Word of the day entries

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via Neon DB |
| ORM | Prisma v5 |
| Auth | NextAuth.js v4 (Credentials) |
| Styling | Tailwind CSS v3 |
| Forms | React Hook Form + Zod |
| PDF Certs | `@react-pdf/renderer` |
| HTTP Client | Axios |
| UI Extras | `recharts` (activity chart), `react-circular-progressbar` |

---

## Verification Plan

### Automated
- `npx prisma migrate dev` — validates schema
- `npx prisma db seed` — populates data
- `npm run dev` — confirms dev server starts

### Manual Verification
1. Visit `http://localhost:3000` → Landing page with courses
2. Register as student → auto-redirect to student dashboard
3. Login as teacher (`admin@lacademie.com`) → teacher dashboard
4. Teacher: Create a course → add module → add lesson → create quiz
5. Student: Enroll in course → access lesson → take quiz → view progress
6. Teacher: Generate certificate for completed student
7. Student: Download certificate PDF
