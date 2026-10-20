import { authenticate } from "@/lib/auth";
import { database } from "@/lib/mongodb";
import { endpoint, id, fail, successResponse } from "@/lib/api";
export const POST = endpoint(async (req, { params }) => {
  const user = await authenticate(req, "Student");
  const db = await database();
  const courseId = id((await params).course_id);
  // One atomic document update enforces status, uniqueness and capacity even under concurrent requests.
  const result = await db
    .collection("courses")
    .updateOne(
      {
        _id: courseId,
        status: "Open",
        studentIds: { $ne: user._id },
        $expr: { $lt: [{ $size: "$studentIds" }, "$maxStudent"] },
      },
      { $addToSet: { studentIds: user._id } },
    );
  if (!result.modifiedCount) {
    const c = await db.collection("courses").findOne({ _id: courseId });
    if (!c || c.status === "Cancel") fail("Course not found", 404);
    if (c.studentIds.some((s) => s.equals(user._id)))
      fail("Already enrolled in this course", 409);
    if (c.status !== "Open") fail("Course is closed for enrollment", 409);
    fail("No seats available", 409);
  }
  return successResponse({ message: "Enrollment confirmed" }, 201);
});
