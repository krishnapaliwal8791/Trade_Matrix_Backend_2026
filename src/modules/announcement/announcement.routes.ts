import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/auth";
import { loadUser } from "../../middleware/loadUser";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { announcementSchema } from "./announcement.validation";
import { getAnnouncements, createAnnouncement } from "./announcement.controller";

export const announcementRouter = Router();

announcementRouter.get(
  "/",
  ...authenticate,
  loadUser,
  authorize(
    UserRole.PRIMARY_ORGANIZER,
    UserRole.SECONDARY_ORGANIZER,
    UserRole.PARTICIPANT
  ),
  getAnnouncements
);

announcementRouter.post(
  "/",
  ...authenticate,
  loadUser,
  authorize(UserRole.PRIMARY_ORGANIZER, UserRole.SECONDARY_ORGANIZER),
  validate(announcementSchema),
  createAnnouncement
);
