import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { createUser, getUserByEmail } from "@/db/queries";
import { signToken } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { getTraceId } from "@/lib/utils/trace";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

export async function POST(req: NextRequest) {
  const traceId = getTraceId(req);

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit(ip, "auth");
  if (!rl.allowed) {
    return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests. Try again later.", traceId, 429);
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, traceId, 400, parsed.error.errors);
    }

    const { email, password, name } = parsed.data;
    const existing = await getUserByEmail(email);
    if (existing) {
      return errorResponse("CONFLICT", "Email already registered", traceId, 409);
    }

    const passwordHash = await hash(password, 12);
    const user = await createUser({ email, passwordHash, name });
    const token = await signToken({ sub: user.id, email: user.email });

    logger.info(traceId, { method: "POST", path: "/api/auth/register", status: 201 });

    const response = successResponse(
      { user: { id: user.id, email: user.email, name: user.name }, token },
      traceId,
      201
    );
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    logger.error(traceId, { method: "POST", path: "/api/auth/register", error: err });
    return errorResponse("INTERNAL_ERROR", "Registration failed", traceId, 500);
  }
}
