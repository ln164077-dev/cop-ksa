import { afterEach, describe, expect, it, vi } from "vitest";
import { remoteTeamFlag } from "../shared/team-flags";

afterEach(() => vi.unstubAllGlobals());

describe("remoteTeamFlag", () => {
  it("uses REST Countries translations and tolerates a typo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [{ cca2: "EG", name: { common: "Egypt", official: "Arab Republic of Egypt" }, translations: { ara: { common: "مصر", official: "جمهورية مصر العربية" } }, flags: { png: "https://flagcdn.test/eg.png" } }] }));
    expect(await remoteTeamFlag("مصرر")).toEqual({ code: "EG", flagUrl: "https://flagcdn.test/eg.png" });
  });
});
