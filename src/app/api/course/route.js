import { authenticate } from "@/lib/auth";
import { database } from "@/lib/mongodb";
import {
  endpoint,
  body,
  courseData,
  publicCourse,
  successResponse,
} from "@/lib/api";
export const GET = endpoint(async (req) => {
  const user = await authenticate(req);
  const db = await database();
  const url = new URL(req.url);
  const query =
    user.role === "Teacher"
      ? { teacherId: user._id }
      : { status: { $ne: "Cancel" } };
  if (user.role === "Student" && url.searchParams.get("enrolled") === "true")
    query.studentIds = user._id;
  const search = (url.searchParams.get("search") || "").trim().slice(0, 150);
  if (search) {
    const regex = {
      $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
    query.$or = [{ name: regex }, { teacherName: regex }];
  }
  return successResponse(
    (
      await db
        .collection("courses")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray()
    ).map((c) => publicCourse(c, user)),
    200,
  );
});
export const POST = endpoint(async (req) => {
  const user = await authenticate(req, "Teacher");
  const data = courseData(await body(req));
  const course = {
    ...data,
    teacherId: user._id,
    teacherName: user.username,
    studentIds: [],
    createdAt: new Date(),
  };
  const result = await (
    await database()
  )
    .collection("courses")
    .insertOne(course);
  return successResponse(
    publicCourse({ ...course, _id: result.insertedId }, user),
    201,
  );
});
