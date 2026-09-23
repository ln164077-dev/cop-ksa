import { ArrowRight, Check, Minus, Plus, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { GlobalFooter, GlobalHeader } from "@/components/GlobalChrome";

type Match = { id: number; homeTeam: string; awayTeam: string; matchDate: Date | string; matchTime: string | null; venue: string | null; city: string };
const categories = [
  { id: "vip", name: "VIP", description: "مقاعد مميزة في أفضل منطقة", price: 450 },
  { id: "gold", name: "ذهبية", description: "إطلالة ممتازة على الملعب", price: 250 },
  { id: "silver", name: "فضية", description: "مقاعد مريحة بسعر مناسب", price: 120 },
];

function dateText(value: Date | string) { return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(value)); }

export default function BookingSeats() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const matchId = Number(params.get("matchId"));
  const { data: matches = [], isLoading } = trpc.matches.listPublic.useQuery(undefined, { refetchInterval: 60_000 });
  const match = (matches as Match[]).find(item => item.id === matchId);
  const [category, setCategory] = useState(categories[1].id);
  const [quantity, setQuantity] = useState(1);
  const selected = categories.find(item => item.id === category) ?? categories[1];
  const total = useMemo(() => selected.price * quantity, [quantity, selected.price]);

  if (isLoading) return <BookingFrame><div className="booking-loading">جاري تحميل تفاصيل المباراة…</div></BookingFrame>;
  if (!match) return <BookingFrame><div className="booking-empty">المباراة غير موجودة<button className="booking-primary" onClick={() => navigate("/")}>العودة للمباريات</button></div></BookingFrame>;

  return <BookingFrame>
    <button className="booking-back" onClick={() => navigate("/")}><ArrowRight size={17} /> العودة للمباريات</button>
    <div className="booking-kicker">الخطوة 1 من 3</div>
    <h1 className="booking-title">اختر فئة المقاعد</h1>
    <p className="booking-subtitle">{match.homeTeam} ضد {match.awayTeam} · {dateText(match.matchDate)} · {match.matchTime}</p>
    <div className="booking-section-label"><Ticket size={18} /> فئات التذاكر</div>
    <div className="seat-options">{categories.map(item => <button key={item.id} className={`seat-option ${category === item.id ? "selected" : ""}`} onClick={() => setCategory(item.id)}><span className="seat-radio">{category === item.id && <Check size={13} />}</span><span className="seat-copy"><strong>{item.name}</strong><small>{item.description}</small></span><b>{item.price} ر.س</b></button>)}</div>
    <div className="quantity-row"><div><strong>عدد التذاكر</strong><small>بحد أقصى 10 تذاكر</small></div><div className="quantity-control"><button onClick={() => setQuantity(value => Math.max(1, value - 1))} aria-label="تقليل العدد"><Minus size={16} /></button><b>{quantity}</b><button onClick={() => setQuantity(value => Math.min(10, value + 1))} aria-label="زيادة العدد"><Plus size={16} /></button></div></div>
    <div className="booking-total"><span>الإجمالي</span><strong>{total.toLocaleString("ar-SA")} ر.س</strong></div>
    <button className="booking-primary full" onClick={() => navigate(`/booking/details?matchId=${match.id}&category=${category}&qty=${quantity}`)}>متابعة الحجز <ArrowRight size={17} /></button>
  </BookingFrame>;
}

export function BookingFrame({ children }: { children: React.ReactNode }) { return <main dir="rtl" className="booking-page"><GlobalHeader /><section className="booking-card">{children}</section><GlobalFooter /></main>; }
