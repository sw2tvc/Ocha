import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, cleanersTable, propertiesTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/dashboard/customer", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const allBookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.customerId, userId))
    .orderBy(bookingsTable.scheduledAt);

  const now = new Date();
  const upcomingBookings = allBookings.filter((b) =>
    ["pending", "accepted", "en_route", "in_progress"].includes(b.status) && new Date(b.scheduledAt) >= now
  ).slice(0, 5);

  const recentBookings = allBookings.filter((b) => b.status === "completed").slice(-5).reverse();

  const properties = await db
    .select()
    .from(propertiesTable)
    .where(eq(propertiesTable.ownerId, userId))
    .limit(5);

  const pendingReviews = allBookings.filter((b) =>
    b.status === "completed" && ["pending", "customer_submitted"].includes(b.reviewStatus)
  ).length;

  const availableCleaners = await db
    .select()
    .from(cleanersTable)
    .where(eq(cleanersTable.isAvailable, true));

  return res.json({
    upcomingBookings,
    recentBookings,
    savedCleaners: [],
    pendingReviews,
    totalBookings: allBookings.length,
    properties,
    nearbyCount: availableCleaners.length,
  });
});

router.get("/dashboard/cleaner", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const cleaner = await db
    .select()
    .from(cleanersTable)
    .where(eq(cleanersTable.userId, userId))
    .limit(1);

  const cleanerId = cleaner[0]?.id;
  if (!cleanerId) {
    return res.json({
      isAvailable: false,
      todayBookings: [],
      upcomingBookings: [],
      pendingRequests: [],
      thisWeekEarnings: 0,
      thisMonthEarnings: 0,
      completedThisMonth: 0,
      trustScore: 0,
      averageRating: 0,
      pendingReviews: 0,
    });
  }

  const allBookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.cleanerId, cleanerId));

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const weekStart = new Date(now.getTime() - 7 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayBookings = allBookings.filter((b) => {
    const d = new Date(b.scheduledAt);
    return d >= todayStart && d < todayEnd;
  });

  const upcomingBookings = allBookings.filter((b) =>
    ["accepted", "en_route"].includes(b.status) && new Date(b.scheduledAt) > now
  ).slice(0, 5);

  const pendingRequests = allBookings.filter((b) => b.status === "pending").slice(0, 5);

  const weeklyBookings = allBookings.filter((b) => b.status === "completed" && new Date(b.scheduledAt) >= weekStart);
  const monthlyBookings = allBookings.filter((b) => b.status === "completed" && new Date(b.scheduledAt) >= monthStart);

  const thisWeekEarnings = weeklyBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const thisMonthEarnings = monthlyBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingReviews = allBookings.filter((b) =>
    b.status === "completed" && ["pending", "cleaner_submitted"].includes(b.reviewStatus)
  ).length;

  return res.json({
    isAvailable: cleaner[0].isAvailable,
    todayBookings,
    upcomingBookings,
    pendingRequests,
    thisWeekEarnings,
    thisMonthEarnings,
    completedThisMonth: monthlyBookings.length,
    trustScore: cleaner[0].trustScore,
    averageRating: cleaner[0].averageRating,
    pendingReviews,
  });
});

export default router;
