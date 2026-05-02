import { pgTable, text, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "evidence_submitted",
  "under_review",
  "resolved",
  "dismissed",
]);

export const disputeReasonEnum = pgEnum("dispute_reason", [
  "incomplete_clean",
  "damage",
  "no_show",
  "late_arrival",
  "safety_concern",
  "payment_issue",
  "other",
]);

export const disputesTable = pgTable("disputes", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  raisedBy: text("raised_by").notNull(),       /* userId */
  againstUserId: text("against_user_id").notNull(),
  status: disputeStatusEnum("status").notNull().default("open"),
  reason: disputeReasonEnum("reason").notNull(),
  description: text("description").notNull(),
  raisedByEvidence: text("raised_by_evidence"),
  againstUserEvidence: text("against_user_evidence"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDisputeSchema = createInsertSchema(disputesTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type Dispute = typeof disputesTable.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
