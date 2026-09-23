import { and, asc, count, eq, lt, max, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { adminCredentials, InsertMatch, InsertUser, matches, users } from "../drizzle/schema";
import { tournamentData } from "../shared/tournament-data";
import { teamFlagCode } from "../shared/team-flags";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let seedPromise: Promise<void> | null = null;

export type MatchInput = {
  slug: string;
  competition: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeShort?: string;
  awayShort?: string;
  venue: string;
  city: string;
  matchDate: string;
  matchTime: string;
  status: "available" | "limited" | "sold_out" | "finished";
  ticketLabel: string;
  accentColor: string;
  isPublished: boolean;
  matchNumber?: number;
  stage?: string;
  groupName?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  timezone?: string;
  note?: string | null;
  sortOrder?: number;
};

const teamShort: Record<string, string> = {
  "السعودية": "KSA",
  "العراق": "IRQ",
  "عُمان": "OMA",
  "الكويت": "KUW",
  "الإمارات": "UAE",
  "قطر": "QAT",
  "البحرين": "BHR",
  "اليمن": "YEM",
};

function arabicTime(time: string | null) {
  if (!time) return "يحدد لاحقًا";
  const [hourString, minute] = time.split(":");
  const hour = Number(hourString);
  const isPm = hour >= 12;
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${minute} ${isPm ? "مساءً" : "صباحًا"}`;
}

function matchStatus(status: string): MatchInput["status"] {
  return status === "finished" ? "finished" : "available";
}

function matchAccent(matchNumber: number) {
  return ["emerald", "blue", "violet", "orange"][matchNumber % 4];
}

function toDate(date: string, time: string | null) {
  return new Date(`${date}T${time ?? "12:00"}:00+03:00`);
}

function sourceMatchToInput(item: (typeof tournamentData.matches)[number]): MatchInput {
  const stage = item.stage === "semifinal" ? "نصف النهائي" : item.stage === "final" ? "النهائي" : "دور المجموعات";
  const groupName = item.group ? `المجموعة ${item.group}` : null;
  const venue = item.venue ?? "يحدد لاحقًا";
  const status = matchStatus(item.status);
  return {
    matchNumber: item.match_number,
    slug: `match-${item.match_number}-${item.home_team}-${item.away_team}`.replace(/\s+/g, "-").toLowerCase(),
    competition: tournamentData.tournament.name_ar,
    round: groupName ?? stage,
    stage: item.stage,
    groupName,
    homeTeam: item.home_team,
    awayTeam: item.away_team,
    homeShort: teamShort[item.home_team] ?? "TBD",
    awayShort: teamShort[item.away_team] ?? "TBD",
    homeScore: item.home_score,
    awayScore: item.away_score,
    venue,
    city: item.city,
    timezone: item.timezone,
    matchDate: toDate(item.date, item.time).toISOString(),
    matchTime: arabicTime(item.time),
    status,
    ticketLabel: status === "finished" ? "النتيجة النهائية" : "التذاكر متاحة الآن",
    accentColor: matchAccent(item.match_number),
    isPublished: true,
    note: (item as { note?: string }).note ?? null,
  };
}

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      const client = postgres(ENV.databaseUrl, { max: 5, prepare: false });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
    lastSignedIn: user.lastSignedIn ?? new Date(),
  };
  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: {
      name: values.name,
      email: values.email,
      loginMethod: values.loginMethod,
      role: values.role,
      lastSignedIn: values.lastSignedIn,
      updatedAt: new Date(),
    },
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ value: count() }).from(users);
  return Number(result[0]?.value ?? 0);
}

export async function getAdminCredential(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminCredentials).where(eq(adminCredentials.email, email.toLowerCase().trim())).limit(1);
  return result[0];
}

export async function ensureAdminCredential(email: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  await db.insert(adminCredentials).values({ email: email.toLowerCase().trim(), passwordHash }).onConflictDoUpdate({ target: adminCredentials.email, set: { passwordHash, updatedAt: new Date() } });
}

function serializeMatchInput(input: MatchInput, includeMatchNumber = false): Partial<InsertMatch> {
  const baseValues = {
    slug: input.slug,
    competition: input.competition,
    stage: input.stage ?? "group",
    groupName: input.groupName ?? null,
    round: input.round,
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    homeShort: teamFlagCode(input.homeTeam),
    awayShort: teamFlagCode(input.awayTeam),
    homeScore: input.homeScore ?? null,
    awayScore: input.awayScore ?? null,
    venue: input.venue || "يحدد لاحقًا",
    city: input.city,
    timezone: input.timezone ?? "Asia/Riyadh",
    matchDate: new Date(input.matchDate),
    matchTime: input.matchTime || "يحدد لاحقًا",
    status: input.status,
    ticketLabel: input.ticketLabel,
    accentColor: input.accentColor,
    isPublished: input.isPublished,
    note: input.note ?? null,
    sourceJson: JSON.stringify(input),
  };
  return includeMatchNumber
    ? { ...baseValues, matchNumber: input.matchNumber ?? Math.floor(Date.now() / 1000), sortOrder: input.sortOrder ?? input.matchNumber ?? 0 }
    : baseValues;
}

async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const db = await getDb();
    if (!db) return;
    const result = await db.select({ value: count() }).from(matches);
    if ((result[0]?.value ?? 0) !== 0) return;
    const imported = tournamentData.matches.map(sourceMatchToInput).map(input => serializeMatchInput(input, true) as InsertMatch);
    await db.insert(matches).values(imported).onConflictDoNothing();
  })();
  return seedPromise;
}

export async function listPublishedMatches() {
  await ensureSeeded();
  await syncFinishedMatches();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matches).where(eq(matches.isPublished, true)).orderBy(asc(matches.sortOrder), asc(matches.matchDate), asc(matches.id));
}

export async function listAllMatches() {
  await ensureSeeded();
  await syncFinishedMatches();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matches).orderBy(asc(matches.sortOrder), asc(matches.matchDate), asc(matches.id));
}

export async function syncFinishedMatches() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.update(matches).set({ status: "finished", ticketLabel: "النتيجة النهائية", updatedAt: new Date() }).where(and(lt(matches.matchDate, new Date()), ne(matches.status, "finished"))).returning({ id: matches.id });
  return result.length;
}

export async function createMatch(input: MatchInput) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const currentMax = await db.select({ sortOrder: max(matches.sortOrder), matchNumber: max(matches.matchNumber) }).from(matches);
  const nextOrder = Number(currentMax[0]?.sortOrder ?? 0) + 1;
  const nextMatchNumber = Number(currentMax[0]?.matchNumber ?? 0) + 1;
  const [created] = await db.insert(matches).values({ ...serializeMatchInput(input, true), matchNumber: nextMatchNumber, sortOrder: nextOrder } as InsertMatch).returning({ id: matches.id });
  return { id: created.id };
}

export async function moveMatch(id: number, direction: "up" | "down") {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  return db.transaction(async tx => {
    const rows = await tx.select({ id: matches.id, sortOrder: matches.sortOrder }).from(matches).orderBy(asc(matches.sortOrder), asc(matches.matchDate), asc(matches.id));
    const currentIndex = rows.findIndex(row => row.id === id);
    if (currentIndex < 0) return { id, moved: false };
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= rows.length) return { id, moved: false };
    const currentOrder = rows[currentIndex].sortOrder;
    const targetOrder = rows[targetIndex].sortOrder;
    await tx.update(matches).set({ sortOrder: targetOrder }).where(eq(matches.id, id));
    await tx.update(matches).set({ sortOrder: currentOrder }).where(eq(matches.id, rows[targetIndex].id));
    return { id, moved: true };
  });
}

export async function updateMatch(id: number, input: MatchInput) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  await db.update(matches).set(serializeMatchInput(input)).where(eq(matches.id, id));
  return { id };
}

export async function deleteMatch(id: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  await db.delete(matches).where(eq(matches.id, id));
  return { id };
}
