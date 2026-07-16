import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/auth";
import { loadUser } from "../../middleware/loadUser";
import { authorize } from "../../middleware/authorize";
import { getCurrentUser } from "./auth.controller";

export const authRouter = Router();

authRouter.get(
  "/me",
  ...authenticate,
  loadUser,
  authorize(
    UserRole.PRIMARY_ORGANIZER,
    UserRole.SECONDARY_ORGANIZER,
    UserRole.PARTICIPANT
  ),
  getCurrentUser
);
