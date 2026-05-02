import { pgTable, text, boolean, timestamp, real, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cleanersTable = pgTable("cleaners", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  bio: text("bio"),
  serviceTypes: jsonb("service_types").$type<string[]>().notNull().default([]),
  hourlyRate: real("hourly_rate").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationBadge: text("verification_badge").notNull().default("none"),
  trustScore: real("trust_score").notNull().default(0),
  repeatBookingRate: real("repeat_booking_rate").notNull().default(0),
  completionRate: real("completion_rate").notNull().default(0),
  responseTime: text("response_time").default("< 1 hour"),
  totalBookings: integer("total_bookings").notNull().default(0),
  averageRating: real("average_rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  wouldWorkAgainPct: real("would_work_again_pct").notNull().default(0),
  cancellationRate: real("cancellation_rate").notNull().default(0),
  serviceRadius: real("service_radius").notNull().default(10),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  availabilityLastToggled: timestamp("availability_last_toggled"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCleanerSchema = createInsertSchema(cleanersTable).omit({ createdAt: true, updatedAt: true });
export type InsertCleaner = z.infer<typeof insertCleanerSchema>;
export type Cleaner = typeof cleanersTable.$inferSelect;
