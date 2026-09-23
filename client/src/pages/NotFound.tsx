import { Home, SearchX } from "lucide-react";
import { useLocation } from "wouter";
import { GlobalFooter, GlobalHeader } from "@/components/GlobalChrome";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return <main dir="rtl" className="results-page not-found-page"><GlobalHeader /><section className="not-found-card"><span className="not-found-icon"><SearchX size={31} /></span><p className="not-found-kicker">النتيجة غير موجودة</p><h1>404</h1><h2>هذه الصفحة غير متاحة</h2><p>ربما تم نقل الرابط أو لم يعد موجودًا. يمكنك العودة إلى قائمة المباريات.</p><button className="not-found-button" onClick={() => setLocation("/")}><Home size={16} /> العودة للمباريات</button></section><GlobalFooter /></main>;
}
