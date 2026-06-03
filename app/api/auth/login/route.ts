import { NextRequest } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { getUserByEmail } from "@/db/queries";
import { signToken } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { getTraceId } from "@/lib/utils/trace";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  const traceId = getTraceId(req);

  // Rate limit by IP: 10 attempts per 15 min
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit(ip, "auth");
  if (!rl.allowed) {
    return errorResponse("RATE_LIMIT_EXCEEDED", "Too many login attempts. Try again later.", traceId, 429);
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, traceId, 400, parsed.error.errors);
    }

    const { email, password } = parsed.data;
    const user = await getUserByEmail(email);

    if (!user) {
      return errorResponse("UNAUTHORIZED", "Invalid credentials", traceId, 401);
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      return errorResponse("UNAUTHORIZED", "Invalid credentials", traceId, 401);
    }

    const token = await signToken({ sub: user.id, email: user.email });

    logger.info(traceId, { method: "POST", path: "/api/auth/login", status: 200 });

    const response = successResponse(
      { user: { id: user.id, email: user.email, name: user.name }, token },
      traceId
    );
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    logger.error(traceId, { method: "POST", path: "/api/auth/login", error: err });
    return errorResponse("INTERNAL_ERROR", "Login failed", traceId, 500);
  }
}
