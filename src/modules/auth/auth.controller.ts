import { Request, Response } from "express";

export function getCurrentUser(req: Request, res: Response): void {
  res.status(200).json({ user: req.user });
}
