import { NextFunction, Request, Response } from "express";
import { dashboardEngine } from "./dashboard.engine";

export async function getLiveDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dashboard = await dashboardEngine.getLiveDashboard();
    res.status(200).json(dashboard);
  } catch (err) {
    next(err);
  }
}
