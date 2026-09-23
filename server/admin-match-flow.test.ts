import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function adminContext(): TrpcContext {
  const now = new Date();
  return { user: { id: 1, openId: "admin-flow-test", name: "Admin Test", email: "admin-flow@test.local", loginMethod: "admin-password", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("admin match flow", () => {
  it("creates a match and exposes it to the public feed", async () => {
    const caller = appRouter.createCaller(adminContext());
    const slug = `flow-test-${Date.now()}`;
    const created = await caller.matches.create({ slug, competition: "اختبار البطولة", round: "اختبار", homeTeam: "السعودية", awayTeam: "الكويت", venue: "ملعب الاختبار", city: "الرياض", matchDate: new Date(Date.now() + 86400000).toISOString(), matchTime: "09:00 مساءً", homeScore: null, awayScore: null, status: "available", ticketLabel: "التذاكر متاحة الآن", accentColor: "emerald", isPublished: true });
    try {
      const publicMatches = await caller.matches.listPublic();
      expect(publicMatches.some(match => match.id === created.id && match.homeTeam === "السعودية" && match.awayTeam === "الكويت")).toBe(true);
    } finally {
      await caller.matches.delete({ id: created.id });
    }
  });

  it("marks a past match as finished when the feed is read", async () => {
    const caller = appRouter.createCaller(adminContext());
    const slug = `past-flow-test-${Date.now()}`;
    const created = await caller.matches.create({ slug, competition: "اختبار الحالة", round: "اختبار", homeTeam: "قطر", awayTeam: "البحرين", venue: "ملعب الاختبار", city: "الدوحة", matchDate: new Date(Date.now() - 86400000).toISOString(), matchTime: "08:00 مساءً", homeScore: null, awayScore: null, status: "available", ticketLabel: "التذاكر متاحة الآن", accentColor: "emerald", isPublished: true });
    try {
      const publicMatches = await caller.matches.listPublic();
      const match = publicMatches.find(item => item.id === created.id);
      expect(match?.status).toBe("finished");
    } finally {
      await caller.matches.delete({ id: created.id });
    }
  });
});
