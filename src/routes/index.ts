import { Router } from "express";
import { healthRouter } from "./health";
import { authRouter } from "../modules/auth/auth.routes";
import { eventRouter } from "../modules/event/event.routes";
import { packageRouter } from "../modules/package/package.routes";
import { transactionRouter } from "../modules/transaction/transaction.routes";
import { announcementRouter } from "../modules/announcement/announcement.routes";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes";
import { teamRouter } from "../modules/team/team.routes";
import { participantRouter } from "../modules/participant/participant.routes";

export const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/event", eventRouter);
router.use("/packages", packageRouter);
router.use("/transactions", transactionRouter);
router.use("/announcements", announcementRouter);
router.use("/dashboard", dashboardRouter);
router.use("/teams", teamRouter);
router.use("/participant", participantRouter);
