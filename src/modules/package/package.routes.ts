import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/auth";
import { loadUser } from "../../middleware/loadUser";
import { authorize } from "../../middleware/authorize";
import {
  getAllPackages,
  getPackageById,
  getActivePackage,
  activatePackage,
  markUnsold,
} from "./package.controller";

export const packageRouter = Router();

packageRouter.get(
  "/",
  ...authenticate,
  loadUser,
  authorize(
    UserRole.PRIMARY_ORGANIZER,
    UserRole.SECONDARY_ORGANIZER,
    UserRole.PARTICIPANT
  ),
  getAllPackages
);

// /active must be registered before /:id to prevent "active" being captured as a param
packageRouter.get(
  "/active",
  ...authenticate,
  loadUser,
  authorize(
    UserRole.PRIMARY_ORGANIZER,
    UserRole.SECONDARY_ORGANIZER,
    UserRole.PARTICIPANT
  ),
  getActivePackage
);

packageRouter.get(
  "/:id",
  ...authenticate,
  loadUser,
  authorize(
    UserRole.PRIMARY_ORGANIZER,
    UserRole.SECONDARY_ORGANIZER,
    UserRole.PARTICIPANT
  ),
  getPackageById
);

packageRouter.post(
  "/:id/activate",
  ...authenticate,
  loadUser,
  authorize(UserRole.PRIMARY_ORGANIZER, UserRole.SECONDARY_ORGANIZER),
  activatePackage
);

packageRouter.post(
  "/:id/unsold",
  ...authenticate,
  loadUser,
  authorize(UserRole.PRIMARY_ORGANIZER, UserRole.SECONDARY_ORGANIZER),
  markUnsold
);
