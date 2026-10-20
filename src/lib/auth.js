import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { database } from "./mongodb";
export function verifyJWT(req) {
  try {
    const token =
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      req.cookies?.get("token")?.value;
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
}
export async function authenticate(req, role) {
  const claims = verifyJWT(req);
  if (!claims || !ObjectId.isValid(claims.id))
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  const db = await database();
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(claims.id), sessionVersion: claims.version });
  if (!user)
    throw Object.assign(new Error("Session expired. Please sign in again."), {
      status: 401,
    });
  if (role && user.role !== role)
    throw Object.assign(
      new Error("This operation is restricted to " + role + " accounts"),
      { status: 403 },
    );
  return user;
}
