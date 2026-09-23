import postgres from "postgres";
import { describe, expect, it } from "vitest";

describe("Neon configuration", () => {
  it("connects to the configured PostgreSQL database", async () => {
    const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    expect(connectionString).toMatch(/^postgres(?:ql)?:\/\//);

    const sql = postgres(connectionString!, { max: 1, prepare: false });
    try {
      const result = await sql`select 1 as ok`;
      expect(Number(result[0]?.ok)).toBe(1);
    } finally {
      await sql.end({ timeout: 5 });
    }
  }, 20_000);
});
