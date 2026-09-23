import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import type { User } from "../drizzle/schema";
import { ensureAdminCredential, getAdminCredential, getUserByOpenId, upsertUser } from "./db";
import { ENV } from "./_core/env";

export const ADMIN_SESSION_COOKIE = "match_admin_session";
const sessionSecret = new TextEncoder().encode(ENV.cookieSecret || "local-admin-session-secret-change-me");
const sessionEmail = (email: string) => `admin:${email.toLowerCase().trim()}`;

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

export function verifyAdminPassword(password: string, stored: string) {
  const [algorithm, salt, digest] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !digest) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export async function signAdminSession(email: string) {
  return new SignJWT({ email: email.toLowerCase().trim(), scope: "admin" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(sessionSecret);
}

export async function verifyAdminSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret, { algorithms: ["HS256"] });
    return typeof payload.email === "string" && payload.scope === "admin" ? payload.email : null;
  } catch {
    return null;
  }
}

export async function getAdminFromRequest(req: Request): Promise<User | null> {
  const cookieToken = parseCookieHeader(req.headers.cookie ?? "")[ADMIN_SESSION_COOKIE];
  const bearerToken = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined;
  const email = await verifyAdminSession(cookieToken ?? bearerToken);
  if (!email) return null;
  return (await getUserByOpenId(sessionEmail(email))) ?? null;
}

export async function loginAdmin(email: string, password: string, res: Response) {
  const normalized = email.toLowerCase().trim();
  const credential = await getAdminCredential(normalized);
  if (!credential || !verifyAdminPassword(password, credential.passwordHash)) return null;
  await upsertUser({ openId: sessionEmail(normalized), email: normalized, name: "مدير الموقع", loginMethod: "admin-password", role: "admin" });
  const token = await signAdminSession(normalized);
  res.cookie(ADMIN_SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: ENV.isProduction, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" });
  const user = await getUserByOpenId(sessionEmail(normalized));
  return user ? { user, token } : null;
}

export function logoutAdmin(res: Response) {
  res.clearCookie(ADMIN_SESSION_COOKIE, { httpOnly: true, sameSite: "lax", secure: ENV.isProduction, path: "/" });
}

export async function provisionInitialAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  await ensureAdminCredential(email, hashAdminPassword(password));
}

export function safeAdminEmail(value: string) {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex").slice(0, 12);
}
