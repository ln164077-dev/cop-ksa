import type { Express, Request, Response } from "express";
import { getAdminFromRequest, loginAdmin, logoutAdmin, provisionInitialAdmin } from "./admin-auth";
import { syncFinishedMatches } from "./db";

export function registerAdminRoutes(app: Express) {
  app.post(["/api/admin/login", "/admin/login"], async (req: Request, res: Response) => {
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) return res.status(400).json({ message: "البريد وكلمة المرور مطلوبان" });
    const result = await loginAdmin(email, password, res);
    if (!result) return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
    return res.json({ user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role }, token: result.token });
  });

  app.post(["/api/admin/logout", "/admin/logout"], (_req, res) => {
    logoutAdmin(res);
    return res.json({ success: true });
  });

  app.get(["/api/admin/session", "/admin/session"], async (req, res) => {
    const user = await getAdminFromRequest(req);
    return res.json({ user: user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null });
  });

  app.post(["/api/scheduled/sync-finished-matches", "/scheduled/sync-finished-matches"], async (_req, res) => {
    try {
      const updated = await syncFinishedMatches();
      return res.json({ ok: true, updated });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "sync failed" });
    }
  });

  void provisionInitialAdmin().catch(error => console.error("[Admin Auth] Could not provision initial admin", error));
}
