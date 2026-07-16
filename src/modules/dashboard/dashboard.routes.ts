import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/auth";
import { loadUser } from "../../middleware/loadUser";
import { authorize } from "../../middleware/authorize";
import { getLiveDashboard } from "./dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/live",
  ...authenticate,
  loadUser,
  authorize(UserRole.PRIMARY_ORGANIZER, UserRole.SECONDARY_ORGANIZER),
  getLiveDashboard
);
