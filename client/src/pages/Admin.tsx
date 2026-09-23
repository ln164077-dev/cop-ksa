import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, Edit3, LoaderCircle, Plus, ShieldCheck, Ticket, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";
import { GlobalFooter, GlobalHeader } from "@/components/GlobalChrome";

type FormValues = {
  slug: string;
  competition: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  city: string;
  matchDate: string;
  matchTime: string;
  status: "available" | "limited" | "sold_out" | "finished";
  ticketLabel: string;
  accentColor: string;
  isPublished: boolean;
};

type AdminMatch = Omit<FormValues, "matchDate"> & {
  id: number;
  matchDate: string | Date;
};

const blankMatch = (): FormValues => ({
  slug: "",
  competition: "كأس الخليج 2026",
  round: "الجولة الأولى",
  homeTeam: "",
  awayTeam: "",
  venue: "",
  city: "جدة",
  matchDate: "2026-09-27T19:00",
  matchTime: "09:00 مساءً",
  status: "available",
  ticketLabel: "التذاكر متاحة الآن",
  accentColor: "emerald",
  isPublished: true,
});

function inputDate(value: string | Date) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toFormValues(match: AdminMatch): FormValues {
  return {
    slug: match.slug,
    competition: match.competition,
    round: match.round,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    venue: match.venue ?? "",
    city: match.city,
    matchDate: inputDate(match.matchDate),
    matchTime: match.matchTime ?? "يحدد لاحقًا",
    status: match.status,
    ticketLabel: match.ticketLabel,
    accentColor: match.accentColor,
    isPublished: match.isPublished,
  };
}

const statusCopy: Record<FormValues["status"], string> = {
  available: "متاح",
  limited: "محدود",
  sold_out: "نفدت",
  finished: "منتهية",
};

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const { data: matches = [], isLoading } = trpc.matches.listAdmin.useQuery(undefined, { enabled: isAdmin });
  const [form, setForm] = useState<FormValues>(blankMatch);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const createMutation = trpc.matches.create.useMutation({
    onSuccess: async () => { await utils.matches.listAdmin.invalidate(); toast.success("تمت إضافة المباراة"); resetForm(); },
    onError: error => toast.error("تعذر حفظ المباراة", { description: error.message }),
  });
  const updateMutation = trpc.matches.update.useMutation({
    onSuccess: async () => { await utils.matches.listAdmin.invalidate(); toast.success("تم تحديث المباراة"); resetForm(); },
    onError: error => toast.error("تعذر تحديث المباراة", { description: error.message }),
  });
  const deleteMutation = trpc.matches.delete.useMutation({
    onSuccess: async () => { await utils.matches.listAdmin.invalidate(); toast.success("تم حذف المباراة"); },
    onError: error => toast.error("تعذر حذف المباراة", { description: error.message }),
  });

  const stats = useMemo(() => {
    const data = matches as AdminMatch[];
    return {
      total: data.length,
      available: data.filter(match => match.status === "available").length,
      published: data.filter(match => match.isPublished).length,
    };
  }, [matches]);

  function resetForm() {
    setForm(blankMatch());
    setEditingId(null);
    setFormOpen(false);
  }

  function startEdit(match: AdminMatch) {
    setEditingId(match.id);
    setForm(toFormValues(match));
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function change<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const payload = { ...form, matchDate: new Date(form.matchDate).toISOString() };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  }

  if (loading) return <main className="admin-shell" dir="rtl"><GlobalHeader /><div className="admin-loading"><LoaderCircle className="spin" size={28} /> جاري تجهيز لوحة التحكم…</div><GlobalFooter /></main>;

  if (!user) {
    return (
      <main dir="rtl" className="admin-shell"><GlobalHeader /><div className="admin-gate"><div className="admin-gate-card"><span className="gate-icon"><ShieldCheck size={28} /></span><p className="section-kicker">دخول آمن</p><h1>لوحة إدارة المباريات</h1><p>سجّل الدخول بحساب المالك للوصول إلى إضافة المباريات وتعديلها وحذفها.</p><button onClick={() => startLogin()}>تسجيل الدخول <ArrowRight size={18} /></button><Link href="/">العودة للموقع</Link></div></div><GlobalFooter /></main>
    );
  }

  if (!isAdmin) {
    return (
      <main dir="rtl" className="admin-shell"><GlobalHeader /><div className="admin-gate"><div className="admin-gate-card"><span className="gate-icon"><ShieldCheck size={28} /></span><p className="section-kicker">صلاحية مطلوبة</p><h1>لا تملك صلاحية الإدارة</h1><p>يُمنح دور المسؤول تلقائيًا لصاحب المشروع. استخدم حساب المالك أو حدّث دور المستخدم من قاعدة البيانات.</p><Link className="gate-return" href="/">العودة للموقع</Link></div></div><GlobalFooter /></main>
    );
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <main dir="rtl" className="admin-shell">
      <GlobalHeader onLogout={logout} />

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p>القائمة</p>
          <a className="side-active" href="#dashboard"><ClipboardList size={17} /> المباريات</a>
          <a href="#match-form"><Plus size={17} /> إضافة مباراة</a>
          <Link href="/"><ArrowRight size={17} /> عرض الموقع</Link>
          <div className="sidebar-help"><ShieldCheck size={17} /><span>البيانات تُحفظ في قاعدة البيانات وتُعرض فورًا في صفحة المباريات.</span></div>
        </aside>

        <section className="admin-content" id="dashboard">
          <div className="admin-page-title"><div><p className="section-kicker">مركز العمليات</p><h1>إدارة المباريات</h1><p>أضف أو عدّل أو أوقف نشر أي مباراة من مكان واحد.</p></div><button className="add-match" onClick={() => { setFormOpen(true); setEditingId(null); setForm(blankMatch()); }}><Plus size={17} /> مباراة جديدة</button></div>

          <div className="stat-grid"><div><span className="stat-icon"><CalendarDays /></span><p>إجمالي المباريات</p><strong>{stats.total}</strong></div><div><span className="stat-icon green"><Ticket /></span><p>متاحة للحجز</p><strong>{stats.available}</strong></div><div><span className="stat-icon blue"><CheckCircle2 /></span><p>منشورة على الموقع</p><strong>{stats.published}</strong></div></div>

          {formOpen && (
            <form className="match-form-panel" id="match-form" onSubmit={submit}>
              <div className="form-heading"><div><p className="section-kicker">{editingId ? "تحديث سجل" : "إضافة فعالية"}</p><h2>{editingId ? "تعديل تفاصيل المباراة" : "بيانات المباراة الجديدة"}</h2></div><button type="button" className="close-form" onClick={resetForm}>إلغاء</button></div>
              <div className="form-grid">
                <label><span>الفريق المستضيف</span><input required value={form.homeTeam} onChange={e => change("homeTeam", e.target.value)} placeholder="مثال: السعودية" /></label>
                <label><span>الفريق الضيف</span><input required value={form.awayTeam} onChange={e => change("awayTeam", e.target.value)} placeholder="مثال: الكويت" /></label>
                <label><span>البطولة</span><input required value={form.competition} onChange={e => change("competition", e.target.value)} /></label>
                <label><span>الجولة</span><input required value={form.round} onChange={e => change("round", e.target.value)} /></label>
                <label><span>التاريخ والوقت</span><input required type="datetime-local" value={form.matchDate} onChange={e => change("matchDate", e.target.value)} /></label>
                <label><span>الساعة المعروضة</span><input required value={form.matchTime} onChange={e => change("matchTime", e.target.value)} placeholder="09:30 مساءً" /></label>
                <label><span>الملعب</span><input required value={form.venue} onChange={e => change("venue", e.target.value)} placeholder="اسم الملعب" /></label>
                <label><span>المدينة</span><input required value={form.city} onChange={e => change("city", e.target.value)} /></label>
                <label><span>حالة التذكرة</span><select value={form.status} onChange={e => change("status", e.target.value as FormValues["status"])}><option value="available">متاحة للحجز</option><option value="limited">مقاعد محدودة</option><option value="sold_out">نفدت التذاكر</option><option value="finished">انتهت المباراة</option></select></label>
                <label><span>النص الترويجي للتذكرة</span><input required value={form.ticketLabel} onChange={e => change("ticketLabel", e.target.value)} /></label>
                <label><span>لون البطاقة</span><select value={form.accentColor} onChange={e => change("accentColor", e.target.value)}><option value="emerald">أخضر</option><option value="blue">أزرق</option><option value="violet">بنفسجي</option><option value="orange">برتقالي</option></select></label>
                <label><span>معرّف الرابط</span><input required value={form.slug} onChange={e => change("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="saudi-vs-kuwait-2026" /></label>
              </div>
              <label className="publish-toggle"><input type="checkbox" checked={form.isPublished} onChange={e => change("isPublished", e.target.checked)} /><span><b>نشر المباراة في الموقع</b><small>المباريات غير المنشورة تبقى محفوظة في لوحة التحكم فقط.</small></span></label>
              <div className="form-actions"><button type="button" onClick={resetForm}>إلغاء</button><button className="save-match" disabled={saving}>{saving && <LoaderCircle className="spin" size={15} />}{editingId ? "حفظ التغييرات" : "حفظ المباراة"}</button></div>
            </form>
          )}

          <section className="matches-admin-list"><div className="list-heading"><div><h2>كل المباريات</h2><p>تظهر المباريات المنشورة فقط للزوار في صفحة التذاكر.</p></div></div>
            {isLoading ? <div className="admin-list-loading"><LoaderCircle className="spin" size={22} /> جارِ تحميل المباريات…</div> : (
              <div className="admin-table-wrap"><table><thead><tr><th>المواجهة</th><th>التاريخ والملعب</th><th>التذاكر</th><th>النشر</th><th aria-label="الإجراءات" /></tr></thead><tbody>{(matches as AdminMatch[]).map(match => <tr key={match.id}><td><b>{match.homeTeam} <small>ضد</small> {match.awayTeam}</b><span>{match.competition} · {match.round}</span></td><td><b>{new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(match.matchDate))}</b><span>{match.matchTime} · {match.venue}</span></td><td><span className={`admin-status ${match.status}`}>{statusCopy[match.status]}</span></td><td><span className={match.isPublished ? "published-badge" : "draft-badge"}>{match.isPublished ? "منشورة" : "مسودة"}</span></td><td><div className="row-actions"><button onClick={() => startEdit(match)} aria-label={`تعديل ${match.homeTeam} ضد ${match.awayTeam}`}><Edit3 size={16} /></button><button className="delete-row" onClick={() => { if (window.confirm(`حذف مباراة ${match.homeTeam} ضد ${match.awayTeam}؟`)) deleteMutation.mutate({ id: match.id }); }} aria-label={`حذف ${match.homeTeam} ضد ${match.awayTeam}`}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
            )}
          </section>
        </section>
      </div>
      <GlobalFooter />
    </main>
  );
}
