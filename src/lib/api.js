import { ObjectId } from "mongodb";
import { errorResponse, successResponse } from "./utils";
export function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
export function id(value) {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value))
    fail("Invalid ID");
  return new ObjectId(value);
}
export function endpoint(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (e) {
      if (!e.status) console.error("API failure:", e.message);
      return errorResponse(
        e.status ? e.message : "Service unavailable. Please try again.",
        e.status || 503,
      );
    }
  };
}
export async function body(req) {
  try {
    const data = await req.json();
    if (!data || Array.isArray(data) || typeof data !== "object")
      fail("Invalid JSON object");
    return data;
  } catch {
    fail("Invalid JSON body");
  }
}
export function courseData(data) {
  const { name, duration, topics, price, maxStudent, status } = data;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 150)
    fail("Course name is required (up to 150 characters)");
  if (!Number.isInteger(duration) || duration < 1 || duration > 36500)
    fail("Duration must be a positive whole number of days");
  if (
    !Array.isArray(topics) ||
    !topics.length ||
    topics.length > 50 ||
    topics.some((t) => typeof t !== "string" || !t.trim() || t.length > 200)
  )
    fail("Provide 1–50 non-empty topics");
  if (
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 10000000
  )
    fail("Price must be a non-negative number");
  if (!Number.isInteger(maxStudent) || maxStudent < 1 || maxStudent > 10000)
    fail("Max Student must be between 1 and 10000");
  if (!["Open", "Close", "Cancel"].includes(status))
    fail("Invalid course status");
  return {
    name: name.trim(),
    duration,
    topics: topics.map((t) => t.trim()),
    price: Math.round(price * 100) / 100,
    maxStudent,
    status,
  };
}
export function publicUser(u) {
  return {
    _id: u._id.toString(),
    username: u.username,
    email: u.email,
    role: u.role,
  };
}
export function publicCourse(c, user) {
  const { studentIds, ...data } = c;
  return {
    ...data,
    _id: c._id.toString(),
    teacherId: c.teacherId.toString(),
    enrolledCount: studentIds.length,
    isEnrolled: studentIds.some((s) => s.equals(user._id)),
  };
}
export { successResponse };
