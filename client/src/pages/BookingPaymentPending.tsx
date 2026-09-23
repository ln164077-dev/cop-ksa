import { ArrowRight, CreditCard, Info } from "lucide-react";
import { useLocation } from "wouter";
import { BookingFrame } from "./BookingSeats";

export default function BookingPaymentPending() {
  const [, navigate] = useLocation();
  return <BookingFrame><div className="booking-kicker">الخطوة 3 من 3</div><div className="pending-icon"><CreditCard size={31} /></div><h1 className="booking-title center">الدفع قيد الإنشاء</h1><p className="booking-subtitle center">تم تسجيل بيانات الحجز بنجاح. سيتم تفعيل الدفع الإلكتروني قريبًا.</p><div className="pending-note"><Info size={17} /><span>هذه الصفحة تجريبية حاليًا ولا يتم تنفيذ أي عملية دفع أو خصم.</span></div><button className="booking-primary full" onClick={() => navigate("/")}><ArrowRight size={17} /> العودة إلى المباريات</button></BookingFrame>;
}
