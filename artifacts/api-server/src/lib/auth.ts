import { type Request, type Response, type NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}
