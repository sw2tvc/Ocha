import { Router } from "express";
import { db } from "@workspace/db";
import { cleanersTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod/v4";

const router = Router();

router.get("/cleaners", async (req, res) => {
  const { serviceType, available, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = db
    .select({
      cleaner: cleanersTable,
      user: usersTable,
    })
    .from(cleanersTable)
    .leftJoin(usersTable, eq(cleanersTable.userId, usersTable.id))
    .$dynamic();

  const conditions = [];
  if (available === "true") {
    conditions.push(eq(cleanersTable.isAvailable, true));
  }

  const cleaners = await query.limit(Number(limit)).offset(offset);

  const result = cleaners.map((row) => ({
    id: row.cleaner.id,
    userId: row.cleaner.userId,
    fullName: row.user?.fullName || "Unknown",
    avatarUrl: row.user?.avatarUrl,
    bio: row.cleaner.bio,
    serviceTypes: row.cleaner.serviceTypes,
    hourlyRate: row.cleaner.hourlyRate,
    isAvailable: row.cleaner.isAvailable,
    isVerified: row.cleaner.isVerified,
    verificationBadge: row.cleaner.verificationBadge,
    trustScore: row.cleaner.trustScore,
    repeatBookingRate: row.cleaner.repeatBookingRate,
    completionRate: row.cleaner.completionRate,
    responseTime: row.cleaner.responseTime,
    totalBookings: row.cleaner.totalBookings,
    averageRating: row.cleaner.averageRating,
    reviewCount: row.cleaner.reviewCount,
    wouldWorkAgainPct: row.cleaner.wouldWorkAgainPct,
    cancellationRate: row.cleaner.cancellationRate,
    serviceRadius: row.cleaner.serviceRadius,
    location: row.cleaner.locationLat && row.cleaner.locationLng
      ? { lat: row.cleaner.locationLat, lng: row.cleaner.locationLng }
      : undefined,
    distanceKm: Math.random() * 5 + 0.5,
    eta: `${Math.floor(Math.random() * 30 + 10)} min`,
  }));

  return res.json({ cleaners: result, total: result.length, nearbyCount: result.filter((c) => c.isAvailable).length });
});

router.get("/cleaners/me/profile", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const cleaner = await db
    .select({ cleaner: cleanersTable, user: usersTable })
    .from(cleanersTable)
    .leftJoin(usersTable, eq(cleanersTable.userId, usersTable.id))
    .where(eq(cleanersTable.userId, userId))
    .limit(1);

  if (!cleaner.length) return res.status(404).json({ error: "Cleaner profile not found" });

  const row = cleaner[0];
  return res.json({
    id: row.cleaner.id,
    userId: row.cleaner.userId,
    fullName: row.user?.fullName || "Unknown",
    avatarUrl: row.user?.avatarUrl,
    bio: row.cleaner.bio,
    serviceTypes: row.cleaner.serviceTypes,
    hourlyRate: row.cleaner.hourlyRate,
    isAvailable: row.cleaner.isAvailable,
    isVerified: row.cleaner.isVerified,
    verificationBadge: row.cleaner.verificationBadge,
    trustScore: row.cleaner.trustScore,
    repeatBookingRate: row.cleaner.repeatBookingRate,
    completionRate: row.cleaner.completionRate,
    totalBookings: row.cleaner.totalBookings,
    averageRating: row.cleaner.averageRating,
    reviewCount: row.cleaner.reviewCount,
    wouldWorkAgainPct: row.cleaner.wouldWorkAgainPct,
    cancellationRate: row.cleaner.cancellationRate,
    serviceRadius: row.cleaner.serviceRadius,
  });
});

router.put("/cleaners/me/profile", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { bio, serviceTypes, hourlyRate, serviceRadius } = req.body;
  const updated = await db
    .update(cleanersTable)
    .set({ bio, serviceTypes, hourlyRate, serviceRadius, updatedAt: new Date() })
    .where(eq(cleanersTable.userId, userId))
    .returning();

  return res.json(updated[0]);
});

router.post("/cleaners/me/toggle-availability", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { isAvailable } = req.body;
  const updated = await db
    .update(cleanersTable)
    .set({ isAvailable, availabilityLastToggled: new Date(), updatedAt: new Date() })
    .where(eq(cleanersTable.userId, userId))
    .returning();

  return res.json({ isAvailable: updated[0].isAvailable, updatedAt: updated[0].updatedAt });
});

router.get("/cleaners/me/earnings", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { period = "month" } = req.query;

  const breakdown = period === "week"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
        label: day,
        amount: Math.floor(Math.random() * 200),
        jobs: Math.floor(Math.random() * 3),
      }))
    : ["Week 1", "Week 2", "Week 3", "Week 4"].map((week) => ({
        label: week,
        amount: Math.floor(Math.random() * 800),
        jobs: Math.floor(Math.random() * 12),
      }));

  const totalEarned = breakdown.reduce((sum, p) => sum + p.amount, 0);
  const completedJobs = breakdown.reduce((sum, p) => sum + p.jobs, 0);

  return res.json({
    period,
    totalEarned,
    completedJobs,
    pendingPayout: Math.floor(Math.random() * 300),
    averagePerJob: completedJobs > 0 ? Math.round(totalEarned / completedJobs) : 0,
    breakdown,
  });
});

router.get("/cleaners/:cleanerId/availability", async (req, res) => {
  const { cleanerId } = req.params;
  const slots = Array.from({ length: 8 }, (_, i) => ({
    startTime: `${8 + i}:00`,
    endTime: `${9 + i}:00`,
    available: Math.random() > 0.3,
  }));
  return res.json({ cleanerId, date: req.query.date || new Date().toISOString().split("T")[0], slots });
});

router.get("/cleaners/:cleanerId", async (req, res) => {
  const { cleanerId } = req.params;
  const cleaner = await db
    .select({ cleaner: cleanersTable, user: usersTable })
    .from(cleanersTable)
    .leftJoin(usersTable, eq(cleanersTable.userId, usersTable.id))
    .where(eq(cleanersTable.id, cleanerId))
    .limit(1);

  if (!cleaner.length) return res.status(404).json({ error: "Cleaner not found" });

  const row = cleaner[0];
  return res.json({
    id: row.cleaner.id,
    userId: row.cleaner.userId,
    fullName: row.user?.fullName || "Unknown",
    avatarUrl: row.user?.avatarUrl,
    bio: row.cleaner.bio,
    serviceTypes: row.cleaner.serviceTypes,
    hourlyRate: row.cleaner.hourlyRate,
    isAvailable: row.cleaner.isAvailable,
    isVerified: row.cleaner.isVerified,
    verificationBadge: row.cleaner.verificationBadge,
    trustScore: row.cleaner.trustScore,
    repeatBookingRate: row.cleaner.repeatBookingRate,
    completionRate: row.cleaner.completionRate,
    totalBookings: row.cleaner.totalBookings,
    averageRating: row.cleaner.averageRating,
    reviewCount: row.cleaner.reviewCount,
    wouldWorkAgainPct: row.cleaner.wouldWorkAgainPct,
    cancellationRate: row.cleaner.cancellationRate,
    serviceRadius: row.cleaner.serviceRadius,
  });
});

export default router;
