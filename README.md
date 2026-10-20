# Coursework — Next.js backend

Built from the lecturer’s [required starter](https://github.com/pop2518hotmailcom/wad-final-2026-01), preserving its API routes, React context and application structure.

Teachers create and manage only their own courses, view enrolled students, and delete only courses with no enrollments. Students search by course or teacher name, inspect courses, enroll, and view My learning. The backend enforces authentication, roles, ownership, status, capacity and enrollment uniqueness. A single atomic MongoDB update prevents overbooking and duplicate enrollment. Closed courses remain visible; canceled courses are hidden from students, including My learning. Logout revokes the account's active sessions.

## Submission

- Backend repository: https://github.com/oaksoethaww/Final-Backend
- Frontend repository: https://github.com/oaksoethaww/Final-Fronted
- Backend deployment: https://cx4107-final-backend.vercel.app
- Frontend deployment: https://cx4107-final-frontend.vercel.app
- Screen recording: student will provide separately
- Student name / ID: to be supplied by the student

## Demo test accounts

These credentials are intentionally supplied for examination testing.

| Role | Username | Email | Password |
| --- | --- | --- | --- |
| Teacher | teacher1 | teacher1@coursework.test | Teach2026!Course |
| Teacher | teacher2 | teacher2@coursework.test | Teach2026!Course |
| Teacher | teacher3 | teacher3@coursework.test | Teach2026!Course |
| Student | student1 | student1@coursework.test | Learn2026!Course |
| Student | student2 | student2@coursework.test | Learn2026!Course |
| Student | student3 | student3@coursework.test | Learn2026!Course |

## Backend setup

Requires Node.js 22.12+ or 24 and MongoDB. From the backend repository root:

```sh
npm ci
cp .env.example .env.local
# Set your private Atlas MONGODB_URI, MONGODB_DB=final_exam_2026,
# a random JWT_SECRET of at least 32 characters, and FRONTEND_URL.
npm run seed
npm run dev
```

The API runs at http://localhost:3000. The seed script creates the six demo accounts and three sample courses without replacing existing records. Passwords are bcrypt hashes in MongoDB. Never commit `.env.local`, Atlas credentials, or the JWT signing secret.

Production: `npm run build` then `npm start`. On Vercel, select the Next.js preset and configure `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`, and `FRONTEND_URL` (the frontend's exact origin). The Atlas network settings must permit the deployed backend to connect.

## Test walkthrough

1. Sign in as teacher1. Create an Open course with a name, duration, multiple comma-separated topics, price, and maximum students. View and edit its details; delete an empty course.
2. Sign in as teacher2. Teacher1's courses must not appear; the API rejects access to another teacher's course with 403.
3. Sign in as student1. Search by part of the course name or teacher username, view details, enroll, and confirm the course in My learning. Refresh to verify session retention.
4. Repeat enrollment: it must fail. Use student2 and student3 to fill capacity; further enrollments must fail. The owning teacher sees enrolled student names and emails, cannot reduce capacity below enrollment, and cannot delete an occupied course.
5. Set Close as the owning teacher: the course remains visible to students but enrollment fails. Set Cancel: students cannot list, view or enroll in it; the owning teacher retains access.
6. Sign out: protected requests return 401, including reuse of the revoked token.

From the backend repository, run `npm run test:api` with a server running. Set `API_URL` to a deployed backend and `FRONTEND_ORIGIN` to its frontend origin to check production CORS. The suite creates clearly named verification courses; it reports their IDs. An occupied course cannot be deleted through the API, so its test record remains until the database owner cleans up those reported verification IDs.
