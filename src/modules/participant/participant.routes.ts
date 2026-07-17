import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/auth";
import { loadUser } from "../../middleware/loadUser";
import { authorize } from "../../middleware/authorize";
import { getTeamConsole, getDashboard } from "./participant.controller";

export const participantRouter = Router();

participantRouter.get(
  "/team-console",
  ...authenticate,
  loadUser,
  authorize(UserRole.PARTICIPANT),
  getTeamConsole
);

participantRouter.get(
  "/dashboard",
  ...authenticate,
  loadUser,
  authorize(UserRole.PARTICIPANT),
  getDashboard
);
