import { Router } from "express";
import { db, usersTable, couplesTable, checkinsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, getTodayDate } from "../lib/auth.js";

const router = Router();

async function getPartnerAndCouple(userId: number) {
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!me || !me.coupleId) return null;

  const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, me.coupleId)).limit(1);
  if (!couple) return null;

  const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
  return { me, couple, partnerId };
}

router.get("/today", requireAuth, async (req, res) => {
  const info = await getPartnerAndCouple(req.session.userId!);
  if (!info) {
    res.status(404).json({ error: "Not paired" });
    return;
  }

  const today = getTodayDate();
  const todayCheckins = await db.select().from(checkinsTable)
    .where(and(eq(checkinsTable.coupleId, info.couple.id), eq(checkinsTable.date, today)));

  const myCheckin = todayCheckins.some(c => c.userId === req.session.userId);
  const partnerCheckin = todayCheckins.some(c => c.userId === info.partnerId);

  res.json({ myCheckin, partnerCheckin, date: today, bothDone: myCheckin && partnerCheckin });
});

router.post("/today", requireAuth, async (req, res) => {
  const info = await getPartnerAndCouple(req.session.userId!);
  if (!info) {
    res.status(404).json({ error: "Not paired" });
    return;
  }

  const today = getTodayDate();

  const existing = await db.select().from(checkinsTable)
    .where(and(eq(checkinsTable.userId, req.session.userId!), eq(checkinsTable.date, today)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(checkinsTable).values({
      userId: req.session.userId!,
      coupleId: info.couple.id,
      date: today,
    });
  }

  const todayCheckins = await db.select().from(checkinsTable)
    .where(and(eq(checkinsTable.coupleId, info.couple.id), eq(checkinsTable.date, today)));

  const myCheckin = todayCheckins.some(c => c.userId === req.session.userId);
  const partnerCheckin = todayCheckins.some(c => c.userId === info.partnerId);

  res.json({ myCheckin, partnerCheckin, date: today, bothDone: myCheckin && partnerCheckin });
});

router.get("/streak", requireAuth, async (req, res) => {
  const info = await getPartnerAndCouple(req.session.userId!);
  if (!info) {
    res.json({ currentStreak: 0, longestStreak: 0, lastBothCheckinDate: null });
    return;
  }

  const allCheckins = await db.select().from(checkinsTable)
    .where(eq(checkinsTable.coupleId, info.couple.id))
    .orderBy(desc(checkinsTable.date));

  const dateMap = new Map<string, Set<number>>();
  for (const c of allCheckins) {
    if (!dateMap.has(c.date)) dateMap.set(c.date, new Set());
    dateMap.get(c.date)!.add(c.userId);
  }

  const bothDates = Array.from(dateMap.entries())
    .filter(([, users]) => users.has(req.session.userId!) && users.has(info.partnerId))
    .map(([date]) => date)
    .sort()
    .reverse();

  let currentStreak = 0;
  let longestStreak = 0;
  let lastBothCheckinDate: string | null = bothDates[0] || null;

  if (bothDates.length > 0) {
    const today = getTodayDate();
    let streak = 0;
    let longest = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < bothDates.length; i++) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (bothDates.includes(dateStr)) {
        streak++;
        if (streak > longest) longest = streak;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterday = checkDate.toISOString().split("T")[0];
          if (bothDates[0] === yesterday) {
            streak = 0;
            checkDate = new Date(yesterday);
            for (const d of bothDates) {
              const expected = checkDate.toISOString().split("T")[0];
              if (d === expected) {
                streak++;
                if (streak > longest) longest = streak;
                checkDate.setDate(checkDate.getDate() - 1);
              } else {
                break;
              }
            }
            currentStreak = streak;
            break;
          }
          break;
        }
        break;
      }
      if (i === 0) currentStreak = streak;
    }

    for (const d of bothDates) {
      longestStreak = Math.max(longestStreak, 1);
    }

    let tempStreak = 1;
    for (let i = 1; i < bothDates.length; i++) {
      const curr = new Date(bothDates[i]);
      const prev = new Date(bothDates[i - 1]);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    currentStreak = Math.min(currentStreak, longestStreak);
  }

  res.json({ currentStreak, longestStreak, lastBothCheckinDate });
});

export default router;
