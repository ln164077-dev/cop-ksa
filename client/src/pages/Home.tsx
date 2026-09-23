import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CalendarDays, CircleUserRound, Menu, MapPin, ShoppingBag, SlidersHorizontal, Ticket, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { teamFlagCode } from "@shared/team-flags";

type MatchItem = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeShort: string;
  awayShort: string;
  matchDate: Date | string;
  matchTime: string | null;
  venue: string | null;
  city: string;
  status: "available" | "limited" | "sold_out" | "finished";
  homeScore?: number | null;
  awayScore?: number | null;
};

const flagIds: Record<string, string> = { IRQ: "flag-iq", OMA: "flag-om", KSA: "flag-sa", KUW: "flag-kw", UAE: "flag-ae", YEM: "flag-ye", QAT: "flag-qa", BHR: "flag-bh" };

function dateText(value: Date | string) {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return `${day}, ${time}`;
}

function Flag({ teamName }: { teamName: string }) {
  const code = teamFlagCode(teamName);
  return <div className="template-flag-box"><svg viewBox="0 0 900 600" aria-label={teamName}><use href={`#${flagIds[code] ?? "flag-tbd"}`} /></svg></div>;
}

function FlagDefinitions() {
  return (
    <svg className="template-flag-definitions" aria-hidden="true">
      <defs>
        <g id="flag-iq"><rect width="900" height="600" fill="#000" /><rect width="900" height="400" fill="#fff" /><rect width="900" height="200" fill="#ce1126" /><text x="450" y="335" fontFamily="sans-serif" fontWeight="bold" fontSize="70" fill="#007a3d" textAnchor="middle">اللّهُ أَكْبَرُ</text></g>
        <g id="flag-om"><rect width="900" height="600" fill="#db161b" /><rect x="300" width="600" height="200" fill="#fff" /><rect x="300" y="400" width="600" height="200" fill="#008000" /><path d="M50,40 h60 v60 h-60 z" fill="#fff" opacity=".9" /></g>
        <g id="flag-sa"><rect width="900" height="600" fill="#006c35" /><text x="450" y="300" fontFamily="sans-serif" fontWeight="bold" fontSize="80" fill="#fff" textAnchor="middle">لا إله إلا الله</text><path d="M250 380 L650 380 L620 400 L250 380" fill="#fff" /></g>
        <g id="flag-kw"><rect width="900" height="600" fill="#007a3d" /><rect y="200" width="900" height="200" fill="#fff" /><rect y="400" width="900" height="200" fill="#ce1126" /><polygon points="0,0 300,200 300,400 0,600" fill="#000" /></g>
        <g id="flag-ae"><rect width="900" height="600" fill="#00732f" /><rect y="200" width="900" height="200" fill="#fff" /><rect y="400" width="900" height="200" fill="#000" /><rect width="250" height="600" fill="#f00" /></g>
        <g id="flag-ye"><rect width="900" height="600" fill="#000" /><rect width="900" height="400" fill="#fff" /><rect width="900" height="200" fill="#ce1126" /></g>
        <g id="flag-qa"><rect width="900" height="600" fill="#8d1b3d" /><polygon points="0,0 250,0 320,33 250,66 320,100 250,133 320,166 250,200 320,233 250,266 320,300 250,333 320,366 250,400 320,433 250,466 320,500 250,533 320,566 250,600 0,600" fill="#fff" /></g>
        <g id="flag-bh"><rect width="900" height="600" fill="#ce1126" /><polygon points="0,0 220,0 300,60 220,120 300,180 220,240 300,300 220,360 300,420 220,480 300,540 220,600 0,600" fill="#fff" /></g>
        <g id="flag-tbd"><rect width="900" height="600" fill="#d5d9d7" /><circle cx="450" cy="300" r="150" fill="#8c9993" /></g>
      </defs>
    </svg>
  );
}

export default function Home() {
  const { data: matches = [], isLoading } = trpc.matches.listPublic.useQuery();
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<MatchItem | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const list = useMemo(() => (matches as MatchItem[]).filter(match => {
    const searchable = `${match.homeTeam} ${match.awayTeam} ${match.city}`.toLowerCase();
    return (!query || searchable.includes(query.trim().toLowerCase())) && (!onlyAvailable || match.status === "available" || match.status === "limited");
  }), [matches, onlyAvailable, query]);

  return (
    <main dir="rtl" className="template-page">
      <FlagDefinitions />
      <div className="template-shell">
        <header className="template-header">
          <div className="template-header-controls">
            <button aria-label="السلة"><ShoppingBag size={19} /></button><i /><Link href="/admin" aria-label="حسابي"><CircleUserRound size={21} /></Link><i /><button className="template-language">▣ AR</button>
          </div>
          <div className="template-brand"><span>🏆</span><strong>كأس الخليج العربي 27<small>2026 - السعودية</small></strong><button aria-label="القائمة"><Menu size={25} /></button></div>
        </header>

        <div className="template-results-bar">
          <button className="template-filter-btn" onClick={() => setFilterOpen(value => !value)}><SlidersHorizontal size={13} /> خيارات التصفية</button>
          <div><b>{list.length}</b> <span>النتائج</span></div>
        </div>
        {filterOpen && <div className="template-filter-panel"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن فريق أو مدينة" /><button className={onlyAvailable ? "selected" : ""} onClick={() => setOnlyAvailable(value => !value)}>المباريات المتاحة فقط</button></div>}

        <section className="template-matches-container" aria-label="المباريات">
          {isLoading && Array.from({ length: 6 }).map((_, index) => <div className="template-match-card template-skeleton" key={index} />)}
          {!isLoading && list.map((match, index) => {
            const finished = match.status === "finished";
            return <article className={`template-match-card ${index % 2 ? "template-match-even" : ""}`} key={match.id}>
              <div className="template-order-wrap"><button className="order-btn" disabled={finished} onClick={() => finished ? setSelected(match) : setSelected(match)}><span>{finished ? "النتيجة" : "طلب الآن"}</span><Ticket size={14} /></button></div>
              <button className="template-match-info" onClick={() => setSelected(match)}>
                <h2>{match.homeTeam} <span>ضد</span> {match.awayTeam}</h2>
                {finished && <strong className="template-score">{match.homeScore} — {match.awayScore}</strong>}
                <div className="template-date"><CalendarDays size={12} /><span>{dateText(match.matchDate)}</span></div>
                <div className="template-stadium"><MapPin size={11} /><span>{match.venue ?? "يحدد لاحقًا"}، {match.city}</span></div>
              </button>
              <div className="template-flags"><Flag teamName={match.homeTeam} /><span className="vs-badge">VS</span><Flag teamName={match.awayTeam} /></div>
            </article>;
          })}
          {!isLoading && list.length === 0 && <div className="template-empty">لا توجد مباريات مطابقة</div>}
        </section>

        <footer className="template-footer"><div className="template-footer-brand">ticketmaster<sup>®</sup> <small>Powered by</small></div><div className="template-footer-links"><a href="#">الشروط والأحكام العامة</a><a href="#">سياسة الخصوصية</a><a href="#">تواصل معنا</a><a href="#">الأسئلة الشائعة حول التذاكر</a><Link href="/admin">الإدارة</Link></div></footer>
      </div>

      {selected && <div className="compact-modal-backdrop" onMouseDown={() => setSelected(null)}><section className="compact-modal" onMouseDown={event => event.stopPropagation()}><button className="compact-close" onClick={() => setSelected(null)}><X size={18} /></button><div className="compact-modal-flags"><Flag teamName={selected.homeTeam} /><b>VS</b><Flag teamName={selected.awayTeam} /></div><h2>{selected.homeTeam} <span>ضد</span> {selected.awayTeam}</h2><p>{dateText(selected.matchDate)}</p><p>{selected.venue ?? "يحدد لاحقًا"}، {selected.city}</p>{selected.status === "finished" ? <strong className="modal-score">النتيجة {selected.homeScore} — {selected.awayScore}</strong> : <button className="modal-book" onClick={() => { setSelected(null); navigate(`/booking/seats?matchId=${selected.id}`); }}>متابعة الحجز</button>}</section></div>}
    </main>
  );
}
