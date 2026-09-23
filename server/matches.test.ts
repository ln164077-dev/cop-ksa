import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "admin" | "user" | null): TrpcContext {
  return {
    user: role
      ? {
          id: 1,
          openId: `test-${role}`,
          name: "Test User",
          email: "test@example.com",
          loginMethod: "manus",
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("matches router", () => {
  it("exposes an array for the public JSON match feed", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const result = await caller.matches.listPublic();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(15);
    expect(result.every(match => ["available", "limited", "sold_out", "finished"].includes(match.status))).toBe(true);
  });

  it("blocks regular users from the administrative match feed", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.matches.listAdmin()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
