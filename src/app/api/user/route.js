import { authenticate } from "@/lib/auth";
import { endpoint, publicUser, successResponse } from "@/lib/api";
export const GET = endpoint(async (req) =>
  successResponse(publicUser(await authenticate(req)), 200),
);
