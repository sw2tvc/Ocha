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

  const rawPending = allBookings.filter((b) => b.status === "pending").slice(0, 10);

  /* Hydrate pending requests with customer + property info */
  const pendingRequests = await Promise.all(
    rawPending.map(async (b) => {
      const [customerRow, propertyRow] = await Promise.all([
        db.select({ fullName: usersTable.fullName, avatarUrl: usersTable.avatarUrl })
          .from(usersTable).where(eq(usersTable.id, b.customerId)).limit(1),
        db.select({ name: propertiesTable.name, addressLine1: propertiesTable.addressLine1, city: propertiesTable.city })
          .from(propertiesTable).where(eq(propertiesTable.id, b.propertyId)).limit(1),
      ]);
      return {
        ...b,
        customer: customerRow[0] || null,
        property: propertyRow[0] || null,
      };
    })
  );

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

/* ── Cleaner earnings breakdown ─────────────────── */
router.get("/dashboard/cleaner/earnings", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const cleaner = await db
    .select()
    .from(cleanersTable)
    .where(eq(cleanersTable.userId, userId))
    .limit(1);

  const cleanerId = cleaner[0]?.id;
  if (!cleanerId) return res.json({ weekly: [], monthly: [], recentJobs: [], summary: {} });

  const now = new Date();
  const twelveWeeksAgo = new Date(now.getTime() - 84 * 86400000);

  const completed = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.cleanerId, cleanerId), eq(bookingsTable.status, "completed")));

  /* ── Weekly buckets (last 12 weeks) ── */
  const weekly: { week: string; earnings: number; jobs: number }[] = [];
  for (let w = 11; w >= 0; w--) {
    const wStart = new Date(now.getTime() - (w + 1) * 7 * 86400000);
    const wEnd   = new Date(now.getTime() - w * 7 * 86400000);
    const label  = wStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const jobs   = completed.filter((b) => {
      const d = new Date(b.scheduledAt);
      return d >= wStart && d < wEnd;
    });
    weekly.push({ week: label, earnings: jobs.reduce((s, b) => s + b.totalPrice, 0), jobs: jobs.length });
  }

  /* ── Monthly buckets (last 6 months) ── */
  const monthly: { month: string; earnings: number; jobs: number }[] = [];
  for (let m = 5; m >= 0; m--) {
    const mDate  = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const mEnd   = new Date(now.getFullYear(), now.getMonth() - m + 1, 1);
    const label  = mDate.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    const jobs   = completed.filter((b) => {
      const d = new Date(b.scheduledAt);
      return d >= mDate && d < mEnd;
    });
    monthly.push({ month: label, earnings: jobs.reduce((s, b) => s + b.totalPrice, 0), jobs: jobs.length });
  }

  /* ── Recent jobs (last 20 completed, hydrated) ── */
  const recent = completed
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 20);

  const recentJobs = await Promise.all(
    recent.map(async (b) => {
      const propRow = await db
        .select({ name: propertiesTable.name })
        .from(propertiesTable)
        .where(eq(propertiesTable.id, b.propertyId))
        .limit(1);
      return { ...b, propertyName: propRow[0]?.name || "Property" };
    })
  );

  /* ── Summary stats ── */
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const thisYear  = completed.filter((b) => new Date(b.scheduledAt) >= yearStart);
  const allEarnings = completed.map((b) => b.totalPrice);
  const weeklyTotals = weekly.map((w) => w.earnings);

  const summary = {
    totalJobs:       completed.length,
    totalEarnings:   completed.reduce((s, b) => s + b.totalPrice, 0),
    thisYearEarnings: thisYear.reduce((s, b) => s + b.totalPrice, 0),
    avgPerJob:       completed.length ? Math.round(completed.reduce((s, b) => s + b.totalPrice, 0) / completed.length) : 0,
    bestWeek:        Math.max(0, ...weeklyTotals),
    avgWeekly:       weekly.length ? Math.round(weekly.reduce((s, w) => s + w.earnings, 0) / weekly.length) : 0,
  };

  return res.json({ weekly, monthly, recentJobs, summary });
});

export default router;
