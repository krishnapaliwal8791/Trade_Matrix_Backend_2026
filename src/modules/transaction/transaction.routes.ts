import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/auth";
import { loadUser } from "../../middleware/loadUser";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { transactionSchema } from "./transaction.validation";
import { recordSale } from "./transaction.controller";

export const transactionRouter = Router();

transactionRouter.post(
  "/",
  ...authenticate,
  loadUser,
  authorize(UserRole.PRIMARY_ORGANIZER, UserRole.SECONDARY_ORGANIZER),
  validate(transactionSchema),
  recordSale
);
