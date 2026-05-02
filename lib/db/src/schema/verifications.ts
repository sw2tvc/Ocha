import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  idVerified: boolean("id_verified").notNull().default(false),
  selfieVerified: boolean("selfie_verified").notNull().default(false),
  addressVerified: boolean("address_verified").notNull().default(false),
  backgroundCheckDone: boolean("background_check_done").notNull().default(false),
  paymentVerified: boolean("payment_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVerificationSchema = createInsertSchema(verificationsTable).omit({ createdAt: true, updatedAt: true });
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type Verification = typeof verificationsTable.$inferSelect;
