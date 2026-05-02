import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, cleanersTable, propertiesTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

const hydrateBooking = async (booking: typeof bookingsTable.$inferSelect) => {
  const [customer, property] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, booking.customerId)).limit(1),
    db.select().from(propertiesTable).where(eq(propertiesTable.id, booking.propertyId)).limit(1),
  ]);

  const cleanerRow = await db
    .select({ cleaner: cleanersTable, user: usersTable })
    .from(cleanersTable)
    .leftJoin(usersTable, eq(cleanersTable.userId, usersTable.id))
    .where(eq(cleanersTable.id, booking.cleanerId))
    .limit(1);

  return {
    ...booking,
    customer: customer[0] || null,
    property: property[0] || null,
    cleaner: cleanerRow[0] ? {
      id: cleanerRow[0].cleaner.id,
      userId: cleanerRow[0].cleaner.userId,
      fullName: cleanerRow[0].user?.fullName || "Unknown",
      avatarUrl: cleanerRow[0].user?.avatarUrl,
      isVerified: cleanerRow[0].cleaner.isVerified,
      verificationBadge: cleanerRow[0].cleaner.verificationBadge,
      trustScore: cleanerRow[0].cleaner.trustScore,
      averageRating: cleanerRow[0].cleaner.averageRating,
      totalBookings: cleanerRow[0].cleaner.totalBookings,
    } : null,
  };
};

router.get("/bookings", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { role, status, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const conditions = role === "cleaner"
    ? [eq(bookingsTable.cleanerId, userId)]
    : [eq(bookingsTable.customerId, userId)];

  if (status) {
    conditions.push(eq(bookingsTable.status, status as any));
  }

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(and(...conditions))
    .limit(Number(limit))
    .offset(offset)
    .orderBy(bookingsTable.scheduledAt);

  const hydrated = await Promise.all(bookings.map(hydrateBooking));
  return res.json({ bookings: hydrated, total: hydrated.length, page: Number(page) });
});

router.post("/bookings", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { cleanerId, propertyId, serviceType, scheduledAt, estimatedDurationHours = 2, urgency = "standard", notes } = req.body;

  const hourlyRate = 25;
  const totalPrice = hourlyRate * estimatedDurationHours;
  const id = randomUUID();

  const created = await db
    .insert(bookingsTable)
    .values({
      id,
      customerId: userId,
      cleanerId,
      propertyId,
      serviceType: serviceType || "standard",
      status: "pending",
      scheduledAt: new Date(scheduledAt),
      estimatedDurationHours,
      totalPrice,
      urgency: urgency || "standard",
      notes,
    })
    .returning();

  await db.insert(notificationsTable).values({
    id: randomUUID(),
    userId: cleanerId,
    type: "booking_request",
    title: "New booking request",
    message: "You have a new booking request",
    isRead: false,
    bookingId: id,
  });

  const hydrated = await hydrateBooking(created[0]);
  return res.status(201).json(hydrated);
});

router.get("/bookings/:bookingId", async (req, res) => {
  const booking = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, req.params.bookingId))
    .limit(1);

  if (!booking.length) return res.status(404).json({ error: "Booking not found" });
  const hydrated = await hydrateBooking(booking[0]);
  return res.json(hydrated);
});

router.put("/bookings/:bookingId/status", async (req, res) => {
  const { status } = req.body;
  const updated = await db
    .update(bookingsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(bookingsTable.id, req.params.bookingId))
    .returning();

  if (!updated.length) return res.status(404).json({ error: "Booking not found" });
  const hydrated = await hydrateBooking(updated[0]);
  return res.json(hydrated);
});

router.post("/bookings/:bookingId/cancel", async (req, res) => {
  const { reason } = req.body;
  const updated = await db
    .update(bookingsTable)
    .set({ status: "cancelled", cancellationReason: reason, updatedAt: new Date() })
    .where(eq(bookingsTable.id, req.params.bookingId))
    .returning();

  if (!updated.length) return res.status(404).json({ error: "Booking not found" });
  const hydrated = await hydrateBooking(updated[0]);
  return res.json(hydrated);
});

export default router;
