import { Router } from "express";
import { db, usersTable, couplesTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

function generateCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

router.post("/generate-code", requireAuth, async (req, res) => {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.update(usersTable)
    .set({ pairingCode: code, pairingCodeExpiresAt: expiresAt })
    .where(eq(usersTable.id, req.session.userId!));

  res.json({ code, expiresAt: expiresAt.toISOString() });
});

router.post("/pair", requireAuth, async (req, res) => {
  const parsed = z.object({ code: z.string() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const me = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!me[0]) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (me[0].coupleId) {
    res.status(400).json({ error: "Already paired" });
    return;
  }

  const partner = await db.select().from(usersTable).where(eq(usersTable.pairingCode, parsed.data.code)).limit(1);
  if (!partner[0]) {
    res.status(400).json({ error: "Invalid pairing code" });
    return;
  }

  if (partner[0].id === req.session.userId) {
    res.status(400).json({ error: "Cannot pair with yourself" });
    return;
  }

  if (partner[0].pairingCodeExpiresAt && partner[0].pairingCodeExpiresAt < new Date()) {
    res.status(400).json({ error: "Pairing code has expired" });
    return;
  }

  if (partner[0].coupleId) {
    res.status(400).json({ error: "Partner is already paired" });
    return;
  }

  const [couple] = await db.insert(couplesTable).values({
    user1Id: partner[0].id,
    user2Id: req.session.userId!,
  }).returning();

  await db.update(usersTable).set({ coupleId: couple.id, pairingCode: null, pairingCodeExpiresAt: null }).where(eq(usersTable.id, req.session.userId!));
  await db.update(usersTable).set({ coupleId: couple.id, pairingCode: null, pairingCodeExpiresAt: null }).where(eq(usersTable.id, partner[0].id));

  res.json({
    id: couple.id,
    partnerId: partner[0].id,
    partnerName: partner[0].displayName,
    partnerUsername: partner[0].username,
    pairedAt: couple.pairedAt.toISOString(),
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!me || !me.coupleId) {
    res.status(404).json({ error: "Not paired yet" });
    return;
  }

  const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, me.coupleId)).limit(1);
  if (!couple) {
    res.status(404).json({ error: "Couple not found" });
    return;
  }

  const partnerId = couple.user1Id === req.session.userId ? couple.user2Id : couple.user1Id;
  const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId)).limit(1);

  res.json({
    id: couple.id,
    partnerId: partner.id,
    partnerName: partner.displayName,
    partnerUsername: partner.username,
    pairedAt: couple.pairedAt.toISOString(),
  });
});

export default router;
