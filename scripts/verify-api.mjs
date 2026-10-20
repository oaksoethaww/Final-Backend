import assert from "node:assert/strict";
const base = (process.env.API_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
let checks = 0;
async function call(path, method = "GET", token, body, status = 200) {
  const r = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const d = await r.json();
  assert.equal(r.status, status, `${method} ${path}: ${JSON.stringify(d)}`);
  checks++;
  return d;
}
const login = async (role, n = 1) =>
  (
    await call("/auth/login", "POST", null, {
      email: `${role}${n}@coursework.test`,
      password: role === "teacher" ? "Teach2026!Course" : "Learn2026!Course",
    })
  ).token;
const teacher = await login("teacher");
const other = await login("teacher", 2);
const student = await login("student");
const s2 = await login("student", 2);
const s3 = await login("student", 3);
const prefix = `API verification ${Date.now()}`;
const course = {
  name: prefix,
  duration: 7,
  topics: ["APIs", "Testing"],
  price: 25,
  maxStudent: 1,
  status: "Open",
};
const ids = [];
try {
  await call("/course", "GET", null, null, 401);
  await call("/course", "POST", student, course, 403);
  await call(
    "/auth/login",
    "POST",
    null,
    { email: "student1", password: "incorrect" },
    401,
  );
  await call("/course", "POST", teacher, { ...course, duration: 0 }, 400);
  const c = await call("/course", "POST", teacher, course, 201);
  ids.push(c._id);
  assert.equal(c.enrolledCount, 0);
  await call(`/course/${c._id}`, "GET", other, null, 403);
  await call(`/course/${c._id}`, "PUT", other, course, 403);
  await call(`/course/${c._id}`, "DELETE", other, null, 403);
  await call(`/course/${c._id}`, "PUT", student, course, 403);
  assert((await call("/course", "GET", teacher)).every((c) => c.teacherId));
  assert(
    (
      await call("/course?search=" + encodeURIComponent(prefix), "GET", student)
    ).some((x) => x._id === c._id),
  );
  assert(
    (await call("/course?search=teacher1", "GET", student)).some(
      (x) => x._id === c._id,
    ),
  );
  assert.equal((await call("/course?search=%5B.*", "GET", student)).length, 0);
  await call("/course/invalid", "GET", student, null, 400);
  await call(`/course/${c._id}/enroll`, "POST", teacher, null, 403);
  await call(`/course/${c._id}/enroll`, "POST", null, null, 401);
  const results = await Promise.all(
    [student, s2, s3].map(async (token) => {
      const r = await fetch(`${base}/api/course/${c._id}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      return { token, status: r.status };
    }),
  );
  assert.equal(results.filter((r) => r.status === 201).length, 1);
  assert.equal(results.filter((r) => r.status === 409).length, 2);
  checks += 3;
  const winner = results.find((r) => r.status === 201).token;
  await call(`/course/${c._id}/enroll`, "POST", winner, null, 409);
  const detail = await call(`/course/${c._id}`, "GET", teacher);
  assert.equal(detail.students.length, 1);
  assert(!("password" in detail.students[0]));
  const studentDetail = await call(`/course/${c._id}`, "GET", student);
  assert(!("students" in studentDetail));
  assert(
    (await call("/course?enrolled=true", "GET", winner)).some(
      (x) => x._id === c._id,
    ),
  );
  await call(`/course/${c._id}`, "DELETE", teacher, null, 409);
  await call(`/course/${c._id}`, "PUT", teacher, {
    ...course,
    maxStudent: 2,
    status: "Close",
  });
  await call(
    `/course/${c._id}/enroll`,
    "POST",
    results.find((r) => r.status === 409).token,
    null,
    409,
  );
  assert((await call("/course", "GET", student)).some((x) => x._id === c._id));
  await call(`/course/${c._id}`, "PUT", teacher, {
    ...course,
    status: "Cancel",
  });
  assert(!(await call("/course", "GET", student)).some((x) => x._id === c._id));
  assert(
    !(await call("/course?enrolled=true", "GET", winner)).some(
      (x) => x._id === c._id,
    ),
  );
  await call(`/course/${c._id}`, "GET", student, null, 404);
  await call(`/course/${c._id}/enroll`, "POST", student, null, 404);
  const empty = await call(
    "/course",
    "POST",
    teacher,
    { ...course, name: prefix + " empty" },
    201,
  );
  ids.push(empty._id);
  await call(`/course/${empty._id}`, "DELETE", teacher);
  await call(`/course/${empty._id}`, "GET", teacher, null, 404);
  const me = await call("/user", "GET", student);
  assert.equal(me.role, "Student");
  assert(!("password" in me));
  await call("/auth/logout", "POST", student);
  await call("/course", "GET", student, null, 401);
  console.log(
    `PASS: ${checks} HTTP assertions, including concurrent last-seat enrollment.`,
  );
} finally {
  // Keep the occupied, Cancel course as audit evidence; normal APIs correctly prohibit its deletion.
  console.log("Verification course IDs:", ids.join(", "));
}
