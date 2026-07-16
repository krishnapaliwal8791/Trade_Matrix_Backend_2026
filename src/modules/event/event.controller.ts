import { NextFunction, Request, Response } from "express";
import { eventEngine } from "./event.engine";

export async function getEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await eventEngine.getEvent();
    res.status(200).json({
      status: event.status,
      activePackageId: event.activePackageId,
    });
  } catch (err) {
    next(err);
  }
}

export async function startEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await eventEngine.startEvent();
    res.status(200).json({ message: "Event started." });
  } catch (err) {
    next(err);
  }
}

export async function pauseEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await eventEngine.pauseEvent();
    res.status(200).json({ message: "Event paused." });
  } catch (err) {
    next(err);
  }
}

export async function resumeEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await eventEngine.resumeEvent();
    res.status(200).json({ message: "Event resumed." });
  } catch (err) {
    next(err);
  }
}

export async function completeEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await eventEngine.completeEvent();
    res.status(200).json({ message: "Event completed." });
  } catch (err) {
    next(err);
  }
}
