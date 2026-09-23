import { describe, expect, it } from "vitest";
import { teamFlagCode } from "../shared/team-flags";

describe("teamFlagCode", () => {
  it("maps Arabic team names without dashboard short codes", () => {
    expect(teamFlagCode("السعودية")).toBe("KSA");
    expect(teamFlagCode("الإمارات")).toBe("UAE");
    expect(teamFlagCode("عمان")).toBe("OMA");
  });

  it("recognizes common spelling mistakes and missing letters", () => {
    expect(teamFlagCode("السعوديه")).toBe("KSA");
    expect(teamFlagCode("سعوودية")).toBe("KSA");
    expect(teamFlagCode("الامارات العربيه المتحده")).toBe("UAE");
    expect(teamFlagCode("قطرر")).toBe("QAT");
  });

  it("falls back safely for unknown teams", () => {
    expect(teamFlagCode("فريق غير معروف")).toBe("TBD");
  });
});
