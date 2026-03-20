import { pgTable, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const couplesTable = pgTable("couples", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  pairedAt: timestamp("paired_at").defaultNow().notNull(),
});

export const insertCoupleSchema = createInsertSchema(couplesTable).omit({ id: true, pairedAt: true });
export type InsertCouple = z.infer<typeof insertCoupleSchema>;
export type Couple = typeof couplesTable.$inferSelect;
