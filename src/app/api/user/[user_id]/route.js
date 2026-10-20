import { authenticate } from "@/lib/auth";
import { endpoint, id, fail, publicUser, successResponse } from "@/lib/api";
export const GET = endpoint(async (req, { params }) => {
  const user = await authenticate(req);
  if (!id((await params).user_id).equals(user._id))
    fail("You may only view your own profile", 403);
  return successResponse(publicUser(user), 200);
});
