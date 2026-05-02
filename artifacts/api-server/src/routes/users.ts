import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, verificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { UpdateProfileBody } from "@workspace/api-zod";

const router = Router();

const DEMO_USERS: Record<string, typeof usersTable.$inferInsert> = {
  "user-demo-1": {
    id: "user-demo-1",
    email: "sarah@example.com",
    fullName: "Sarah Mitchell",
    phone: "+44 7700 900123",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    role: "customer",
    isVerified: true,
    verificationBadge: "verified",
    trustScore: 87,
  },
  "user-cleaner-1": {
    id: "user-cleaner-1",
    email: "amara@example.com",
    fullName: "Amara Osei",
    phone: "+44 7700 900456",
    avatarUrl: "https://i.pravatar.cc/150?img=32",
    role: "cleaner",
    isVerified: true,
    verificationBadge: "trusted",
    trustScore: 96,
  },
};

async function upsertDemoUser(userId: string) {
  const seed = DEMO_USERS[userId];
  if (!seed) return null;
  await db
    .insert(usersTable)
    .values(seed)
    .onConflictDoNothing();
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return rows[0] ?? null;
}

router.get("/auth/me", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  let rows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!rows.length) {
    const user = await upsertDemoUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  }
  return res.json(rows[0]);
});

router.put("/auth/profile", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }
  const updated = await db
    .update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning();
  return res.json(updated[0]);
});

export default router;
