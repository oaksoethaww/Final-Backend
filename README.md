# Coursework — Online Course Service

This repository contains the Next.js backend. When cloned separately, run its npm commands from the repository root; the directory names below refer to the original combined starter. The verification script is included in the backend repository.


Student name: **Awaiting student input**  
Student ID: **Awaiting student input**

Built from `pop2518hotmailcom/wad-final-2026-01`, retaining its Next.js backend, React frontend, context provider and original API routes. New enrollment endpoint and shared validation helpers extend the provided architecture.

## Submission links

| Deliverable | Link/status |
| --- | --- |
| Backend repository | Pending publication |
| Frontend repository | Pending publication |
| Backend deployment | Pending deployment |
| Frontend deployment | Pending deployment |
| Full screen + camera recording | Student must provide their actual recording link |

## Test accounts

These are intentionally published demonstration credentials, restricted to this examination application. Run the seed command before testing. Passwords are hashed with bcrypt in MongoDB.

| Role | Username | Email | Password |
| --- | --- | --- | --- |
| Teacher | teacher1 | teacher1@coursework.test | Teach2026!Course |
| Teacher | teacher2 | teacher2@coursework.test | Teach2026!Course |
| Teacher | teacher3 | teacher3@coursework.test | Teach2026!Course |
| Student | student1 | student1@coursework.test | Learn2026!Course |
| Student | student2 | student2@coursework.test | Learn2026!Course |
| Student | student3 | student3@coursework.test | Learn2026!Course |

## Run locally

Use Node.js 22.12+ or 24 and a reachable MongoDB instance (local or Atlas).

1. `cd next-backend`, then `npm ci`.
2. Copy `.env.example` to `.env.local`. Set `MONGODB_URI`, `MONGODB_DB`, a random `JWT_SECRET` of at least 32 characters, and `FRONTEND_URL=http://localhost:5173`.
3. `npm run seed` creates the six accounts and sample courses without replacing existing records.
4. `npm run dev -- --port 3000` starts the API.
5. In another terminal, `cd react-frontend`, run `npm ci`, and copy `.env.example` to `.env.local` with `VITE_API_URL=http://localhost:3000`.
6. `npm run dev -- --host 127.0.0.1 --port 5173`, then open http://localhost:5173.

## Testing walkthrough

1. Log in as teacher1. Only this teacher's courses appear. Create a course with multiple comma-separated topics, positive duration, price, capacity, and Open status.
2. View its details and enrolled student list. Edit the course and verify saved values. Delete a course with zero students.
3. Log in as teacher2: teacher1's courses are absent. Direct attempts to read, change, or delete another teacher's course return 403.
4. Log in as student1. Search by part of a course name or teacher username. Open details and enroll in an Open course with available capacity. The course appears in My learning. Refresh the browser to verify session retention.
5. Try enrolling again: duplicate enrollment is rejected. Use student2 and student3 to fill capacity; further enrollments are rejected.
6. Log back in as the owning teacher: enrolled students are listed, deletion is rejected, and capacity cannot be reduced below enrollment.
7. Set Close: students can still see the course but cannot enroll. Set Cancel: students cannot list, open, or enroll in it; the teacher retains access.
8. Sign out. Protected API calls fail with 401, including reuse of the revoked token.
9. Run `node scripts/verify-api.mjs (from the backend repository)` from this root with the backend running. Set `API_URL` to test another environment. This suite creates identifiable verification courses; an occupied canceled course is retained as audit evidence because deletion with enrollment is forbidden.

## API

All endpoints except login require `Authorization: Bearer <token>`. Invalid authentication returns 401; forbidden roles/ownership return 403; missing/hidden courses return 404; conflicting enrollment/capacity/deletion returns 409; malformed input returns 400. IDs and numerical fields are validated; ownership, teacher identity and enrollment counts are server controlled. Password hashes and other students' private data are never exposed to students.

| Method | Route | Function |
| --- | --- | --- |
| POST | /api/auth/login | Authenticate with email or username and password |
| POST | /api/auth/logout | Invalidate all current tokens for this account |
| GET | /api/user | Current profile |
| GET | /api/user/:user_id | Own profile only |
| GET | /api/course | Role-filtered courses; `search` and `enrolled=true` filters |
| POST | /api/course | Teacher creates course |
| GET | /api/course/:course_id | Details; owning teacher additionally sees students |
| PUT/PATCH | /api/course/:course_id | Owning teacher updates course |
| DELETE | /api/course/:course_id | Owning teacher deletes only with zero enrollment |
| POST | /api/course/:course_id/enroll | Student enrollment |

Enrollment is stored as student ObjectIds in the course document. A single atomic conditional update checks Open status, available capacity and absence of this student before adding the enrollment. Concurrent enrollment, capacity updates and deletion therefore share one document boundary and require no multi-document transaction. Cancel courses are excluded from every student list, including My learning, in accordance with the status restriction.

## Deploy to Vercel

Create separate projects using `next-backend` (Next.js) and `react-frontend` (Vite) as their root directories. Set backend `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`, and `FRONTEND_URL` to the deployed frontend origin. Set frontend `VITE_API_URL` to the deployed backend origin, then rebuild the frontend. Allow the deployment's MongoDB connection in your database network configuration. Run the seed script against the same database. Disable Vercel deployment authentication for the submitted production URLs so the lecturer can access them.

Never commit database connection credentials, JWT signing secrets, `.env.local`, `.vercel`, node_modules, or build outputs. The screen recording must be captured by the student throughout the actual examination; this project cannot reconstruct it.

## Verification results

- 43 HTTP assertions passed against an isolated local MongoDB instance, including authentication, roles, ownership, validation, title/teacher search, status visibility, duplicate prevention, atomic last-seat concurrency, forbidden deletion, and revoked-token rejection.
- Browser login for both roles, session persistence after refresh, mobile layout without horizontal overflow, and no page-level JavaScript exceptions passed.
- Both applications passed ESLint and production build checks. The backend uses Webpack to avoid this machine's Turbopack worker-port restriction.
- Frontend dependency audit: zero advisories after compatible fixes. Backend: Next.js updated to 16.4.2 to address critical advisories; five high development-lint dependency advisories remain.
- Remote database seeding, repository publication, and live deployment have not yet completed. They require the outstanding explicit authorizations and a renewed Vercel session.
