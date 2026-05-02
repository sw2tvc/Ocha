import { pgTable, text, boolean, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["customer", "cleaner", "property_manager", "admin"]);
export const verificationBadgeEnum = pgEnum("verification_badge", ["none", "basic", "verified", "trusted"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("customer"),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationBadge: verificationBadgeEnum("verification_badge").notNull().default("none"),
  trustScore: real("trust_score").notNull().default(0),
  isSuspended: boolean("is_suspended").notNull().default(false),
  suspensionReason: text("suspension_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
