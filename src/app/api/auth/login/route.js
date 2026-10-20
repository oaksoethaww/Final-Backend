import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { database } from "@/lib/mongodb";
import { body, endpoint, fail, publicUser, successResponse } from "@/lib/api";
export const POST = endpoint(async (req) => {
  const data = await body(req);
  if (
    typeof data.email !== "string" ||
    typeof data.password !== "string" ||
    data.password.length > 200
  )
    fail("Email/username and password are required");
  const db = await database();
  const user = await db
    .collection("users")
    .findOne({
      $or: [
        { email: data.email.trim().toLowerCase() },
        { username: data.email.trim() },
      ],
    });
  if (!user || !(await bcrypt.compare(data.password, user.password)))
    fail("Invalid login details", 401);
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error("Configure JWT_SECRET with at least 32 characters");
  const token = jwt.sign(
    { id: user._id.toString(), version: user.sessionVersion },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "8h" },
  );
  return successResponse({ user: publicUser(user), token }, 200);
});
