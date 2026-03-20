import { Router } from "express";
import { db, usersTable, couplesTable, messagesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, getTodayDate } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

async function getCoupleInfo(userId: number) {
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!me || !me.coupleId) return null;
  const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, me.coupleId)).limit(1);
  return couple ? { me, couple } : null;
}

router.get("/", requireAuth, async (req, res) => {
  const info = await getCoupleInfo(req.session.userId!);
  if (!info) {
    res.json({ messages: [], total: 0 });
    return;
  }

  const limit = Number(req.query.limit) || 30;
  const offset = Number(req.query.offset) || 0;

  const msgs = await db.select({
    id: messagesTable.id,
    senderId: messagesTable.senderId,
    text: messagesTable.text,
    sentAt: messagesTable.sentAt,
    displayName: usersTable.displayName,
  })
    .from(messagesTable)
    .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .where(eq(messagesTable.coupleId, info.couple.id))
    .orderBy(desc(messagesTable.sentAt))
    .limit(limit)
    .offset(offset);

  const total = msgs.length;

  res.json({
    messages: msgs.map(m => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.displayName || "Unknown",
      text: m.text,
      sentAt: m.sentAt.toISOString(),
      isFromMe: m.senderId === req.session.userId,
    })),
    total,
  });
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = z.object({ text: z.string().min(1).max(500) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const info = await getCoupleInfo(req.session.userId!);
  if (!info) {
    res.status(403).json({ error: "Not paired" });
    return;
  }

  const today = getTodayDate();
  const existing = await db.select().from(messagesTable)
    .where(and(eq(messagesTable.senderId, req.session.userId!), eq(messagesTable.date, today)))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "You already sent a message today" });
    return;
  }

  const [msg] = await db.insert(messagesTable).values({
    senderId: req.session.userId!,
    coupleId: info.couple.id,
    text: parsed.data.text,
    date: today,
  }).returning();

  res.status(201).json({
    id: msg.id,
    senderId: msg.senderId,
    senderName: info.me.displayName,
    text: msg.text,
    sentAt: msg.sentAt.toISOString(),
    isFromMe: true,
  });
});

export default router;
