import { clerkMiddleware, getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";


export const authenticate = [
  clerkMiddleware(),
  (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);

    if (!auth.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    next();
  },
];
