import { pgTable, text, boolean, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertyTypeEnum = pgEnum("property_type", ["apartment", "house", "office", "airbnb", "hmo", "serviced_accommodation", "other"]);
export const cleaningFrequencyEnum = pgEnum("cleaning_frequency", ["once", "weekly", "biweekly", "monthly", "on_demand"]);

export const propertiesTable = pgTable("properties", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  propertyType: propertyTypeEnum("property_type").notNull().default("apartment"),
  addressLine1: text("address_line1").notNull(),
  city: text("city").notNull(),
  postcode: text("postcode").notNull(),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  photoUrl: text("photo_url"),
  entrancePhotoUrl: text("entrance_photo_url"),
  accessNotes: text("access_notes"),
  parkingInfo: text("parking_info"),
  hasLift: boolean("has_lift").notNull().default(false),
  petsInfo: text("pets_info"),
  cleaningFrequency: cleaningFrequencyEnum("cleaning_frequency").notNull().default("on_demand"),
  preferredCleanerId: text("preferred_cleaner_id"),
  bedroomCount: integer("bedroom_count"),
  bathroomCount: integer("bathroom_count"),
  sqft: integer("sqft"),
  qrCodeUrl: text("qr_code_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ createdAt: true, updatedAt: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
