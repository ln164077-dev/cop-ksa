export type TeamFlagCode = "IRQ" | "OMA" | "KSA" | "KUW" | "UAE" | "YEM" | "QAT" | "BHR" | "TBD";

const aliases: Record<string, TeamFlagCode> = {
  "العراق": "IRQ",
  "السعودية": "KSA",
  "عُمان": "OMA",
  "عمان": "OMA",
  "الكويت": "KUW",
  "الإمارات": "UAE",
  "الامارات": "UAE",
  "قطر": "QAT",
  "البحرين": "BHR",
  "اليمن": "YEM",
};

export function teamFlagCode(teamName: string | null | undefined): TeamFlagCode {
  const normalized = (teamName ?? "").trim().replace(/[إأآ]/g, "ا").replace(/ى/g, "ي");
  return aliases[normalized] ?? "TBD";
}
