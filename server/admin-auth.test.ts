import { describe, expect, it } from "vitest";

describe("admin login API", () => {
  it("accepts the configured admin secret through the lightweight login endpoint", async () => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    expect(email).toBeTruthy();
    expect(password).toBeTruthy();
    const response = await fetch("http://127.0.0.1:3000/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(response.status).toBe(200);
    const payload = await response.json() as { user?: { role?: string }; token?: string };
    expect(payload.user?.role).toBe("admin");
    expect(payload.token).toBeTruthy();
    const input = encodeURIComponent(JSON.stringify({ 0: { json: null } }));
    const list = await fetch(`http://127.0.0.1:3000/api/trpc/matches.listAdmin?batch=1&input=${input}`, { headers: { Authorization: `Bearer ${payload.token}` } });
    expect(list.status).toBe(200);
  });
});
