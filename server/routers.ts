import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { createMatch, deleteMatch, getMatchById, listAllMatches, listPublishedMatches, moveMatch, updateMatch } from "./db";
import { formatBookingCategory, sendBookingNotification } from "./telegram";

const matchInput = z.object({
  slug: z.string().min(3).max(160),
  competition: z.string().min(2).max(160),
  round: z.string().min(2).max(100),
  homeTeam: z.string().min(2).max(120),
  awayTeam: z.string().min(2).max(120),
  venue: z.string().min(2).max(160),
  city: z.string().min(2).max(100),
  matchDate: z.string().datetime(),
  matchTime: z.string().min(2).max(30),
  homeScore: z.number().int().min(0).nullable().optional(),
  awayScore: z.number().int().min(0).nullable().optional(),
  status: z.enum(["available", "limited", "sold_out", "finished"]),
  ticketLabel: z.string().min(2).max(120),
  accentColor: z.string().min(2).max(30),
  isPublished: z.boolean(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  matches: router({
    listPublic: publicProcedure.query(() => listPublishedMatches()),
    listAdmin: adminProcedure.query(() => listAllMatches()),
    create: adminProcedure.input(matchInput).mutation(({ input }) => createMatch(input)),
    update: adminProcedure
      .input(z.object({ id: z.number().int().positive(), data: matchInput }))
      .mutation(({ input }) => updateMatch(input.id, input.data)),
    move: adminProcedure.input(z.object({ id: z.number().int().positive(), direction: z.enum(["up", "down"]) })).mutation(({ input }) => moveMatch(input.id, input.direction)),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteMatch(input.id)),
  }),
  bookings: router({
    notifyTelegram: publicProcedure.input(z.object({
      matchId: z.number().int().positive(),
      customerName: z.string().min(2).max(120),
      phone: z.string().min(5).max(40),
      delivery: z.enum(["whatsapp", "email"]),
      contact: z.string().min(3).max(160),
      category: z.string().min(1).max(40),
      quantity: z.number().int().min(1).max(20),
      total: z.number().finite().min(0).max(1000000),
      currency: z.enum(["SAR", "QAR"]).default("SAR"),
    })).mutation(async ({ input }) => {
      const match = await getMatchById(input.matchId);
      if (!match) throw new Error("المباراة غير موجودة");
      return sendBookingNotification({ ...input, category: formatBookingCategory(input.category), match });
    }),
  }),
});

export type AppRouter = typeof appRouter;
