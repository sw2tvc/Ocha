import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, cleanersTable, propertiesTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

/* ── Helpers ──────────────────────────────────────── */
const SERVICE_LABELS: Record<string, string> = {
  standard:        "Standard Clean",
  deep_clean:      "Deep Clean",
  airbnb_turnover: "Airbnb Turnover",
  end_of_tenancy:  "End of Tenancy",
  office:          "Office Clean",
  recurring:       "Recurring Clean",
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

async function notify(
  userId: string,
  type: "booking_request" | "booking_accepted" | "booking_en_route" | "booking_started" | "booking_completed" | "review_request" | "review_revealed" | "trust_update" | "system",
  title: string,
  message: string,
  bookingId?: string
) {
  await db.insert(notificationsTable).values({
    id: randomUUID(),
    userId,
    type,
    title,
    message,
    isRead: false,
    bookingId,
  });
}

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

/* ── List bookings ────────────────────────────────── */
router.get("/bookings", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { role, status, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const conditions = role === "cleaner"
    ? [eq(bookingsTable.cleanerId, userId)]
    : [eq(bookingsTable.customerId, userId)];

  if (status) conditions.push(eq(bookingsTable.status, status as any));

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

/* ── Create booking ───────────────────────────────── */
router.post("/bookings", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { cleanerId, propertyId, serviceType, scheduledAt, estimatedDurationHours = 2, urgency = "standard", notes } = req.body;

  const hourlyRate = 25;
  const totalPrice = hourlyRate * estimatedDurationHours;
  const id = randomUUID();

  /* Look up cleaner user ID + customer name + property name in parallel */
  const [cleanerRow, customerRow, propertyRow] = await Promise.all([
    db.select({ userId: cleanersTable.userId, fullName: usersTable.fullName })
      .from(cleanersTable)
      .leftJoin(usersTable, eq(cleanersTable.userId, usersTable.id))
      .where(eq(cleanersTable.id, cleanerId))
      .limit(1),
    db.select({ fullName: usersTable.fullName })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1),
    db.select({ name: propertiesTable.name })
      .from(propertiesTable)
      .where(eq(propertiesTable.id, propertyId))
      .limit(1),
  ]);

  const cleanerUserId    = cleanerRow[0]?.userId;
  const cleanerFirstName = cleanerRow[0]?.fullName?.split(" ")[0] || "your cleaner";
  const customerName     = customerRow[0]?.fullName || "A customer";
  const customerFirst    = customerRow[0]?.fullName?.split(" ")[0] || "A customer";
  const propertyName     = propertyRow[0]?.name || "your property";
  const serviceLabel     = SERVICE_LABELS[serviceType] || serviceType;
  const dateLabel        = fmtDate(scheduledAt);

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

  /* ── Notifications ── */
  const notifTasks: Promise<void>[] = [];

  /* 1. Alert the cleaner (use their user account ID, not their profile ID) */
  if (cleanerUserId) {
    notifTasks.push(notify(
      cleanerUserId,
      "booking_request",
      "New booking request",
      `${customerName} wants a ${serviceLabel} at ${propertyName} on ${dateLabel}. Tap to review and accept.`,
      id
    ));
  }

  /* 2. Confirm to the customer */
  notifTasks.push(notify(
    userId,
    "booking_request",
    "Booking request sent",
    `Your ${serviceLabel} request for ${dateLabel} at ${propertyName} has been sent to ${cleanerFirstName}. You'll be notified when they respond.`,
    id
  ));

  await Promise.all(notifTasks);

  const hydrated = await hydrateBooking(created[0]);
  return res.status(201).json(hydrated);
});

/* ── Get single booking ───────────────────────────── */
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

/* ── Update booking status ────────────────────────── */
router.put("/bookings/:bookingId/status", async (req, res) => {
  const { status } = req.body;
  const updated = await db
    .update(bookingsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(bookingsTable.id, req.params.bookingId))
    .returning();

  if (!updated.length) return res.status(404).json({ error: "Booking not found" });

  const booking = updated[0];

  /* Look up cleaner userId + customer + property for rich notifications */
  const [cleanerRow, customerRow, propertyRow] = await Promise.all([
    db.select({ userId: cleanersTable.userId, fullName: usersTable.fullName })
      .from(cleanersTable)
      .leftJoin(usersTable, eq(cleanersTable.userId, usersTable.id))
      .where(eq(cleanersTable.id, booking.cleanerId))
      .limit(1),
    db.select({ fullName: usersTable.fullName })
      .from(usersTable)
      .where(eq(usersTable.id, booking.customerId))
      .limit(1),
    db.select({ name: propertiesTable.name })
      .from(propertiesTable)
      .where(eq(propertiesTable.id, booking.propertyId))
      .limit(1),
  ]);

  const cleanerFirst  = cleanerRow[0]?.fullName?.split(" ")[0] || "Your cleaner";
  const customerFirst = customerRow[0]?.fullName?.split(" ")[0] || "your customer";
  const property      = propertyRow[0]?.name || "the property";
  const dateLabel     = fmtDate(booking.scheduledAt);

  /* Send the right notification to the right party */
  const notifMap: Record<string, { userId: string; type: Parameters<typeof notify>[1]; title: string; message: string } | null> = {
    accepted: {
      userId: booking.customerId,
      type: "booking_accepted",
      title: "Booking confirmed!",
      message: `${cleanerFirst} has accepted your booking on ${dateLabel} at ${property}. See you then!`,
    },
    en_route: {
      userId: booking.customerId,
      type: "booking_en_route",
      title: `${cleanerFirst} is on the way`,
      message: `${cleanerFirst} has started travelling to ${property}. They should arrive shortly.`,
    },
    in_progress: {
      userId: booking.customerId,
      type: "booking_started",
      title: "Cleaning has started",
      message: `${cleanerFirst} has started the clean at ${property}. We'll let you know when they're done.`,
    },
    completed: {
      userId: booking.customerId,
      type: "booking_completed",
      title: "Cleaning complete!",
      message: `${cleanerFirst} has finished the clean at ${property}. How did they do? Leave a review now.`,
    },
  };

  const notifData = notifMap[status];
  if (notifData) {
    await notify(notifData.userId, notifData.type, notifData.title, notifData.message, booking.id);
  }

  /* When completed, also send a review-request notification */
  if (status === "completed") {
    await notify(
      booking.customerId,
      "review_request",
      "Leave a review",
      `How was your ${cleanerFirst} clean at ${property} on ${dateLabel}? Your review is kept private until they review you too.`,
      booking.id
    );
  }

  const hydrated = await hydrateBooking(booking);
  return res.json(hydrated);
});

/* ── Cancel booking ───────────────────────────────── */
router.post("/bookings/:bookingId/cancel", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const { reason } = req.body;

  const updated = await db
    .update(bookingsTable)
    .set({ status: "cancelled", cancellationReason: reason, updatedAt: new Date() })
    .where(eq(bookingsTable.id, req.params.bookingId))
    .returning();

  if (!updated.length) return res.status(404).json({ error: "Booking not found" });

  const booking = updated[0];

  /* Notify the other party */
  const [cleanerRow, customerRow, propertyRow] = await Promise.all([
    db.select({ userId: cleanersTable.userId, fullName: usersTable.fullName })
      .from(cleanersTable)
      .leftJoin(usersTable, eq(cleanersTable.userId, usersTable.id))
      .where(eq(cleanersTable.id, booking.cleanerId))
      .limit(1),
    db.select({ fullName: usersTable.fullName })
      .from(usersTable)
      .where(eq(usersTable.id, booking.customerId))
      .limit(1),
    db.select({ name: propertiesTable.name })
      .from(propertiesTable)
      .where(eq(propertiesTable.id, booking.propertyId))
      .limit(1),
  ]);

  const cleanerUserId = cleanerRow[0]?.userId;
  const customerFirst = customerRow[0]?.fullName?.split(" ")[0] || "your customer";
  const cleanerFirst  = cleanerRow[0]?.fullName?.split(" ")[0] || "Your cleaner";
  const property      = propertyRow[0]?.name || "the property";
  const dateLabel     = fmtDate(booking.scheduledAt);

  const isCustomerCancelling = userId === booking.customerId;

  if (isCustomerCancelling && cleanerUserId) {
    /* Tell the cleaner the customer cancelled */
    await notify(
      cleanerUserId,
      "system",
      "Booking cancelled",
      `${customerFirst} has cancelled the ${dateLabel} booking at ${property}. Your calendar has been freed up.`,
      booking.id
    );
  } else {
    /* Tell the customer the cleaner cancelled */
    await notify(
      booking.customerId,
      "system",
      "Booking cancelled by cleaner",
      `${cleanerFirst} has had to cancel your ${dateLabel} booking at ${property}. We're sorry for the inconvenience.`,
      booking.id
    );
  }

  const hydrated = await hydrateBooking(booking);
  return res.json(hydrated);
});

export default router;
