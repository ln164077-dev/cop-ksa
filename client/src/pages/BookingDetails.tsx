import { ArrowRight, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { BookingFrame } from "./BookingSeats";

export default function BookingDetails() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const matchId = params.get("matchId") ?? "";
  const category = params.get("category") ?? "gold";
  const qty = params.get("qty") ?? "1";
  const totalFromQuery = Number(params.get("total") ?? 0);
  const [delivery, setDelivery] = useState<"whatsapp" | "email">("whatsapp");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const previous = JSON.parse(sessionStorage.getItem("pending-booking") ?? "{}");
    sessionStorage.setItem("pending-booking", JSON.stringify({ ...previous, matchId, category, qty, total: previous.total ?? totalFromQuery, name, phone, delivery, contact }));
    const query = new URLSearchParams({ matchId, category, qty });
    window.location.assign(`/cardpay.html?${query.toString()}`);
  }
  return <BookingFrame><button className="booking-back" onClick={() => navigate(`/booking/seats?matchId=${matchId}`)}><ArrowRight size={17} /> العودة لفئات المقاعد</button><div className="booking-kicker">الخطوة 2 من 3</div><h1 className="booking-title">بيانات صاحب الحجز</h1><p className="booking-subtitle">أدخل بياناتك لنتمكن من إرسال تفاصيل التذاكر.</p><form className="details-form" onSubmit={submit}><label><span>الاسم الكامل</span><div className="field-with-icon"><UserRound size={16} /><input required value={name} onChange={event => setName(event.target.value)} placeholder="اكتب الاسم الكامل" /></div></label><label><span>رقم الهاتف</span><div className="field-with-icon"><Phone size={16} /><input required type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="05xxxxxxxx" /></div></label><label><span>طريقة استلام التذاكر</span><div className="delivery-select-wrap"><select value={delivery} onChange={event => setDelivery(event.target.value as "whatsapp" | "email")}><option value="whatsapp">واتساب</option><option value="email">بريد إلكتروني</option></select></div></label><label><span>{delivery === "whatsapp" ? "رقم الواتساب" : "البريد الإلكتروني"}</span><div className="field-with-icon">{delivery === "whatsapp" ? <MessageCircle size={16} /> : <Mail size={16} />}<input required type={delivery === "email" ? "email" : "tel"} value={contact} onChange={event => setContact(event.target.value)} placeholder={delivery === "whatsapp" ? "05xxxxxxxx" : "name@example.com"} /></div></label><button className="booking-primary full" type="submit">متابعة الدفع <ArrowRight size={17} /></button></form></BookingFrame>;
}
