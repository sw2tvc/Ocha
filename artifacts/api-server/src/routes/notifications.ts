import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

router.get("/notifications", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { unreadOnly, page = 1 } = req.query;
  const offset = (Number(page) - 1) * 20;

  const conditions = [eq(notificationsTable.userId, userId)];
  if (unreadOnly === "true") {
    conditions.push(eq(notificationsTable.isRead, false));
  }

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(and(...conditions))
    .limit(20)
    .offset(offset)
    .orderBy(notificationsTable.createdAt);

  const unreadCount = await db
    .select()
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));

  return res.json({ notifications, total: notifications.length, unreadCount: unreadCount.length });
});

router.put("/notifications/:notificationId/read", async (req, res) => {
  const updated = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, req.params.notificationId))
    .returning();

  return res.json(updated[0]);
});

router.put("/notifications/read-all", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));

  return res.json({ success: true, message: "All notifications marked as read" });
});

export default router;
