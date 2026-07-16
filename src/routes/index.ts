import { Router } from "express";
import { healthRouter } from "./health";
import { authRouter } from "../modules/auth/auth.routes";
import { eventRouter } from "../modules/event/event.routes";
import { packageRouter } from "../modules/package/package.routes";
import { transactionRouter } from "../modules/transaction/transaction.routes";
import { announcementRouter } from "../modules/announcement/announcement.routes";

export const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/event", eventRouter);
router.use("/packages", packageRouter);
router.use("/transactions", transactionRouter);
router.use("/announcements", announcementRouter);
