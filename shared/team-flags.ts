export type TeamFlagCode = "IRQ" | "OMA" | "KSA" | "KUW" | "UAE" | "YEM" | "QAT" | "BHR" | "TBD" | string;

type CountryFlagRecord = { code: string; flagUrl: string; names: string[] };

const aliases: Record<string, TeamFlagCode> = {
  "العراق": "IRQ",
  "عراق": "IRQ",
  "iraq": "IRQ",
  "العمان": "OMA",
  "عُمان": "OMA",
  "عمان": "OMA",
  "oman": "OMA",
  "السعودية": "KSA",
  "السعوديه": "KSA",
  "سعودية": "KSA",
  "سعوديه": "KSA",
  "السعوديه العربيه": "KSA",
  "saudiarabia": "KSA",
  "saudi": "KSA",
  "الكويت": "KUW",
  "كويت": "KUW",
  "kuwait": "KUW",
  "الإمارات": "UAE",
  "الامارات": "UAE",
  "امارات": "UAE",
  "الامارات العربيه المتحده": "UAE",
  "unitedarabemirates": "UAE",
  "uae": "UAE",
  "قطر": "QAT",
  "qatar": "QAT",
  "البحرين": "BHR",
  "بحرين": "BHR",
  "bahrain": "BHR",
  "اليمن": "YEM",
  "يمن": "YEM",
  "yemen": "YEM",
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("ar")
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/[ىئ]/g, "ي")
    .replace(/[ؤ]/g, "و")
    .replace(/[ة]/g, "ه")
    .replace(/ال/g, "")
    .replace(/[\s\-_.,'’`]/g, "")
    .replace(/[^\u0600-\u06ffa-z0-9]/g, "");
}

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j];
      row[j] = a[i - 1] === b[j - 1] ? diagonal : Math.min(row[j] + 1, row[j - 1] + 1, diagonal + 1);
      diagonal = above;
    }
  }
  return row[b.length];
}

const aliasEntries = Object.entries(aliases).map(([name, code]) => ({ name: normalize(name), code }));

export function teamFlagCode(teamName: string | null | undefined): TeamFlagCode {
  const normalized = normalize(teamName ?? "");
  if (!normalized) return "TBD";
  const exact = aliasEntries.find(entry => normalize(entry.name) === normalized);
  if (exact) return exact.code;
  const fuzzy = aliasEntries
    .map(entry => ({ ...entry, score: distance(normalized, entry.name) }))
    .sort((a, b) => a.score - b.score)[0];
  return fuzzy && fuzzy.score <= Math.max(1, Math.floor(normalized.length * 0.32)) ? fuzzy.code : "TBD";
}

let countryCatalogPromise: Promise<CountryFlagRecord[]> | null = null;

async function countryCatalog() {
  if (!countryCatalogPromise) {
    countryCatalogPromise = fetch("https://countriesnow.space/api/v0.1/countries/flag/images")
      .then(response => response.ok ? response.json() : [])
      .then((payload: { data?: Array<{ name?: string; flag?: string; iso2?: string }> } | Array<{ name?: string; flag?: string; iso2?: string }>) => {
        const countries = Array.isArray(payload) ? payload : payload.data ?? [];
        let arabicNames: Intl.DisplayNames | null = null;
        try { arabicNames = new Intl.DisplayNames(["ar"], { type: "region" }); } catch { arabicNames = null; }
        return countries
          .filter(country => country.iso2 && country.flag)
          .map(country => { const iso2 = country.iso2!; return { code: iso2, flagUrl: country.flag!, names: [country.name, iso2, arabicNames?.of(iso2)].filter(Boolean) as string[] }; });
      })
      .catch(() => []);
  }
  return countryCatalogPromise;
}

export async function remoteTeamFlag(teamName: string): Promise<{ code: string; flagUrl: string } | null> {
  const normalized = normalize(teamName);
  if (!normalized) return null;
  const countries = await countryCatalog();
  const ranked = countries.map(country => {
    const scores = country.names.map(name => {
      const candidate = normalize(name);
      return candidate === normalized ? 0 : distance(normalized, candidate);
    });
    return { country, score: Math.min(...scores) };
  }).sort((a, b) => a.score - b.score)[0];
  if (!ranked) return null;
  const threshold = Math.max(2, Math.floor(normalized.length * 0.38));
  return ranked.score <= threshold ? { code: ranked.country.code, flagUrl: ranked.country.flagUrl } : null;
}
