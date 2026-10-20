import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "coursework");
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("courses").createIndex({ teacherId: 1 });
  await db.collection("courses").createIndex({ studentIds: 1 });
  for (const role of ["Teacher", "Student"])
    for (let n = 1; n <= 3; n++) {
      const username = `${role.toLowerCase()}${n}`;
      const email = `${username}@coursework.test`;
      const password = await bcrypt.hash(
        role === "Teacher" ? "Teach2026!Course" : "Learn2026!Course",
        12,
      );
      await db
        .collection("users")
        .updateOne(
          { email },
          {
            $setOnInsert: {
              username,
              email,
              role,
              password,
              sessionVersion: 0,
            },
          },
          { upsert: true },
        );
    }
  for (const [n, name, topics, status] of [
    [
      1,
      "Design for everyday life",
      ["Design thinking", "Visual composition", "Creative practice"],
      "Open",
    ],
    [
      2,
      "The art of modern web development",
      ["React", "APIs", "Web architecture"],
      "Open",
    ],
    [
      3,
      "Make numbers tell a story",
      ["Data analysis", "Visualization", "Storytelling"],
      "Close",
    ],
  ]) {
    const teacher = await db
      .collection("users")
      .findOne({ username: `teacher${n}` });
    await db
      .collection("courses")
      .updateOne(
        { name, teacherId: teacher._id },
        {
          $setOnInsert: {
            name,
            teacherId: teacher._id,
            teacherName: teacher.username,
            duration: n * 7,
            topics,
            price: n * 35,
            maxStudent: 20,
            status,
            studentIds: [],
            createdAt: new Date(),
          },
        },
        { upsert: true },
      );
  }
  console.log(
    "Seed complete: 3 Teachers, 3 Students, and 3 example courses (existing data preserved).",
  );
} finally {
  await client.close();
}
