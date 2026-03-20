import { Router } from "express";
import { db, usersTable, couplesTable, moodsTable, missYouTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, getTodayDate } from "../lib/auth.js";
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

router.post("/miss-you", requireAuth, async (req, res) => {
  const info = await getPartnerAndCouple(req.session.userId!);
  if (!info) {
    res.status(403).json({ error: "Not paired" });
    return;
  }

  await db.insert(missYouTable).values({
    senderId: req.session.userId!,
    receiverId: info.partnerId,
    coupleId: info.couple.id,
    seen: false,
  });

  res.json({ success: true, message: "Miss you sent!" });
});

router.post("/mood", requireAuth, async (req, res) => {
  const parsed = z.object({ mood: z.enum(["happy", "neutral", "sad"]) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid mood" });
    return;
  }

  const info = await getPartnerAndCouple(req.session.userId!);
  if (!info) {
    res.status(403).json({ error: "Not paired" });
    return;
  }

  const today = getTodayDate();
  const existing = await db.select().from(moodsTable)
    .where(and(eq(moodsTable.userId, req.session.userId!), eq(moodsTable.date, today)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(moodsTable)
      .set({ mood: parsed.data.mood })
      .where(and(eq(moodsTable.userId, req.session.userId!), eq(moodsTable.date, today)));
  } else {
    await db.insert(moodsTable).values({
      userId: req.session.userId!,
      coupleId: info.couple.id,
      mood: parsed.data.mood,
      date: today,
    });
  }

  res.json({ success: true, message: "Mood set" });
});

router.get("/status", requireAuth, async (req, res) => {
  const info = await getPartnerAndCouple(req.session.userId!);
  if (!info) {
    res.json({ partnerMissesYou: false, partnerMood: null, partnerMoodSetAt: null, myMood: null, missYouSentAt: null });
    return;
  }

  const today = getTodayDate();

  const unreadMissYou = await db.select().from(missYouTable)
    .where(and(eq(missYouTable.receiverId, req.session.userId!), eq(missYouTable.seen, false)))
    .orderBy(desc(missYouTable.sentAt))
    .limit(1);

  const partnerMood = await db.select().from(moodsTable)
    .where(and(eq(moodsTable.userId, info.partnerId), eq(moodsTable.date, today)))
    .limit(1);

  const myMood = await db.select().from(moodsTable)
    .where(and(eq(moodsTable.userId, req.session.userId!), eq(moodsTable.date, today)))
    .limit(1);

  if (unreadMissYou.length > 0) {
    await db.update(missYouTable).set({ seen: true }).where(eq(missYouTable.id, unreadMissYou[0].id));
  }

  res.json({
    partnerMissesYou: unreadMissYou.length > 0,
    partnerMood: partnerMood[0]?.mood || null,
    partnerMoodSetAt: partnerMood[0]?.createdAt?.toISOString() || null,
    myMood: myMood[0]?.mood || null,
    missYouSentAt: unreadMissYou[0]?.sentAt?.toISOString() || null,
  });
});

export default router;
