import { Router } from "express";
import { db } from "@workspace/db";
import { propertiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

router.get("/properties", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const properties = await db
    .select()
    .from(propertiesTable)
    .where(eq(propertiesTable.ownerId, userId));

  return res.json({ properties, total: properties.length });
});

router.post("/properties", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = randomUUID();
  const { name, propertyType, addressLine1, city, postcode, accessNotes, parkingInfo, hasLift, petsInfo, cleaningFrequency, bedroomCount, bathroomCount, sqft } = req.body;

  const created = await db
    .insert(propertiesTable)
    .values({
      id,
      ownerId: userId,
      name,
      propertyType: propertyType || "apartment",
      addressLine1,
      city,
      postcode,
      accessNotes,
      parkingInfo,
      hasLift: hasLift || false,
      petsInfo,
      cleaningFrequency: cleaningFrequency || "on_demand",
      bedroomCount,
      bathroomCount,
      sqft,
    })
    .returning();

  return res.status(201).json(created[0]);
});

router.get("/properties/:propertyId", async (req, res) => {
  const property = await db
    .select()
    .from(propertiesTable)
    .where(eq(propertiesTable.id, req.params.propertyId))
    .limit(1);

  if (!property.length) return res.status(404).json({ error: "Property not found" });
  return res.json(property[0]);
});

router.put("/properties/:propertyId", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { name, accessNotes, parkingInfo, hasLift, petsInfo, cleaningFrequency, preferredCleanerId, photoUrl } = req.body;

  const updated = await db
    .update(propertiesTable)
    .set({ name, accessNotes, parkingInfo, hasLift, petsInfo, cleaningFrequency, preferredCleanerId, photoUrl, updatedAt: new Date() })
    .where(eq(propertiesTable.id, req.params.propertyId))
    .returning();

  return res.json(updated[0]);
});

router.delete("/properties/:propertyId", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  await db.delete(propertiesTable).where(eq(propertiesTable.id, req.params.propertyId));
  return res.status(204).send();
});

router.get("/properties/:propertyId/qr-code", async (req, res) => {
  const { propertyId } = req.params;
  const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "http://localhost";
  const deepLink = `${baseUrl}/book?propertyId=${propertyId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(deepLink)}`;
  return res.json({ qrCodeUrl, deepLink, propertyId });
});

export default router;
