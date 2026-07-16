import { NextFunction, Request, Response } from "express";
import { packageEngine } from "./package.engine";

export async function getAllPackages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const packages = await packageEngine.getAllPackages();
    res.status(200).json(packages);
  } catch (err) {
    next(err);
  }
}

export async function getPackageById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pkg = await packageEngine.getPackageById(req.params.id as string);
    res.status(200).json(pkg);
  } catch (err) {
    next(err);
  }
}

export async function getActivePackage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pkg = await packageEngine.getActivePackage();
    res.status(200).json(pkg);
  } catch (err) {
    next(err);
  }
}

export async function activatePackage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await packageEngine.activatePackage(req.params.id as string);
    res.status(200).json({ message: "Package activated." });
  } catch (err) {
    next(err);
  }
}

export async function markUnsold(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await packageEngine.markUnsold(req.params.id as string);
    res.status(200).json({ message: "Package marked as unsold." });
  } catch (err) {
    next(err);
  }
}
