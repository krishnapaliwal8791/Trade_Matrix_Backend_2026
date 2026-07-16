import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/auth";
import { loadUser } from "../../middleware/loadUser";
import { authorize } from "../../middleware/authorize";
import {
  getEvent,
  startEvent,
  pauseEvent,
  resumeEvent,
  completeEvent,
} from "./event.controller";

export const eventRouter = Router();

eventRouter.get(
  "/",
  ...authenticate,
  loadUser,
  authorize(
    UserRole.PRIMARY_ORGANIZER,
    UserRole.SECONDARY_ORGANIZER,
    UserRole.PARTICIPANT
  ),
  getEvent
);

eventRouter.post(
  "/start",
  ...authenticate,
  loadUser,
  authorize(UserRole.PRIMARY_ORGANIZER, UserRole.SECONDARY_ORGANIZER),
  startEvent
);

eventRouter.post(
  "/pause",
  ...authenticate,
  loadUser,
  authorize(UserRole.PRIMARY_ORGANIZER, UserRole.SECONDARY_ORGANIZER),
  pauseEvent
);

eventRouter.post(
  "/resume",
  ...authenticate,
  loadUser,
  authorize(UserRole.PRIMARY_ORGANIZER, UserRole.SECONDARY_ORGANIZER),
  resumeEvent
);

eventRouter.post(
  "/complete",
  ...authenticate,
  loadUser,
  authorize(UserRole.PRIMARY_ORGANIZER, UserRole.SECONDARY_ORGANIZER),
  completeEvent
);
