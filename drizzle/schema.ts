import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const matchStatusEnum = pgEnum("match_status", ["available", "limited", "sold_out", "finished"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const adminCredentials = pgTable("admin_credentials", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AdminCredential = typeof adminCredentials.$inferSelect;
export type InsertAdminCredential = typeof adminCredentials.$inferInsert;

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  matchNumber: integer("match_number").notNull().unique(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  competition: varchar("competition", { length: 160 }).notNull(),
  stage: varchar("stage", { length: 40 }).notNull(),
  groupName: varchar("group_name", { length: 10 }),
  round: varchar("round", { length: 100 }).notNull(),
  homeTeam: varchar("home_team", { length: 120 }).notNull(),
  awayTeam: varchar("away_team", { length: 120 }).notNull(),
  homeShort: varchar("home_short", { length: 12 }).notNull(),
  awayShort: varchar("away_short", { length: 12 }).notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  venue: varchar("venue", { length: 160 }),
  city: varchar("city", { length: 100 }).notNull(),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Riyadh"),
  matchDate: timestamp("match_date", { withTimezone: true }).notNull(),
  matchTime: varchar("match_time", { length: 30 }),
  status: matchStatusEnum("status").default("available").notNull(),
  ticketLabel: varchar("ticket_label", { length: 120 }).notNull(),
  accentColor: varchar("accent_color", { length: 30 }).default("emerald").notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  note: text("note"),
  sourceJson: text("source_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;
