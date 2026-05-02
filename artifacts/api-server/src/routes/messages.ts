import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable, bookingsTable, usersTable, cleanersTable } from "@workspace/db";
import { eq, asc, or } from "drizzle-orm";
import { z } from "zod";

const router = Router();

/* GET /bookings/:bookingId/messages */
router.get("/bookings/:bookingId/messages", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { bookingId } = req.params;

  /* Verify user is part of this booking */
  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!booking) return res.status(404).json({ error: "Booking not found" });

  /* Get the cleaner's userId for participation check */
  const [cleanerRecord] = await db
    .select({ userId: cleanersTable.userId })
    .from(cleanersTable)
    .where(eq(cleanersTable.id, booking.cleanerId))
    .limit(1);

  const cleanerUserId = cleanerRecord?.userId;
  const isParticipant = booking.customerId === userId || cleanerUserId === userId;
  if (!isParticipant) return res.status(403).json({ error: "Not involved in this booking" });

  /* Fetch all messages for this booking */
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.bookingId, bookingId))
    .orderBy(asc(messagesTable.createdAt));

  /* Enrich with sender info */
  const senderIds = [...new Set(messages.map((m) => m.senderId))];
  const senders = senderIds.length
    ? await db
        .select({ id: usersTable.id, fullName: usersTable.fullName, avatarUrl: usersTable.avatarUrl })
        .from(usersTable)
        .where(or(...senderIds.map((id) => eq(usersTable.id, id))))
    : [];

  const senderMap = Object.fromEntries(senders.map((s) => [s.id, s]));

  /* Mark messages as read for this user */
  if (messages.some((m) => m.recipientId === userId && !m.isRead)) {
    await db
      .update(messagesTable)
      .set({ isRead: true })
      .where(eq(messagesTable.bookingId, bookingId));
  }

  const enriched = messages.map((m) => ({
    ...m,
    senderName: senderMap[m.senderId]?.fullName || "Unknown",
    senderAvatar: senderMap[m.senderId]?.avatarUrl,
    isMine: m.senderId === userId,
  }));

  /* Build other-party info for the header */
  const otherPartyId = booking.customerId === userId ? cleanerUserId : booking.customerId;
  const otherParty = senderMap[otherPartyId || ""] || senders.find((s) => s.id === otherPartyId);

  /* If other party has no messages yet, still look them up */
  let otherPartyInfo = otherParty;
  if (!otherPartyInfo && otherPartyId) {
    const [found] = await db
      .select({ id: usersTable.id, fullName: usersTable.fullName, avatarUrl: usersTable.avatarUrl })
      .from(usersTable)
      .where(eq(usersTable.id, otherPartyId))
      .limit(1);
    otherPartyInfo = found;
  }

  return res.json({
    messages: enriched,
    bookingId,
    otherParty: otherPartyInfo
      ? { id: otherPartyInfo.id, fullName: otherPartyInfo.fullName, avatarUrl: otherPartyInfo.avatarUrl }
      : null,
    cleanerUserId,
  });
});

/* POST /bookings/:bookingId/messages */
router.post("/bookings/:bookingId/messages", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { bookingId } = req.params;

  const schema = z.object({ content: z.string().min(1).max(2000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid content" });

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const [cleanerRecord] = await db
    .select({ userId: cleanersTable.userId })
    .from(cleanersTable)
    .where(eq(cleanersTable.id, booking.cleanerId))
    .limit(1);

  const cleanerUserId = cleanerRecord?.userId;
  const isParticipant = booking.customerId === userId || cleanerUserId === userId;
  if (!isParticipant) return res.status(403).json({ error: "Not involved in this booking" });

  const recipientId = booking.customerId === userId ? (cleanerUserId || booking.cleanerId) : booking.customerId;

  const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const [message] = await db
    .insert(messagesTable)
    .values({
      id: msgId,
      bookingId,
      senderId: userId,
      recipientId,
      content: parsed.data.content,
      isRead: false,
    })
    .returning();

  /* Enrich with sender info */
  const [sender] = await db
    .select({ fullName: usersTable.fullName, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  return res.status(201).json({
    ...message,
    senderName: sender?.fullName || "You",
    senderAvatar: sender?.avatarUrl,
    isMine: true,
  });
});

export default router;
