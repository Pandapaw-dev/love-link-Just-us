import { pgTable, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const missYouTable = pgTable("miss_you", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  coupleId: integer("couple_id").notNull(),
  seen: boolean("seen").default(false).notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const insertMissYouSchema = createInsertSchema(missYouTable).omit({ id: true, sentAt: true });
export type InsertMissYou = z.infer<typeof insertMissYouSchema>;
export type MissYou = typeof missYouTable.$inferSelect;
