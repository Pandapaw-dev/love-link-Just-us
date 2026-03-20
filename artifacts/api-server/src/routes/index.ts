import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import usersRouter from "./users.js";
import couplesRouter from "./couples.js";
import checkinsRouter from "./checkins.js";
import messagesRouter from "./messages.js";
import notificationsRouter from "./notifications.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/couples", couplesRouter);
router.use("/checkins", checkinsRouter);
router.use("/messages", messagesRouter);
router.use("/notifications", notificationsRouter);

export default router;
