import { createServer } from "http";
import app, { sessionMiddleware } from "./app.js";
import { initIO } from "./lib/io.js";
import { logger } from "./lib/logger.js";

const rawPort = process.env["PORT"] || "3001";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);
initIO(server, sessionMiddleware);

server.listen(port, () => {
  logger.info({ port }, "Server listening");
});
