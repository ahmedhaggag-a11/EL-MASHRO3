"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Star,
  Wallet,
  LogOut,
  CheckCircle2,
  Eye,
  Video,
  Clock,
  Send,
  Sparkles,
  ArrowUpRight,
  Sliders,
  DollarSign,
  UserCheck,
  Building,
  Check,
  CreditCard,
  Phone,
  Brain,
} from "lucide-react";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/theme/ThemeToggle";

interface LeadItem {
  id: string;
  subject: string;
  topic: string;
  student: string;
  university: string;
  faculty: string;
  mode: "ONLINE" | "IN_PERSON";
  budget: number;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "ASAP";
  postedAt: string;
  description: string;
  status: "OPEN" | "ACCEPTED" | "PASSED";
}

interface BookingItem {
  id: string;
  date: string;
  student: string;
  phone: string;
  subject: string;
  mode: "ONLINE" | "IN_PERSON";
  price: number;
  status: "مؤكدة" | "في انتظار الدفع" | "مكتملة";
  meetUrl?: string;
}

const INITIAL_LEADS: LeadItem[] = [];
const INITIAL_BOOKINGS: BookingItem[] = [];

export default function TutorDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "bookings" | "reviews" | "earnings" | "workshops" | "profile">("overview");
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_LEADS);
  const [bookings, setBookings] = useState<BookingItem[]>(INITIAL_BOOKINGS);

  // Earnings
  const [clearedEarnings, setClearedEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);

  // Modals
  const [acceptModalLead, setAcceptModalLead] = useState<LeadItem | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"vodafone" | "instapay" | "bank">("instapay");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [payoutAmount, setPayoutAmount] = useState(2000);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function triggerToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  useEffect(() => {
    async function loadLeads() {
      const token = localStorage.getItem("fz_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/v1/tutors/leads`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("fz_token");
          window.location.href = "/login";
          return;
        }
        if (!response.ok) throw new Error("Failed to load tutor leads");

        const data = await response.json();
        setLeads(data.map((request: any): LeadItem => ({
          id: request.id,
          subject: request.subject?.name ?? "مادة غير محددة",
          topic: request.topic?.name ?? "موضوع غير محدد",
          student: request.student?.fullName ?? "طالب",
          university: request.university?.name ?? "جامعة غير محددة",
          faculty: request.faculty?.name ?? "كلية غير محددة",
          mode: request.teachingMode,
          budget: request.budgetEGP ?? 0,
          urgency: request.urgency ?? "MEDIUM",
          postedAt: new Date(request.createdAt).toLocaleString("ar-EG"),
          description: request.description,
          status: request.status === "PUBLISHED" || request.status === "MATCHING" ? "OPEN" : "PASSED",
        })));
      } catch {
        triggerToast("تعذر تحميل طلبات الطلاب من السيرفر");
      }
    }

    loadLeads();
  }, []);

  // Accept Lead
  function handleConfirmAcceptLead() {
    if (!acceptModalLead) return;
    setLeads((prev) =>
      prev.map((l) => (l.id === acceptModalLead.id ? { ...l, status: "ACCEPTED" } : l))
    );
    const newBooking: BookingItem = {
      id: `BK-${Date.now().toString().slice(-3)}`,
      date: "غداً — ٠٥:٠٠ م",
      student: acceptModalLead.student,
      phone: "",
      subject: acceptModalLead.subject,
      mode: acceptModalLead.mode,
      price: acceptModalLead.budget,
      status: "مؤكدة",
    };
    setBookings((prev) => [newBooking, ...prev]);
    triggerToast(`🎉 تم قبول الطلب وإضافته لجدول حجوزاتك ومشاركة الطالب رابط الجلسة!`);
    setAcceptModalLead(null);
  }

  // Complete Booking
  function handleCompleteBooking(bookingId: string) {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "مكتملة" } : b))
    );
    const b = bookings.find((x) => x.id === bookingId);
    if (b) {
      const earned = Math.round(b.price * 0.85); // minus 15% platform commission
      setClearedEarnings((c) => c + earned);
    }
    triggerToast("✅ تم إنهاء الجلسة بنجاح وإيداع أرباحك الصافية في محفظتك!");
  }

  // Submit Payout
  function handlePayoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (payoutAmount > clearedEarnings) {
      triggerToast("⚠️ المبلغ المطلوب أكبر من رصيدك المتاح للسحب.");
      return;
    }
    setClearedEarnings((c) => c - payoutAmount);
    triggerToast(`💸 تم تقديم طلب تحويل ${payoutAmount} ج.م عبر ${payoutMethod === "instapay" ? "إنستاباي" : payoutMethod === "vodafone" ? "فودافون كاش" : "الحساب البنكي"} وجاري المعالجة خلال ساعتين.`);
    setPayoutModalOpen(false);
  }

  return (
    <main className="min-h-screen bg-cream font-arabic text-ink">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-2xl bg-ink px-5 py-3.5 text-sm font-bold text-cream shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-sun" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="border-b border-sand bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-mint to-green-600 text-xl text-white shadow-md">
                👨‍🏫
              </div>
              <div>
                <span className="text-base font-black text-ink">فك زنقة</span>
                <span className="mr-2 rounded-md bg-mint/15 px-2 py-0.5 text-[11px] font-black text-mint">
                  بوابة المعلم (Tutor Portal)
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
           
            <ThemeToggle />
            <Link
              href="/"
              className="rounded-xl bg-ink px-3 py-1.5 text-xs font-bold text-cream transition hover:bg-ink/90"
            >
              الرئيسية
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8 lg:py-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-20 space-y-3">
            <div className="rounded-3xl border border-sand bg-white p-3 shadow-sm">
              <div className="mb-3 px-3 pt-2 text-xs font-bold text-ink/40">حساب المدرس</div>
              <nav className="space-y-1">
                {[
                  { id: "overview", label: "نظرة عامة والجدول", icon: LayoutDashboard },
                  
                  { id: "leads", label: "رادار الطلبات الجديدة", icon: Briefcase, count: leads.filter(l => l.status === "OPEN").length },
                  { id: "bookings", label: "المواعيد والحجوزات", icon: Calendar, count: bookings.filter(b => b.status === "مؤكدة").length },
                  { id: "earnings", label: "المحفظة والأرباح", icon: Wallet, badge: `${clearedEarnings} ج.م` },
                  { id: "reviews", label: "تقييمات الطلاب", icon: Star, badge: "4.8 ⭐" },
                  { id: "profile", label: "الملف والتسعير والتواجد", icon: Sliders },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={
                      "flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-right text-sm font-bold transition " +
                      (activeTab === item.id
                        ? "bg-mint text-white shadow-md shadow-mint/30"
                        : "text-ink/70 hover:bg-ink/5")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.count && (
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[11px] font-black " +
                          (activeTab === item.id ? "bg-white/20 text-white" : "bg-coral text-white")
                        }
                      >
                        {item.count}
                      </span>
                    )}
                    {item.badge && (
                      <span className="rounded-full bg-mint/20 px-2 py-0.5 text-[11px] font-black text-ink">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Verified Badge Widget */}
            <div className="rounded-3xl border border-mint/30 bg-mint/10 p-4">
              <div className="flex items-center gap-2 font-black text-mint text-xs">
                <CheckCircle2 className="h-4 w-4" />
                حساب معتمد وموثق (Verified)
              </div>
              <p className="mt-1 text-[11px] text-ink/60">
                أنت مؤهل لاستقبال طلبات الطلاب الأونلاين والحضوري بعمولة مخفضة 15%.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Body */}
        <section className="flex-1 space-y-6">
          {/* ========================================================
              TAB 1: OVERVIEW
          ======================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <div>
                  <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-black text-mint">
                    أهلاً بك د. محمد 👋
                  </span>
                  <h1 className="mt-2 text-2xl font-black text-ink">لوحة إدارة جلساتك وأرباحك</h1>
                  <p className="mt-1 text-sm text-ink/60">
                    لديك {leads.filter(l => l.status === "OPEN").length} فرص جديدة متاحة للتدريس اليوم، و{bookings.filter(b => b.status === "مؤكدة").length} جلسات مؤكدة.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("leads")}
                  className="rounded-full bg-mint px-6 py-3 text-sm font-black text-white hover:brightness-95 shadow-lg shadow-mint/25 transition"
                >
                  استكشاف الطلبات الجديدة 🎯
                </button>
              </div>

              {/* Stat Tiles */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "أرباحك المتاحة للسحب", value: `${clearedEarnings} ج.م`, icon: "💰", color: "from-mint to-green-600", onClick: () => setActiveTab("earnings") },
                  { label: "جلسات محجوزة قادمة", value: bookings.filter(b => b.status === "مؤكدة").length, icon: "📅", color: "from-lilac to-indigo-600", onClick: () => setActiveTab("bookings") },
                  { label: "التقييم العام للطلاب", value: "4.8 / 5", icon: "⭐", color: "from-sun to-orange-500", onClick: () => setActiveTab("reviews") },
                  { label: "طالب تم مساعدتهم", value: "95 طالب", icon: "🎓", color: "from-coral to-coralDark", onClick: () => {} },
                ].map((s, i) => (
                  <div
                    key={i}
                    onClick={s.onClick}
                    className="cursor-pointer rounded-3xl border border-sand bg-white p-5 shadow-sm transition hover:shadow-md hover:border-mint/50"
                  >
                    <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-md text-lg`}>
                      {s.icon}
                    </div>
                    <div className="text-2xl font-black text-ink">{s.value}</div>
                    <div className="mt-1 text-xs font-bold text-ink/60">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Next Upcoming Session */}
              {bookings.filter(b => b.status === "مؤكدة").slice(0, 1).map((b) => (
                <div key={b.id} className="rounded-3xl border border-mint/40 bg-gradient-to-br from-mint/15 to-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-white text-2xl shadow">
                        <Video className="h-7 w-7" />
                      </div>
                      <div>
                        <span className="rounded-full bg-mint/20 px-2.5 py-0.5 text-[11px] font-black text-mint">
                          جلستك القادمة: {b.date}
                        </span>
                        <h3 className="text-lg font-black text-ink mt-1">{b.subject} — مع الطالب: {b.student}</h3>
                        <p className="text-xs text-ink/60">القيمة: {b.price} ج.م · الهاتف: {b.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCompleteBooking(b.id)}
                        className="rounded-full border border-sand bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-sand"
                      >
                        إنهاء واحتساب الأرباح ✓
                      </button>
                      <a
                        href={b.meetUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-mint px-6 py-2 text-xs font-black text-white hover:brightness-95 shadow-md shadow-mint/20"
                      >
                        بدء الجلسة الآن 🎥
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================
              TAB 2: LEADS & OPPORTUNITIES RADAR
          ======================================================== */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <div>
                  <h1 className="text-2xl font-black text-ink">🔎 رادار طلبات واستغاثات الطلاب</h1>
                  <p className="text-sm text-ink/60">
                    طلبات منشورة حالياً تطابق تخصصك (كيمياء وفيزياء ورياضيات). يمكنك قبول الطلب فوراً أو تقديم عرضك.
                  </p>
                </div>
                <span className="rounded-full bg-coral/10 px-3.5 py-1.5 text-xs font-black text-coral">
                  {leads.filter(l => l.status === "OPEN").length} فرصة متاحة الآن
                </span>
              </div>

              <div className="space-y-4">
                {leads.map((l) => (
                  <div key={l.id} className="rounded-3xl border border-sand bg-white p-6 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-[280px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="font-mono text-xs font-bold text-ink/60 bg-ink/5 px-2 py-0.5 rounded">
                            {l.id}
                          </code>
                          <span className="text-xs font-bold text-ink/40">{l.postedAt}</span>
                          <span className={"rounded-full px-2.5 py-0.5 text-xs font-black " + (
                            l.urgency === "ASAP" ? "bg-red-500 text-white" :
                            l.urgency === "HIGH" ? "bg-orange-500 text-white" : "bg-sun/20 text-sun"
                          )}>
                            {l.urgency === "ASAP" ? "عاجل جداً 🚨" : `أولوية: ${l.urgency}`}
                          </span>
                          <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-bold text-ink/70">
                            {l.mode === "ONLINE" ? "💻 أونلاين" : "🏫 حضوري"}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-ink">
                          {l.subject} — <span className="text-coral font-bold">{l.topic}</span>
                        </h3>
                        <p className="text-xs text-ink/70 leading-relaxed max-w-2xl">
                          {l.description}
                        </p>
                        <div className="text-xs text-ink/60 font-semibold pt-1">
                          الطالب: <strong>{l.student}</strong> ({l.university} — {l.faculty})
                        </div>
                      </div>

                      <div className="text-left space-y-2 shrink-0">
                        <div className="text-xs font-bold text-ink/40">الميزانية المقترحة</div>
                        <div className="text-2xl font-black text-mint">{l.budget} ج.م</div>
                        <div className="text-[11px] text-ink/40">صافي ربحك: {Math.round(l.budget * 0.85)} ج.م</div>

                        {l.status === "OPEN" ? (
                          <>
                            <button
                              onClick={() => setAcceptModalLead(l)}
                              className="w-full rounded-full bg-coral px-5 py-2 text-xs font-black text-white hover:bg-coralDark transition shadow-md shadow-coral/25"
                            >
                              قبول الطلب وتأكيد الحجز ✓
                            </button>
                            <button
                              onClick={() => alert('تفاوض: سيتم إرسال عرض بسعر ووقت مختلف للطالب.')}
                              className="mt-2 w-full rounded-full border border-coral text-coral bg-white px-5 py-2 text-xs font-black hover:bg-coral/10 transition shadow-sm"
                            >
                              تفاوض (تعديل السعر/الميعاد) 🤝
                            </button>
                          </>
                        ) : (
                          <span className="inline-block rounded-full bg-mint/15 px-4 py-1.5 text-xs font-black text-mint">
                            تم قبول الطلب بنجاح ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: BOOKINGS & SCHEDULE
          ======================================================== */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <div>
                  <h1 className="text-2xl font-black text-ink">📅 جدول المواعيد والحجوزات المؤكدة</h1>
                  <p className="text-sm text-ink/60">
                    روابط القاعات المباشرة وبيانات الطلاب والتواصل السريع.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="rounded-3xl border border-sand bg-white p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac/15 text-lilac text-xl">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-ink text-base">{b.date}</span>
                          <span className={"rounded-full px-2.5 py-0.5 text-[11px] font-black " + (
                            b.status === "مؤكدة" ? "bg-mint/15 text-mint" :
                            b.status === "مكتملة" ? "bg-lilac/15 text-lilac" : "bg-sun/20 text-sun"
                          )}>
                            {b.status}
                          </span>
                        </div>
                        <div className="text-xs text-ink/60 mt-0.5">
                          مع الطالب: <strong>{b.student}</strong> ({b.phone}) — مادة: {b.subject}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left font-black text-sm text-coral pl-2">
                        {b.price} ج.م
                      </div>
                      {b.status === "مؤكدة" && (
                        <>
                          <button
                            onClick={() => handleCompleteBooking(b.id)}
                            className="rounded-full border border-sand bg-white px-3.5 py-2 text-xs font-bold text-ink hover:bg-sand"
                          >
                            إنهاء الجلسة ✓
                          </button>
                          <a
                            href={b.meetUrl ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-mint px-5 py-2 text-xs font-black text-white hover:brightness-95 shadow-sm"
                          >
                            دخول القاعة 🎥
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: EARNINGS & PAYOUTS
          ======================================================== */}
          {activeTab === "earnings" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-mint/40 bg-gradient-to-br from-mint/20 via-cream to-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-ink/60">محفظة المعلم المالية</span>
                    <h1 className="text-4xl font-black text-ink mt-1">{clearedEarnings} ج.م</h1>
                    <p className="text-xs text-ink/60 mt-1">
                      رصيد متاح للسحب الفوري عبر إنستاباي أو فودافون كاش أو حساب بنكي.
                    </p>
                  </div>
                  <button
                    onClick={() => setPayoutModalOpen(true)}
                    className="rounded-full bg-mint px-7 py-3 text-sm font-black text-white hover:brightness-95 shadow-lg shadow-mint/25 transition"
                  >
                    طلب سحب الأرباح الآن 💸
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
                  <span className="text-xs font-bold text-ink/50">إجمالي الأرباح المحصلة</span>
                  <div className="text-2xl font-black text-mint mt-1">{clearedEarnings + 2300} ج.م</div>
                  <p className="text-[11px] text-ink/40 mt-1">عن 127 جلسة ناجحة</p>
                </div>
                <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
                  <span className="text-xs font-bold text-ink/50">في انتظار التحصيل</span>
                  <div className="text-2xl font-black text-sun mt-1">{pendingEarnings} ج.م</div>
                  <p className="text-[11px] text-ink/40 mt-1">جلسات مجدولة قيد الإتمام</p>
                </div>
                <div className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
                  <span className="text-xs font-bold text-ink/50">عمولة المنصة المقتطعة</span>
                  <div className="text-2xl font-black text-coral mt-1">%15</div>
                  <p className="text-[11px] text-ink/40 mt-1">ثابتة تشمل حماية الدفع والدعم</p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: REVIEWS & TESTIMONIALS
          ======================================================== */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-ink">⭐ تقييمات الطلاب ورأيهم في الشرح</h1>
                    <p className="text-sm text-ink/60">بناءً على 95 جلسة مكتملة وتقييم معتمد.</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-sun/20 px-4 py-2">
                    <Star className="h-6 w-6 fill-sun text-sun" />
                    <span className="text-2xl font-black text-ink">4.8</span>
                    <span className="text-xs text-ink/50">من 5</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { student: "سارة عبدالله", sub: "كيمياء عضوية", rating: 5, comment: "شرح ممتاز جداً وميكانيزم التفاعلات بقى واضح معايا لأول مرة، شكراً دكتور!" },
                  { student: "عمر هاني", sub: "فيزياء هندسية", rating: 5, comment: "حلينا الشيت كامل والمسائل المعقدة في ساعة ونص بس." },
                  { student: "منة الشريف", sub: "كيمياء مراجعة", rating: 4, comment: "دكتور صبور وبيجاوب على كل الأسئلة بالتفصيل." },
                ].map((r, i) => (
                  <div key={i} className="rounded-3xl border border-sand bg-white p-5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-ink text-sm">{r.student}</span>
                      <span className="text-sun font-bold">{"★".repeat(r.rating)}</span>
                    </div>
                    <p className="text-xs text-ink/70 leading-relaxed font-semibold">
                      “{r.comment}”
                    </p>
                    <div className="text-[11px] font-bold text-coral">مادة: {r.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: PROFILE & PRICING CONFIG
          ======================================================== */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm space-y-5">
                <h1 className="text-2xl font-black text-ink">⚙️ إعدادات التسعير والمواد والتواجد</h1>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">الحد الأدنى لسعر الجلسة (ج.م)</label>
                    <input
                      type="number"
                      defaultValue={200}
                      className="w-full rounded-2xl border border-sand p-3 text-sm font-bold outline-none focus:border-mint"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">الحد الأقصى لسعر الجلسة (ج.م)</label>
                    <input
                      type="number"
                      defaultValue={450}
                      className="w-full rounded-2xl border border-sand p-3 text-sm font-bold outline-none focus:border-mint"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">المواد التي تدرسها</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["الكيمياء العضوية", "الفيزياء الهندسية", "رياضيات 1 & 2", "الكيمياء الحيوية", "الاحصاء"].map((s) => (
                      <span key={s} className="rounded-full bg-cream border border-sand px-3.5 py-1.5 text-xs font-bold text-ink">
                        {s} ✓
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => triggerToast("✅ تم حفظ وتحديث الملف الأكاديمي والتسعير بنجاح")}
                  className="rounded-full bg-ink px-6 py-2.5 text-xs font-black text-cream hover:bg-ink/90"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          )}

          
        </section>
      </div>

      {/* ========================================================
          MODAL: ACCEPT LEAD CONFIRMATION
      ======================================================== */}
      {acceptModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-sand bg-white p-6 shadow-2xl space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/15 text-3xl">
              🎯
            </div>
            <div>
              <h3 className="text-xl font-black text-ink">قبول طلب {acceptModalLead.student}</h3>
              <p className="text-xs text-ink/60 mt-1">{acceptModalLead.subject} — {acceptModalLead.topic}</p>
            </div>

            <div className="rounded-2xl bg-cream/50 p-4 text-xs space-y-1.5 text-right">
              <div className="flex justify-between">
                <span className="text-ink/60">الميزانية الإجمالية:</span>
                <strong className="text-ink">{acceptModalLead.budget} ج.م</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">عمولة المنصة (%15):</span>
                <strong className="text-coral">-{Math.round(acceptModalLead.budget * 0.15)} ج.م</strong>
              </div>
              <div className="flex justify-between border-t border-sand pt-1.5 text-sm">
                <span className="font-bold text-ink">صافي ربحك:</span>
                <strong className="text-mint font-black">{Math.round(acceptModalLead.budget * 0.85)} ج.م</strong>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setAcceptModalLead(null)}
                className="rounded-full border border-sand px-5 py-2 text-xs font-bold text-ink/70"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmAcceptLead}
                className="rounded-full bg-coral px-6 py-2 text-xs font-black text-white hover:bg-coralDark shadow-md shadow-coral/30"
              >
                تأكيد القبول وبدء الجلسة ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PAYOUT WITHDRAWAL
      ======================================================== */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handlePayoutSubmit} className="w-full max-w-md rounded-3xl border border-sand bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-ink">طلب سحب الأرباح</h3>
            <p className="text-xs text-ink/60">الرصيد المتاح للسحب: {clearedEarnings} ج.م</p>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">المبلغ المطلوب سحبه (ج.م)</label>
              <input
                type="number"
                min={100}
                max={clearedEarnings}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                className="w-full rounded-2xl border border-sand p-3 text-base font-black text-mint outline-none focus:border-mint"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">طريقة التحويل المفضلة</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "instapay", label: "إنستاباي" },
                  { id: "vodafone", label: "فودافون كاش" },
                  { id: "bank", label: "حساب بنكي" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayoutMethod(m.id as any)}
                    className={
                      "rounded-xl border p-2 text-xs font-bold transition " +
                      (payoutMethod === m.id
                        ? "border-mint bg-mint/15 text-mint font-black"
                        : "border-sand text-ink/70 hover:bg-cream")
                    }
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                {payoutMethod === "instapay" ? "عنوان الدفع اللحظي (IPA) أو رقم إنستاباي" : payoutMethod === "vodafone" ? "رقم محفظة فودافون كاش" : "رقم الحساب البنكي / IBAN"}
              </label>
              <input
                type="text"
                required
                placeholder={payoutMethod === "instapay" ? "username@instapay" : "010xxxxxxxx"}
                value={payoutAccount}
                onChange={(e) => setPayoutAccount(e.target.value)}
                className="w-full rounded-2xl border border-sand p-3 text-xs outline-none focus:border-mint"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayoutModalOpen(false)}
                className="rounded-full border border-sand px-4 py-2 text-xs font-bold text-ink/70"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-full bg-mint px-6 py-2 text-xs font-black text-white hover:brightness-95 shadow"
              >
                تأكيد التحويل الآن 💸
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
