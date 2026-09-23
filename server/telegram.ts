import { ENV } from "./_core/env";

type BookingNotification = {
  match: {
    matchNumber: number;
    homeTeam: string;
    awayTeam: string;
    matchDate: Date | string;
    matchTime: string | null;
    venue: string | null;
    city: string;
  };
  customerName: string;
  phone: string;
  delivery: "whatsapp" | "email";
  contact: string;
  category: string;
  quantity: number;
  total: number;
  currency: string;
};

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] ?? character));
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { dateStyle: "full", timeZone: "Asia/Riyadh" }).format(new Date(value));
}

export async function sendBookingNotification(input: BookingNotification) {
  if (!ENV.telegramBotToken || !ENV.telegramChatId) throw new Error("إعدادات تيليجرام غير مكتملة");

  const deliveryLabel = input.delivery === "whatsapp" ? "واتساب" : "بريد إلكتروني";
  const text = [
    "<b>🎟️ حجز تذاكر جديد</b>",
    "",
    `<b>المباراة:</b> ${escapeHtml(input.match.homeTeam)} ضد ${escapeHtml(input.match.awayTeam)}`,
    `<b>رقم المباراة:</b> ${escapeHtml(input.match.matchNumber)}`,
    `<b>التاريخ:</b> ${escapeHtml(formatDate(input.match.matchDate))}`,
    `<b>الوقت:</b> ${escapeHtml(input.match.matchTime ?? "يحدد لاحقًا")}`,
    `<b>الملعب:</b> ${escapeHtml(input.match.venue ?? "يحدد لاحقًا")}، ${escapeHtml(input.match.city)}`,
    "",
    `<b>اسم العميل:</b> ${escapeHtml(input.customerName)}`,
    `<b>رقم الهاتف:</b> ${escapeHtml(input.phone)}`,
    `<b>طريقة الاستلام:</b> ${escapeHtml(deliveryLabel)}`,
    `<b>بيانات الاستلام:</b> ${escapeHtml(input.contact)}`,
    "",
    `<b>فئة المقاعد:</b> ${escapeHtml(input.category)}`,
    `<b>العدد:</b> ${escapeHtml(input.quantity)}`,
    `<b>المبلغ الإجمالي:</b> ${escapeHtml(input.total.toFixed(2))} ${escapeHtml(input.currency === "QAR" ? "ر.ق" : "ر.س")}`,
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${ENV.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: ENV.telegramChatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  const result = await response.json() as { ok?: boolean; description?: string; result?: { message_id?: number } };
  if (!response.ok || !result.ok) throw new Error(result.description ?? "تعذر إرسال إشعار الحجز إلى تيليجرام");
  return { messageId: result.result?.message_id ?? null };
}

export function formatBookingCategory(category: string) {
  return ({ gold: "ذهبية", silver: "فضية", bronze: "برونزية" } as Record<string, string>)[category] ?? category;
}

export {};
