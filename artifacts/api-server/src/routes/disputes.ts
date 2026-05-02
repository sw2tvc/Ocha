import { Router } from "express";
import { db } from "@workspace/db";
import { disputesTable, bookingsTable, usersTable, cleanersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

/* GET /bookings/:bookingId/dispute — get dispute for a booking */
router.get("/bookings/:bookingId/dispute", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { bookingId } = req.params;

  const [dispute] = await db
    .select()
    .from(disputesTable)
    .where(eq(disputesTable.bookingId, bookingId))
    .limit(1);

  if (!dispute) return res.status(404).json({ error: "No dispute found for this booking" });

  /* Enrich with raisedBy user name */
  const [raisedByUser] = await db
    .select({ fullName: usersTable.fullName, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, dispute.raisedBy))
    .limit(1);

  const [againstUser] = await db
    .select({ fullName: usersTable.fullName, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, dispute.againstUserId))
    .limit(1);

  return res.json({
    ...dispute,
    raisedByName: raisedByUser?.fullName || "Unknown",
    raisedByAvatar: raisedByUser?.avatarUrl,
    againstUserName: againstUser?.fullName || "Unknown",
    againstUserAvatar: againstUser?.avatarUrl,
  });
});

/* POST /disputes — raise a new dispute */
router.post("/disputes", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const schema = z.object({
    bookingId: z.string(),
    reason: z.enum([
      "incomplete_clean",
      "damage",
      "no_show",
      "late_arrival",
      "safety_concern",
      "payment_issue",
      "other",
    ]),
    description: z.string().min(20),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  /* Check booking exists and user is involved */
  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, parsed.data.bookingId))
    .limit(1);

  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.customerId !== userId && booking.cleanerId !== "cleaner-" + userId) {
    /* Also allow cleaner user IDs via their cleaner record */
    const [cleanerRecord] = await db
      .select()
      .from(cleanersTable)
      .where(eq(cleanersTable.userId, userId))
      .limit(1);
    const isInvolved =
      booking.customerId === userId ||
      (cleanerRecord && booking.cleanerId === cleanerRecord.id);
    if (!isInvolved) return res.status(403).json({ error: "Not involved in this booking" });
  }

  /* Check no dispute exists already */
  const [existing] = await db
    .select()
    .from(disputesTable)
    .where(eq(disputesTable.bookingId, parsed.data.bookingId))
    .limit(1);

  if (existing) {
    return res.status(409).json({ error: "Dispute already exists", disputeId: existing.id });
  }

  /* Determine the other party */
  let againstUserId: string;
  if (booking.customerId === userId) {
    /* Customer raising against cleaner — need to get cleaner's userId */
    const [cleanerRecord] = await db
      .select({ userId: cleanersTable.userId })
      .from(cleanersTable)
      .where(eq(cleanersTable.id, booking.cleanerId))
      .limit(1);
    againstUserId = cleanerRecord?.userId || booking.cleanerId;
  } else {
    againstUserId = booking.customerId;
  }

  const disputeId = `dispute-${Date.now()}`;

  const [dispute] = await db
    .insert(disputesTable)
    .values({
      id: disputeId,
      bookingId: parsed.data.bookingId,
      raisedBy: userId,
      againstUserId,
      reason: parsed.data.reason,
      description: parsed.data.description,
      status: "open",
    })
    .returning();

  /* Update booking status to disputed */
  await db
    .update(bookingsTable)
    .set({ status: "disputed", updatedAt: new Date() })
    .where(eq(bookingsTable.id, parsed.data.bookingId));

  return res.status(201).json({
    disputeId: dispute.id,
    status: dispute.status,
    message: "Dispute raised. Ocha's Trust Team will review within 24 hours.",
  });
});

/* POST /disputes/:disputeId/evidence — submit evidence */
router.post("/disputes/:disputeId/evidence", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { disputeId } = req.params;

  const schema = z.object({
    evidence: z.string().min(20),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [dispute] = await db
    .select()
    .from(disputesTable)
    .where(eq(disputesTable.id, disputeId))
    .limit(1);

  if (!dispute) return res.status(404).json({ error: "Dispute not found" });

  /* Determine if raiser or respondent */
  const isRaiser = dispute.raisedBy === userId;
  const isRespondent = dispute.againstUserId === userId;
  if (!isRaiser && !isRespondent) return res.status(403).json({ error: "Not involved in this dispute" });

  const updateFields = isRaiser
    ? { raisedByEvidence: parsed.data.evidence, status: "evidence_submitted" as const, updatedAt: new Date() }
    : { againstUserEvidence: parsed.data.evidence, status: "evidence_submitted" as const, updatedAt: new Date() };

  const [updated] = await db
    .update(disputesTable)
    .set(updateFields)
    .where(eq(disputesTable.id, disputeId))
    .returning();

  return res.json({
    disputeId: updated.id,
    status: updated.status,
    message: "Evidence received. The Trust Team will review both accounts.",
  });
});

export default router;
