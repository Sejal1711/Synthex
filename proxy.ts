import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/health",
  "/api/evaluation",
  "/api/docs",
  "/api-docs",
  "/login",
  "/register",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isPublic) return NextResponse.next();

  if (pathname.startsWith("/api/cron")) {
    const auth = req.headers.get("authorization");
    const expected = `Bearer ${process.env.CRON_SECRET}`;
    if (auth !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const token =
      req.cookies.get("token")?.value ??
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const headers = new Headers(req.headers);
    headers.set("x-user-id", payload.sub);
    headers.set("x-user-email", payload.email);
    return NextResponse.next({ request: { headers } });
  }

  const token =
    req.cookies.get("token")?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
