import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, cleanersTable, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/admin/users", async (req, res) => {
  const { page = 1 } = req.query;
  const offset = (Number(page) - 1) * 20;

  const users = await db.select().from(usersTable).limit(20).offset(offset);
  return res.json({ users, total: users.length });
});

router.post("/admin/users/:userId/suspend", async (req, res) => {
  const { reason } = req.body;
  const updated = await db
    .update(usersTable)
    .set({ isSuspended: true, suspensionReason: reason, updatedAt: new Date() })
    .where(eq(usersTable.id, req.params.userId))
    .returning();

  return res.json(updated[0]);
});

router.get("/admin/metrics", async (req, res) => {
  const [users, cleaners, bookings] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(cleanersTable),
    db.select().from(bookingsTable),
  ]);

  const activeBookings = bookings.filter((b) => ["pending", "accepted", "en_route", "in_progress"].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const disputedBookings = bookings.filter((b) => b.status === "disputed");
  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const verifiedCleaners = cleaners.filter((c) => c.isVerified);
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const newUsersThisWeek = users.filter((u) => new Date(u.createdAt) >= weekAgo);

  const avgTrustScore = users.length > 0
    ? users.reduce((sum, u) => sum + u.trustScore, 0) / users.length
    : 0;

  return res.json({
    totalUsers: users.length,
    totalCleaners: cleaners.length,
    totalBookings: bookings.length,
    activeBookings: activeBookings.length,
    completedBookings: completedBookings.length,
    disputedBookings: disputedBookings.length,
    totalRevenue,
    averageTrustScore: avgTrustScore,
    verifiedCleaners: verifiedCleaners.length,
    newUsersThisWeek: newUsersThisWeek.length,
  });
});

export default router;
