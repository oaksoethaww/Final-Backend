import { authenticate } from "@/lib/auth";
import { database } from "@/lib/mongodb";
import { endpoint, successResponse } from "@/lib/api";
export const POST = endpoint(async (req) => {
  const user = await authenticate(req);
  await (
    await database()
  )
    .collection("users")
    .updateOne({ _id: user._id }, { $inc: { sessionVersion: 1 } });
  return successResponse({ message: "Signed out" }, 200);
});
