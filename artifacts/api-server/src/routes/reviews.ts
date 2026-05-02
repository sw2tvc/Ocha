import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, bookingsTable } from "@workspace/db";
import { eq, and, avg } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

router.post("/reviews", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { bookingId, punctualityRating, professionalismRating, qualityRating, communicationRating, reliabilityRating, comment, wouldWorkAgain } = req.body;

  const booking = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking.length) return res.status(404).json({ error: "Booking not found" });

  const b = booking[0];
  const reviewerRole = b.customerId === userId ? "customer" : "cleaner";
  const revieweeId = reviewerRole === "customer" ? b.cleanerId : b.customerId;

  const ratings = [punctualityRating, professionalismRating, qualityRating, communicationRating, reliabilityRating].filter(Boolean);
  const overallRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 3;

  const id = randomUUID();
  const created = await db
    .insert(reviewsTable)
    .values({
      id,
      bookingId,
      reviewerId: userId,
      revieweeId,
      reviewerRole,
      punctualityRating,
      professionalismRating,
      qualityRating,
      communicationRating,
      reliabilityRating,
      overallRating,
      comment,
      wouldWorkAgain: wouldWorkAgain ?? true,
      isRevealed: false,
    })
    .returning();

  const existingReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.bookingId, bookingId));
  if (existingReviews.length >= 2) {
    await db.update(reviewsTable).set({ isRevealed: true }).where(eq(reviewsTable.bookingId, bookingId));
    await db.update(bookingsTable).set({ reviewStatus: "revealed" }).where(eq(bookingsTable.id, bookingId));
  } else {
    const newStatus = reviewerRole === "customer" ? "customer_submitted" : "cleaner_submitted";
    const revealAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.update(bookingsTable).set({ reviewStatus: newStatus, reviewRevealAt: revealAt }).where(eq(bookingsTable.id, bookingId));
  }

  return res.status(201).json({ ...created[0], isRevealed: existingReviews.length >= 2 });
});

router.get("/reviews/booking/:bookingId", async (req, res) => {
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(and(eq(reviewsTable.bookingId, req.params.bookingId), eq(reviewsTable.isRevealed, true)));

  const booking = await db.select().from(bookingsTable).where(eq(bookingsTable.id, req.params.bookingId)).limit(1);

  const customerReview = reviews.find((r) => r.reviewerRole === "customer") || null;
  const cleanerReview = reviews.find((r) => r.reviewerRole === "cleaner") || null;

  return res.json({
    bookingId: req.params.bookingId,
    customerReview,
    cleanerReview,
    areRevealed: reviews.length > 0,
    revealAt: booking[0]?.reviewRevealAt?.toISOString(),
  });
});

router.get("/reviews/cleaner/:cleanerId", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(and(eq(reviewsTable.revieweeId, req.params.cleanerId), eq(reviewsTable.isRevealed, true)))
    .limit(Number(limit))
    .offset(offset);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
    : 0;

  const wouldWorkAgainCount = reviews.filter((r) => r.wouldWorkAgain).length;
  const wouldWorkAgainPct = reviews.length > 0 ? (wouldWorkAgainCount / reviews.length) * 100 : 0;

  return res.json({ reviews, total: reviews.length, averageRating: avgRating, wouldWorkAgainPct });
});

export default router;
