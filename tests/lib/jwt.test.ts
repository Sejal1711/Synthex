import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "@/lib/auth/jwt";

describe("JWT", () => {
  const payload = { sub: "user-123", email: "test@example.com" };

  it("signs and verifies a token", async () => {
    const token = await signToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe(payload.sub);
    expect(verified?.email).toBe(payload.email);
  });

  it("returns null for an invalid token", async () => {
    const result = await verifyToken("not.a.valid.token");
    expect(result).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await signToken(payload);
    const tampered = token.slice(0, -5) + "XXXXX";
    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });
});
