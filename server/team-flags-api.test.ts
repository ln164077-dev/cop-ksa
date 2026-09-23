import { afterEach, describe, expect, it, vi } from "vitest";
import { remoteTeamFlag } from "../shared/team-flags";

afterEach(() => vi.unstubAllGlobals());

describe("remoteTeamFlag", () => {
  it("uses CountriesNow and recognizes an Arabic country name with a typo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [{ iso2: "JO", name: "Jordan", flag: "https://flags.test/jo.svg" }] }) }));
    expect(await remoteTeamFlag("الاردن")).toEqual({ code: "JO", flagUrl: "https://flags.test/jo.svg" });
  });
});
