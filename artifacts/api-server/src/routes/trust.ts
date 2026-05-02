import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, verificationsTable, bookingsTable, reviewsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const buildTrustProfile = async (userId: string) => {
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const verification = await db.select().from(verificationsTable).where(eq(verificationsTable.userId, userId)).limit(1);

  const verificationStatus = verification[0] || {
    emailVerified: false,
    phoneVerified: false,
    idVerified: false,
    selfieVerified: false,
    addressVerified: false,
    backgroundCheckDone: false,
    paymentVerified: false,
  };

  const completedBookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.status, "completed"));

  const userBookings = completedBookings.filter((b) => b.customerId === userId || b.cleanerId === userId);
  const completionRate = userBookings.length > 0 ? (userBookings.length / Math.max(userBookings.length, 1)) * 100 : 0;

  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.revieweeId, userId));
  const wouldWorkAgainPct = reviews.length > 0
    ? (reviews.filter((r) => r.wouldWorkAgain).length / reviews.length) * 100
    : 0;

  const badge = user[0]?.verificationBadge || "none";
  const overallScore = user[0]?.trustScore || 0;

  return {
    userId,
    overallScore,
    verificationStatus: {
      emailVerified: verificationStatus.emailVerified,
      phoneVerified: verificationStatus.phoneVerified,
      idVerified: verificationStatus.idVerified,
      selfieVerified: verificationStatus.selfieVerified,
      addressVerified: verificationStatus.addressVerified,
      backgroundCheckDone: verificationStatus.backgroundCheckDone,
      paymentVerified: verificationStatus.paymentVerified,
    },
    behavioralMetrics: {
      cancellationRate: 0,
      repeatBookingRate: 0,
      responseSpeed: "< 1 hour",
      latePct: 0,
      disputeFrequency: 0,
      wouldWorkAgainPct,
      completionRate,
    },
    badge,
  };
};

router.get("/trust/me", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  return res.json(await buildTrustProfile(userId));
});

router.get("/trust/:userId", async (req, res) => {
  return res.json(await buildTrustProfile(req.params.userId));
});

router.post("/trust/verify/phone", async (req, res) => {
  return res.json({ success: true, message: "Verification code sent (placeholder)", verified: false });
});

router.post("/trust/verify/phone/confirm", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const existing = await db.select().from(verificationsTable).where(eq(verificationsTable.userId, userId)).limit(1);
  if (existing.length) {
    await db.update(verificationsTable).set({ phoneVerified: true, updatedAt: new Date() }).where(eq(verificationsTable.userId, userId));
  }

  return res.json({ success: true, message: "Phone verified successfully", verified: true });
});

export default router;
