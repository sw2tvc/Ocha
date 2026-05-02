import { Router } from "express";
import { db } from "@workspace/db";
import { cleanersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

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
    lat: (c.locationLat || (Number(lat) + (Math.random() - 0.5) * 0.05)),
    lng: (c.locationLng || (Number(lng) + (Math.random() - 0.5) * 0.05)),
    radiusKm: c.serviceRadius || 5,
    cleanerCount: 1,
  }));

  return res.json({
    nearbyCount,
    availableNow,
    estimatedWaitMinutes,
    radiusKm: Number(radius),
    zones,
  });
});

export default router;
