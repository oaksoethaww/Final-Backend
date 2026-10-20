import assert from "node:assert/strict";
const base = (process.env.API_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
let checks = 0;
async function call(path, method = "GET", token, body, status = 200) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined && body !== null
      ? { body: JSON.stringify(body) }
      : {}),
  });
  const data = await response.json();
  assert.equal(
    response.status,
    status,
    `${method} ${path}: ${JSON.stringify(data)}`,
  );
  checks++;
  return data;
}
const accounts = {};
for (const role of ["Teacher", "Student"]) {
  for (let n = 1; n <= 3; n++) {
    const username = `${role.toLowerCase()}${n}`;
    const session = await call("/auth/login", "POST", null, {
      email: `${username}@coursework.test`,
      password: role === "Teacher" ? "Teach2026!Course" : "Learn2026!Course",
    });
    assert.equal(session.user.role, role);
    assert.equal(session.user.username, username);
    assert(!("password" in session.user));
    assert.equal(
      (await call("/user", "GET", session.token))._id,
      session.user._id,
    );
    accounts[username] = session;
  }
}
const teacher = accounts.teacher1.token;
const other = accounts.teacher2.token;
const students = [
  accounts.student1.token,
  accounts.student2.token,
  accounts.student3.token,
];
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
  for (const method of ["GET", "POST"])
    await call("/course", method, null, method === "POST" ? course : null, 401);
  await call("/course", "GET", "invalid-token", null, 401);
  await call("/user", "GET", null, null, 401);
  await call("/auth/logout", "POST", null, null, 401);
  await call("/course", "POST", students[0], course, 403);
  await call(
    "/auth/login",
    "POST",
    null,
    { email: "student1", password: "incorrect" },
    401,
  );
  await call(
    "/auth/login",
    "POST",
    null,
    { email: { $ne: null }, password: "x" },
    400,
  );
  for (const invalid of [
    { name: "" },
    { duration: 0 },
    { duration: 1.5 },
    { topics: [] },
    { price: -1 },
    { maxStudent: 0 },
    { maxStudent: 1.5 },
    { status: "Invalid" },
  ]) {
    await call("/course", "POST", teacher, { ...course, ...invalid }, 400);
  }
  const c = await call(
    "/course",
    "POST",
    teacher,
    {
      ...course,
      teacherId: accounts.teacher2.user._id,
      studentIds: [accounts.student1.user._id],
    },
    201,
  );
  ids.push(c._id);
  assert.equal(c.teacherId, accounts.teacher1.user._id);
  assert.equal(c.enrolledCount, 0);
  for (const method of ["GET", "PUT", "DELETE"])
    await call(
      `/course/${c._id}`,
      method,
      other,
      method === "PUT" ? course : null,
      403,
    );
  for (const method of ["PUT", "DELETE"])
    await call(
      `/course/${c._id}`,
      method,
      students[0],
      method === "PUT" ? course : null,
      403,
    );
  assert(
    (await call("/course", "GET", teacher)).every(
      (item) => item.teacherId === accounts.teacher1.user._id,
    ),
  );
  assert(
    !(await call("/course", "GET", other)).some((item) => item._id === c._id),
  );
  assert(
    (
      await call(
        "/course?search=" + encodeURIComponent(prefix.toUpperCase().slice(4)),
        "GET",
        students[0],
      )
    ).some((item) => item._id === c._id),
  );
  assert(
    (await call("/course?search=TEACHER1", "GET", students[0])).some(
      (item) => item._id === c._id,
    ),
  );
  assert.equal(
    (await call("/course?search=%5B.*", "GET", students[0])).length,
    0,
  );
  await call("/course/invalid", "GET", students[0], null, 400);
  await call("/course/000000000000000000000000", "GET", students[0], null, 404);
  await call(`/course/${c._id}/enroll`, "POST", teacher, null, 403);
  await call(`/course/${c._id}/enroll`, "POST", null, null, 401);
  const results = await Promise.all(
    students.map(async (token) => {
      const response = await fetch(`${base}/api/course/${c._id}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      return { token, status: response.status };
    }),
  );
  assert.equal(results.filter((r) => r.status === 201).length, 1);
  assert.equal(results.filter((r) => r.status === 409).length, 2);
  checks += 3;
  const winner = results.find((r) => r.status === 201).token;
  const remaining = results.filter((r) => r.status === 409).map((r) => r.token);
  await call(`/course/${c._id}/enroll`, "POST", winner, null, 409);
  const detail = await call(`/course/${c._id}`, "GET", teacher);
  assert.equal(detail.students.length, 1);
  assert(!("password" in detail.students[0]));
  const studentDetail = await call(`/course/${c._id}`, "GET", students[0]);
  assert(!("students" in studentDetail));
  assert(!("studentIds" in studentDetail));
  assert(
    (await call("/course?enrolled=true", "GET", winner)).some(
      (item) => item._id === c._id,
    ),
  );
  await call(`/course/${c._id}`, "DELETE", teacher, null, 409);
  await call(`/course/${c._id}`, "PUT", teacher, { ...course, maxStudent: 2 });
  await call(`/course/${c._id}/enroll`, "POST", remaining[0], null, 201);
  await call(`/course/${c._id}`, "PUT", teacher, course, 409);
  await call(`/course/${c._id}`, "PUT", teacher, {
    ...course,
    maxStudent: 3,
    status: "Close",
  });
  await call(`/course/${c._id}/enroll`, "POST", remaining[1], null, 409);
  assert(
    (await call("/course", "GET", students[0])).some(
      (item) => item._id === c._id,
    ),
  );
  assert.equal(
    (await call(`/course/${c._id}`, "GET", students[0])).status,
    "Close",
  );
  await call(`/course/${c._id}`, "PATCH", teacher, {
    ...course,
    maxStudent: 3,
    status: "Cancel",
  });
  assert(
    !(await call("/course", "GET", students[0])).some(
      (item) => item._id === c._id,
    ),
  );
  assert(
    !(await call("/course?enrolled=true", "GET", winner)).some(
      (item) => item._id === c._id,
    ),
  );
  await call(`/course/${c._id}`, "GET", students[0], null, 404);
  await call(`/course/${c._id}/enroll`, "POST", remaining[1], null, 404);
  assert.equal(
    (await call(`/course/${c._id}`, "GET", teacher)).status,
    "Cancel",
  );
  assert(
    (await call("/course", "GET", teacher)).some((item) => item._id === c._id),
  );
  await call(`/course/${c._id}`, "DELETE", teacher, null, 409);
  await call(`/course/${c._id}`, "PUT", teacher, {
    ...course,
    maxStudent: 3,
    status: "Open",
  });
  await call(`/course/${c._id}/enroll`, "POST", remaining[1], null, 201);
  assert.equal(
    (await call(`/course/${c._id}`, "GET", teacher)).enrolledCount,
    3,
  );
  await call(`/course/${c._id}`, "PUT", teacher, {
    ...course,
    maxStudent: 3,
    status: "Cancel",
  });
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
  await call(`/user/${accounts.student1.user._id}`, "GET", students[0]);
  await call(
    `/user/${accounts.student2.user._id}`,
    "GET",
    students[0],
    null,
    403,
  );
  await call("/auth/logout", "POST", students[0]);
  await call("/course", "GET", students[0], null, 401);
  const preflight = await fetch(`${base}/api/course`, {
    method: "OPTIONS",
    headers: {
      Origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type",
    },
  });
  assert.equal(preflight.status, 204);
  assert(
    preflight.headers
      .get("access-control-allow-headers")
      .includes("Authorization"),
  );
  if (process.env.FRONTEND_ORIGIN)
    assert.equal(
      preflight.headers.get("access-control-allow-origin"),
      process.env.FRONTEND_ORIGIN,
    );
  checks++;
  console.log(
    `PASS: ${checks} HTTP checks. All six logins, ownership, validation, status rules, duplicate enrollment, concurrent capacity, capacity reduction, deletion restrictions, CORS and logout revocation verified.`,
  );
} finally {
  console.log("Verification course IDs:", ids.join(", "));
}
