import { pgTable, text, timestamp, boolean, unique } from "drizzle-orm/pg-core";

export const cleanerAvailabilityTable = pgTable(
  "cleaner_availability",
  {
    id: text("id").primaryKey(),
    cleanerId: text("cleaner_id").notNull(),
    date: text("date").notNull(),               /* YYYY-MM-DD */
    isBlocked: boolean("is_blocked").notNull().default(true),
    reason: text("reason"),                     /* holiday | personal | fully_booked | other */
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique("cleaner_date_unique").on(t.cleanerId, t.date)]
);

export type CleanerAvailability = typeof cleanerAvailabilityTable.$inferSelect;
export type InsertCleanerAvailability = typeof cleanerAvailabilityTable.$inferInsert;
