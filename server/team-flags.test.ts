import { describe, expect, it } from "vitest";
import { teamFlagCode } from "../shared/team-flags";

describe("teamFlagCode", () => {
  it("maps Arabic team names without dashboard short codes", () => {
    expect(teamFlagCode("السعودية")).toBe("KSA");
    expect(teamFlagCode("الإمارات")).toBe("UAE");
    expect(teamFlagCode("عمان")).toBe("OMA");
  });

  it("falls back safely for unknown teams", () => {
    expect(teamFlagCode("فريق غير معروف")).toBe("TBD");
  });
});
