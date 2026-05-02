import { Router } from "express";
import { db } from "@workspace/db";
import { cleanersTable, cleanerAvailabilityTable, bookingsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";

const router = Router();

/* ── Nearby cleaners ─────────────────────────────── */
router.get("/availability/nearby", async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;
  const availableCleaners = await db
    .select()
    .from(cleanersTable)
    .where(eq(cleanersTable.isAvailable, true));

  const nearbyCount = availableCleaners.length;
  const availableNow = availableCleaners.length;
  const estimatedWaitMinutes = nearbyCount > 0 ? Math.floor(Math.random() * 25 + 5) : 60;
  const zones = availableCleaners.slice(0, 5).map((c) => ({
    lat: c.locationLat || (Number(lat) + (Math.random() - 0.5) * 0.05),
    lng: c.locationLng || (Number(lng) + (Math.random() - 0.5) * 0.05),
    radiusKm: c.serviceRadius || 5,
    cleanerCount: 1,
  }));

  return res.json({ nearbyCount, availableNow, estimatedWaitMinutes, radiusKm: Number(radius), zones });
});

/* ── Cleaner calendar (GET) ──────────────────────── */
/*  GET /cleaners/:cleanerId/calendar?month=YYYY-MM  */
router.get("/cleaners/:cleanerId/calendar", async (req, res) => {
  const { cleanerId } = req.params;
  const { month } = req.query; /* e.g. "2026-05" */

  const now = new Date();
  const targetMonth = typeof month === "string" ? month : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [yr, mo] = targetMonth.split("-").map(Number);

  const firstDay = `${targetMonth}-01`;
  const lastDay = `${targetMonth}-${String(new Date(yr, mo, 0).getDate()).padStart(2, "0")}`;

  /* Fetch manually blocked days */
  const blocked = await db
    .select()
    .from(cleanerAvailabilityTable)
    .where(
      and(
        eq(cleanerAvailabilityTable.cleanerId, cleanerId),
        gte(cleanerAvailabilityTable.date, firstDay),
        lte(cleanerAvailabilityTable.date, lastDay),
        eq(cleanerAvailabilityTable.isBlocked, true)
      )
    );

  /* Fetch days with active bookings */
  const booked = await db
    .select({ scheduledAt: bookingsTable.scheduledAt })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.cleanerId, cleanerId),
        gte(bookingsTable.scheduledAt, new Date(`${firstDay}T00:00:00Z`)),
        lte(bookingsTable.scheduledAt, new Date(`${lastDay}T23:59:59Z`))
      )
    );

  const blockedDates = new Set(blocked.map((b) => b.date));
  const blockedReasons = Object.fromEntries(blocked.map((b) => [b.date, b.reason || "blocked"]));
  const bookedDates = new Set(
    booked.map((b) => {
      const d = new Date(b.scheduledAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })
  );

  /* Generate day-by-day calendar */
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const date = `${targetMonth}-${day}`;
    const isPast = date < `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    let status: "available" | "blocked" | "booked" | "past" = "available";
    if (isPast) status = "past";
    else if (bookedDates.has(date)) status = "booked";
    else if (blockedDates.has(date)) status = "blocked";
    return { date, status, reason: blockedReasons[date] };
  });

  /* Next available date */
  const nextAvailable = days.find((d) => d.status === "available")?.date;

  return res.json({ cleanerId, month: targetMonth, days, nextAvailable });
});

/* ── Toggle a day (POST) ─────────────────────────── */
/*  POST /cleaners/:cleanerId/calendar/toggle  */
router.post("/cleaners/:cleanerId/calendar/toggle", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { cleanerId } = req.params;

  /* Verify the user owns this cleaner profile */
  const [cleaner] = await db
    .select({ userId: cleanersTable.userId })
    .from(cleanersTable)
    .where(eq(cleanersTable.id, cleanerId))
    .limit(1);

  if (!cleaner) return res.status(404).json({ error: "Cleaner not found" });
  if (cleaner.userId !== userId) return res.status(403).json({ error: "Not your profile" });

  const schema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    isBlocked: z.boolean(),
    reason: z.enum(["holiday", "personal", "fully_booked", "other"]).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { date, isBlocked, reason } = parsed.data;

  /* Upsert */
  const existingRows = await db
    .select()
    .from(cleanerAvailabilityTable)
    .where(
      and(
        eq(cleanerAvailabilityTable.cleanerId, cleanerId),
        eq(cleanerAvailabilityTable.date, date)
      )
    )
    .limit(1);

  if (existingRows.length > 0) {
    await db
      .update(cleanerAvailabilityTable)
      .set({ isBlocked, reason: reason || null, updatedAt: new Date() })
      .where(
        and(
          eq(cleanerAvailabilityTable.cleanerId, cleanerId),
          eq(cleanerAvailabilityTable.date, date)
        )
      );
  } else {
    await db.insert(cleanerAvailabilityTable).values({
      id: `avail-${cleanerId}-${date}`,
      cleanerId,
      date,
      isBlocked,
      reason: reason || null,
    });
  }

  return res.json({ date, isBlocked, reason });
});

export default router;
