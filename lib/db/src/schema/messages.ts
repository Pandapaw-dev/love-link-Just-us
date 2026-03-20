import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  coupleId: integer("couple_id").notNull(),
  text: text("text").notNull(),
  date: text("date").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, sentAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
