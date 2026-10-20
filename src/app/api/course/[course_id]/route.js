import { authenticate } from "@/lib/auth";
import { database } from "@/lib/mongodb";
import {
  endpoint,
  body,
  id,
  fail,
  courseData,
  publicCourse,
  publicUser,
  successResponse,
} from "@/lib/api";
async function ownedCourse(db, courseId, user) {
  const c = await db.collection("courses").findOne({ _id: courseId });
  if (!c) fail("Course not found", 404);
  if (!c.teacherId.equals(user._id))
    fail("You may only manage your own courses", 403);
  return c;
}
export const GET = endpoint(async (req, { params }) => {
  const user = await authenticate(req);
  const db = await database();
  const c = await db
    .collection("courses")
    .findOne({ _id: id((await params).course_id) });
  if (!c || (user.role === "Student" && c.status === "Cancel"))
    fail("Course not found", 404);
  if (user.role === "Teacher" && !c.teacherId.equals(user._id))
    fail("You may only view your own courses", 403);
  const data = publicCourse(c, user);
  if (user.role === "Teacher")
    data.students = (
      await db
        .collection("users")
        .find({ _id: { $in: c.studentIds } })
        .toArray()
    ).map(publicUser);
  return successResponse(data, 200);
});
export const PUT = endpoint(async (req, { params }) => {
  const user = await authenticate(req, "Teacher");
  const db = await database();
  const courseId = id((await params).course_id);
  await ownedCourse(db, courseId, user);
  const data = courseData(await body(req));
  const updated = await db
    .collection("courses")
    .findOneAndUpdate(
      {
        _id: courseId,
        teacherId: user._id,
        $expr: { $lte: [{ $size: "$studentIds" }, data.maxStudent] },
      },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  if (!updated)
    fail(
      "Capacity cannot be lower than current enrollment, or course was removed",
      409,
    );
  return successResponse(publicCourse(updated, user), 200);
});
export const PATCH = PUT;
export const DELETE = endpoint(async (req, { params }) => {
  const user = await authenticate(req, "Teacher");
  const db = await database();
  const courseId = id((await params).course_id);
  await ownedCourse(db, courseId, user);
  const result = await db
    .collection("courses")
    .deleteOne({
      _id: courseId,
      teacherId: user._id,
      studentIds: { $size: 0 },
    });
  if (!result.deletedCount)
    fail("Cannot delete a course with enrolled students", 409);
  return successResponse({ message: "Course deleted" }, 200);
});
