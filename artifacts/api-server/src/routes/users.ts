import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  username: z.string().min(2).max(50),
  displayName: z.string().min(1).max(100),
  password: z.string().min(4),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const updateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { username, displayName, password } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, displayName, passwordHash }).returning();

  req.session.userId = user.id;
  res.status(201).json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    reminderTime: user.reminderTime,
    isPaired: !!user.coupleId,
  });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { username, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = user.id;
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    reminderTime: user.reminderTime,
    isPaired: !!user.coupleId,
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    reminderTime: user.reminderTime,
    isPaired: !!user.coupleId,
  });
});

router.patch("/me", requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const updates: Record<string, string> = {};
  if (parsed.data.displayName) updates.displayName = parsed.data.displayName;
  if (parsed.data.reminderTime !== undefined) updates.reminderTime = parsed.data.reminderTime;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.session.userId!)).returning();
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    reminderTime: user.reminderTime,
    isPaired: !!user.coupleId,
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

export default router;
