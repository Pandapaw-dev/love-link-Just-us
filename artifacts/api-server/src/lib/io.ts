import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import type { RequestHandler } from "express";
import { db, usersTable, chatMessagesTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { logger } from "./logger.js";

let io: Server | undefined;

export function getIO(): Server | undefined {
  return io;
}

export function initIO(server: HttpServer, sessionMiddleware: RequestHandler) {
  io = new Server(server, {
    cors: { origin: true, credentials: true },
    path: "/socket.io",
  });

  io.engine.use(sessionMiddleware);

  io.on("connection", async (socket) => {
    const req = socket.request as any;
    const userId: number | undefined = req.session?.userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    const [user] = await db
      .select({ coupleId: usersTable.coupleId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user?.coupleId) {
      socket.disconnect();
      return;
    }

    const room = `couple:${user.coupleId}`;
    await socket.join(room);

    socket.data.userId = userId;
    socket.data.coupleId = user.coupleId;
    socket.data.room = room;

    logger.info({ userId, room }, "Socket connected");

    socket.on("typing_start", () => {
      socket.to(room).emit("partner_typing", { typing: true });
    });

    socket.on("typing_stop", () => {
      socket.to(room).emit("partner_typing", { typing: false });
    });

    socket.on("mark_seen", async () => {
      await db
        .update(chatMessagesTable)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(chatMessagesTable.coupleId, user.coupleId!),
            eq(chatMessagesTable.receiverId, userId),
            isNull(chatMessagesTable.readAt),
          ),
        );
      socket.to(room).emit("message_seen", { by: userId });
    });

    socket.on("disconnect", () => {
      logger.info({ userId }, "Socket disconnected");
    });
  });

  return io;
}
