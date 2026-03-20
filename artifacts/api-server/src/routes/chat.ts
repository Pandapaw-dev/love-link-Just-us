import { Router } from "express";
import { db, usersTable, couplesTable, chatMessagesTable } from "@workspace/db";
import { eq, and, gt, asc, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

async function getPartnerAndCouple(userId: number) {
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!me || !me.coupleId) return null;
  const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, me.coupleId)).limit(1);
  if (!couple) return null;
  const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
  return { me, couple, partnerId };
}

router.get("/", requireAuth, async (req, res) => {
  const info = await getPartnerAndCouple(req.session.userId!);
  if (!info) {
    res.json({ messages: [] });
    return;
  }

  const since = req.query.since ? Number(req.query.since) : undefined;
  const limit = Number(req.query.limit) || 50;

  let query = db.select({
    id: chatMessagesTable.id,
    senderId: chatMessagesTable.senderId,
    text: chatMessagesTable.text,
    sentAt: chatMessagesTable.sentAt,
    senderName: usersTable.displayName,
  })
    .from(chatMessagesTable)
    .leftJoin(usersTable, eq(chatMessagesTable.senderId, usersTable.id))
    .where(
      since !== undefined
        ? and(eq(chatMessagesTable.coupleId, info.couple.id), gt(chatMessagesTable.id, since))
        : eq(chatMessagesTable.coupleId, info.couple.id)
    )
    .orderBy(asc(chatMessagesTable.sentAt))
    .limit(limit);

  const msgs = await query;

  res.json({
    messages: msgs.map(m => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName || "Unknown",
      text: m.text,
      sentAt: m.sentAt.toISOString(),
      isFromMe: m.senderId === req.session.userId,
    })),
  });
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = z.object({ text: z.string().min(1).max(1000) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const info = await getPartnerAndCouple(req.session.userId!);
  if (!info) {
    res.status(403).json({ error: "Not paired" });
    return;
  }

  const [msg] = await db.insert(chatMessagesTable).values({
    senderId: req.session.userId!,
    receiverId: info.partnerId,
    coupleId: info.couple.id,
    text: parsed.data.text,
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
