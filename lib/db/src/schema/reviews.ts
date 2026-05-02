import { pgTable, text, timestamp, real, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewerRoleEnum = pgEnum("reviewer_role", ["customer", "cleaner"]);

export const reviewsTable = pgTable("reviews", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  reviewerId: text("reviewer_id").notNull(),
  revieweeId: text("reviewee_id").notNull(),
  reviewerRole: reviewerRoleEnum("reviewer_role").notNull(),
  punctualityRating: integer("punctuality_rating"),
  professionalismRating: integer("professionalism_rating"),
  qualityRating: integer("quality_rating"),
  communicationRating: integer("communication_rating"),
  reliabilityRating: integer("reliability_rating"),
  overallRating: real("overall_rating").notNull(),
  comment: text("comment"),
  wouldWorkAgain: boolean("would_work_again").notNull().default(true),
  isRevealed: boolean("is_revealed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
