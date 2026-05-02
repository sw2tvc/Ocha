import { pgTable, text, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serviceTypeEnum = pgEnum("service_type", ["standard", "deep_clean", "end_of_tenancy", "airbnb_turnover", "office", "recurring"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "accepted", "en_route", "in_progress", "completed", "cancelled", "disputed"]);
export const bookingUrgencyEnum = pgEnum("booking_urgency", ["standard", "urgent", "emergency"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "customer_submitted", "cleaner_submitted", "both_submitted", "revealed"]);

export const bookingsTable = pgTable("bookings", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  cleanerId: text("cleaner_id").notNull(),
  propertyId: text("property_id").notNull(),
  serviceType: serviceTypeEnum("service_type").notNull().default("standard"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  estimatedDurationHours: real("estimated_duration_hours").notNull().default(2),
  totalPrice: real("total_price").notNull().default(0),
  urgency: bookingUrgencyEnum("urgency").notNull().default("standard"),
  notes: text("notes"),
  cancellationReason: text("cancellation_reason"),
  reviewStatus: reviewStatusEnum("review_status").notNull().default("pending"),
  reviewRevealAt: timestamp("review_reveal_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
