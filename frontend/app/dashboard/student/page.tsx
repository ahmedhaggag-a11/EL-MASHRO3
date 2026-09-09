"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Award,
  LogOut,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Star,
  Video,
  Send,
  PlusCircle,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Gift,
  HelpCircle,
  FileQuestion,
  Brain,
  Target,
  Rocket,
  Timer,
  Mic,
} from "lucide-react";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/theme/ThemeToggle";

interface TutorMatch {
  tutorId: string;
  tutorName: string;
  avatar: string;
  title: string;
  rating: number;
  sessions: number;
  price: number;
}

interface RequestItem {
  id: string;
  subject: string;
  topic: string;
  description: string;
  mode: "ONLINE" | "IN_PERSON";
  budget: number;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "ASAP";
  status: "DRAFT" | "MATCHING" | "TUTOR_SELECTED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "STUDENT_RATED" | "DISPUTED";
  statusLabel: string;
  preferredTime: string;
  matches?: TutorMatch[];
  selectedTutor?: {
    name: string;
    phone: string;
    rating: number;
    meetingUrl?: string;
  };
  reviewGiven?: {
    rating: number;
    comment: string;
  };
}

interface ChatMessage {
  id: string;
  sender: "student" | "tutor";
  text: string;
  time: string;
}

const INITIAL_REQUESTS: RequestItem[] = [];
const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];

export default function StudentDashboardPage() {
  const [activeNav, setActiveNav] = useState<
    "overview" | "requests" | "rewards"
  >("overview");
  const [requests, setRequests] = useState<RequestItem[]>(INITIAL_REQUESTS);
  const [points, setPoints] = useState<number>(0);
  const [selectedReqForDetail, setSelectedReqForDetail] = useState<RequestItem | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputMsg, setInputMsg] = useState("");

  // Rate Modal state
  const [ratingReq, setRatingReq] = useState<RequestItem | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Dispute Modal state
  const [disputeReq, setDisputeReq] = useState<RequestItem | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function triggerToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  // Select Tutor from matches
  function handleSelectTutor(reqId: string, tutor: TutorMatch) {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          return {
            ...r,
            status: "CONFIRMED",
            statusLabel: "مؤكدة — تم حجز الجلسة بنجاح ✅",
            selectedTutor: {
              name: tutor.tutorName,
              phone: "",
              rating: tutor.rating,
            },
          };
        }
        return r;
      })
    );
    triggerToast(`🎉 مبروك! تم اختيار ${tutor.tutorName} وتأكيد الجلسة ومشاركتك رابط الحضور.`);
  }

  // Submit Review
  function handleSubmitReview() {
    if (!ratingReq) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === ratingReq.id
          ? {
              ...r,
              status: "STUDENT_RATED",
              statusLabel: "تم التقييم بنجاح ⭐",
              reviewGiven: { rating: ratingStars, comment: reviewComment },
            }
          : r
      )
    );
    setPoints((p) => p + 20);
    triggerToast("⭐ شكراً لتقييمك! تمت إضافة 20 نقطة لمكافآتك 🎁");
    setRatingReq(null);
    setReviewComment("");
  }

  // Open Dispute
  function handleOpenDispute() {
    if (!disputeReq) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === disputeReq.id
          ? { ...r, status: "DISPUTED", statusLabel: "في نزاع — قيد مراجعة الإدارة ⚠️" }
          : r
      )
    );
    triggerToast("⚠️ تم تصعيد الشكوى لإدارة فك زنقة وسيتم التواصل معك وحفظ حقك المالي.");
    setDisputeReq(null);
    setDisputeReason("");
  }

  // Send Message
  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "student",
      text: inputMsg.trim(),
      time: "الآن",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMsg("");

  }

  // Redeem Reward
  function handleRedeemReward(cost: number, rewardTitle: string) {
    if (points < cost) {
      triggerToast("⚠️ رصيد نقاطك غير كافٍ لاستبدال هذه المكافأة");
      return;
    }
    setPoints((p) => p - cost);
    triggerToast(`🎁 مبروك! استبدلت ${rewardTitle} بنجاح وتم تفعيل الخصم.`);
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
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-coralDark text-xl text-white shadow-md">
                🎓
              </div>
              <div>
                <span className="text-base font-black text-ink">فك زنقة</span>
                <span className="mr-2 rounded-md bg-coral/15 px-2 py-0.5 text-[11px] font-black text-coral">
                  بوابة الطالب (Student Portal)
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-bold text-ink/50 md:inline">تبديل الواجهة للتجربة:</span>
            <Link
              href="/dashboard/tutor"
              className="rounded-xl border border-sand bg-white px-3 py-1.5 text-xs font-bold text-mint transition hover:bg-mint/10"
            >
              👨‍🏫 واجهة المدرس
            </Link>
            <Link
              href="/dashboard/admin"
              className="rounded-xl border border-sand dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-lilac transition hover:bg-lilac/10"
            >
              👑 واجهة الإدارة
            </Link>
            <ThemeToggle />
            <Link href="/" className="rounded-xl bg-coral px-3 py-1.5 text-xs font-bold text-white transition hover:bg-coralDark shadow-sm shadow-coral/30">الرئيسية</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8 lg:py-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-20 space-y-3">
            <div className="rounded-3xl border border-sand bg-white p-3 shadow-sm">
              <div className="mb-3 px-3 pt-2 text-xs font-bold text-ink/40">حساب الطالب</div>
              <nav className="space-y-1">
                {[
                  { id: "overview", label: "نظرة عامة والدروس", icon: LayoutDashboard },
                  { id: "requests", label: "كل طلباتي واستغاثاتي", icon: FileText, count: requests.length },
                  
                  { id: "rewards", label: "نقاطي والمكافآت", icon: Award, badge: `${points} ⭐` },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id as any)}
                    className={
                      "flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-right text-sm font-bold transition " +
                      (activeNav === item.id
                        ? "bg-coral text-white shadow-md shadow-coral/30"
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
                          (activeNav === item.id ? "bg-white/20 text-white" : "bg-coral/10 text-coral")
                        }
                      >
                        {item.count}
                      </span>
                    )}
                    {item.badge && (
                      <span className="rounded-full bg-sun/25 px-2.5 py-0.5 text-[11px] font-black text-ink">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              
            </div>

            {/* Quick Balance Widget */}
            <div className="rounded-3xl border border-sun/40 bg-gradient-to-br from-sun/20 to-cream p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-ink/60">رصيد نقاطك الحالي</div>
                  <div className="text-2xl font-black text-ink">{points} نقطة</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sun text-xl">
                  🎁
                </div>
              </div>
              <button
                onClick={() => setActiveNav("rewards")}
                className="mt-3 w-full rounded-full bg-white py-1.5 text-xs font-black text-ink shadow-sm hover:bg-sand transition"
              >
                استبدال المكافآت →
              </button>
            </div>
          </div>
        </aside>

        {/* Content Body */}
        <section className="flex-1 space-y-6">
          {/* ========================================================
              NAV 1: OVERVIEW & ACTIVE SESSIONS
          ======================================================== */}
          {activeNav === "overview" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <div>
                  <span className="rounded-full bg-coral/15 px-3 py-1 text-xs font-black text-coral">
                    أهلاً بك يا أحمد 👋
                  </span>
                  <h1 className="mt-2 text-2xl font-black text-ink">كل زنقاتك الدراسية مفكوكة هنا</h1>
                  <p className="mt-1 text-sm text-ink/60">
                    تابع جلساتك المحجوزة، اختر من بين أفضل المدرسين المرشحين، أو انشر زنقة جديدة.
                  </p>
                </div>
                <Link
                  href="/requests/new"
                  className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-black text-white shadow-lg shadow-coral/30 hover:bg-coralDark transition"
                >
                  <Sparkles className="h-4 w-4" />
                  انشر طلب جديد الآن
                </Link>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "طلبات منشورة", value: requests.length, icon: "📝", color: "from-coral to-coralDark" },
                  { label: "جلسات مؤكدة وقادمة", value: requests.filter(r => r.status === "CONFIRMED").length, icon: "📅", color: "from-mint to-green-600" },
                  { label: "جلسات مكتملة", value: requests.filter(r => r.status === "COMPLETED" || r.status === "STUDENT_RATED").length, icon: "✅", color: "from-lilac to-indigo-600" },
                  { label: "نقاط المكافآت", value: points, icon: "⭐", color: "from-sun to-orange-500" },
                ].map((s, i) => (
                  <div key={i} className="rounded-3xl border border-sand bg-white p-5 shadow-sm">
                    <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-md text-lg`}>
                      {s.icon}
                    </div>
                    <div className="text-3xl font-black text-ink">{s.value}</div>
                    <div className="mt-1 text-xs font-bold text-ink/60">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Urgently Matching Requests / Action Needed */}
              {requests.filter(r => r.status === "MATCHING").length > 0 && (
                <div className="rounded-3xl border-2 border-sun/50 bg-gradient-to-br from-sun/15 to-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sun text-lg">🎯</div>
                      <div>
                        <h2 className="text-lg font-black text-ink">مدرسين بانتظار اختيارك فوراً!</h2>
                        <p className="text-xs text-ink/60">تم ترشيح أفضل مدرسي الكيمياء وفق أعلى تقييم وسرعة استجابة.</p>
                      </div>
                    </div>
                  </div>

                  {requests.filter(r => r.status === "MATCHING").map(req => (
                    <div key={req.id} className="rounded-2xl border border-sand bg-white p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand pb-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-coral">{req.id}</span>
                          <h3 className="text-base font-black text-ink">{req.subject} — {req.topic}</h3>
                        </div>
                        <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
                          🚨 أولوية عاجلة
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {req.matches?.map((m) => (
                          <div
                            key={m.tutorId}
                            className="rounded-2xl border border-sand/80 bg-cream/30 p-4 flex flex-col justify-between space-y-3 hover:border-coral transition"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-3xl">{m.avatar}</span>
                                <span className="flex items-center gap-1 rounded-full bg-sun/20 px-2 py-0.5 text-xs font-black text-ink">
                                  <Star className="h-3 w-3 fill-sun text-sun" />
                                  {m.rating}
                                </span>
                              </div>
                              <div className="mt-2 font-black text-ink text-sm">{m.tutorName}</div>
                              <div className="text-[11px] text-ink/60 leading-snug">{m.title}</div>
                              <div className="mt-1 text-[11px] font-bold text-mint">{m.sessions} جلسة منجزة</div>
                            </div>

                            <div className="pt-2 border-t border-sand/60 flex items-center justify-between">
                              <span className="font-black text-coral text-sm">{m.price} ج.م</span>
                              <button
                                onClick={() => handleSelectTutor(req.id, m)}
                                className="rounded-full bg-coral px-4 py-1.5 text-xs font-black text-white hover:bg-coralDark transition shadow-sm"
                              >
                                اختيار المدرس ✓
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirmed Active Session Banner */}
              {requests.filter(r => r.status === "CONFIRMED").map(req => (
                <div key={req.id} className="rounded-3xl border border-mint/40 bg-gradient-to-br from-mint/15 to-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-white text-2xl shadow">
                        <Video className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-mint/20 px-2.5 py-0.5 text-[11px] font-black text-mint">
                            جلسة مؤكدة جاهزة
                          </span>
                          <span className="text-xs font-bold text-ink/40">{req.preferredTime}</span>
                        </div>
                        <h3 className="text-lg font-black text-ink mt-0.5">{req.subject} — مع {req.selectedTutor?.name}</h3>
                        <p className="text-xs text-ink/60">تأكد من فتح الميكروفون وتجهيز الأسئلة قبل الموعد بـ 5 دقائق.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      
                      <a
                        href={req.selectedTutor?.meetingUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-mint px-6 py-2.5 text-xs font-black text-white hover:brightness-95 transition shadow-md shadow-mint/20"
                      >
                        دخول قاعة الجلسة الآن 🎥
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================
              NAV 2: ALL STUDENT REQUESTS (SHOWED IN DETAIL)
          ======================================================== */}
          {activeNav === "requests" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <div>
                  <h1 className="text-2xl font-black text-ink">📋 جميع طلباتي واستغاثاتي الأكاديمية</h1>
                  <p className="text-sm text-ink/60">
                    تتبع حالة كل طلب من مرحلة المطابقة حتى انتهاء الجلسة والتقييم.
                  </p>
                </div>
                <Link
                  href="/requests/new"
                  className="rounded-full bg-coral px-5 py-2.5 text-xs font-black text-white hover:bg-coralDark transition shadow"
                >
                  + انشر طلب جديد
                </Link>
              </div>

              <div className="space-y-4">
                {requests.map((r) => (
                  <div key={r.id} className="rounded-3xl border border-sand bg-white p-6 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs font-bold text-ink/60 bg-ink/5 px-2 py-0.5 rounded">
                            {r.id}
                          </code>
                          <span className={"rounded-full px-3 py-0.5 text-xs font-black " + (
                            r.status === "CONFIRMED" ? "bg-mint/20 text-mint" :
                            r.status === "COMPLETED" ? "bg-lilac/20 text-lilac" :
                            r.status === "STUDENT_RATED" ? "bg-mint/20 text-mint" :
                            r.status === "DISPUTED" ? "bg-red-100 text-red-600" : "bg-sun/20 text-sun"
                          )}>
                            {r.statusLabel}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-ink mt-1">{r.subject} — {r.topic}</h3>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-ink/40">الميزانية</div>
                        <div className="text-lg font-black text-coral">{r.budget} ج.م</div>
                      </div>
                    </div>

                    <p className="text-xs text-ink/70 leading-relaxed">
                      {r.description}
                    </p>

                    {/* Visual Progress Steps */}
                    <div className="py-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-ink/50 mb-1">
                        <span>1. نشر الطلب</span>
                        <span>2. ترشيح المدرسين</span>
                        <span>3. تأكيد الحجز</span>
                        <span>4. الشرح المباشر</span>
                        <span>5. التقييم والمكافأة</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-sand overflow-hidden">
                        <div
                          className="h-full bg-coral transition-all duration-500"
                          style={{
                            width:
                              r.status === "DRAFT" ? "20%" :
                              r.status === "MATCHING" ? "40%" :
                              r.status === "CONFIRMED" ? "60%" :
                              r.status === "IN_PROGRESS" ? "80%" : "100%",
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Footers */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-sand/60">
                      <div className="text-xs text-ink/60">
                        {r.selectedTutor ? (
                          <span>المدرس المعتمد: <strong className="text-ink">{r.selectedTutor.name}</strong></span>
                        ) : (
                          <span>المدرس: <strong className="text-sun">جاري المطابقة</strong></span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {r.status === "COMPLETED" && (
                          <button
                            onClick={() => setRatingReq(r)}
                            className="rounded-full bg-sun px-4 py-1.5 text-xs font-black text-ink hover:brightness-95 transition shadow-sm"
                          >
                            ⭐ قيّم المدرس واكسب +20 نقطة
                          </button>
                        )}

                        

                        {r.status !== "DISPUTED" && (
                          <button
                            onClick={() => setDisputeReq(r)}
                            className="rounded-full border border-sand text-ink/50 px-3 py-1 text-[11px] font-bold hover:text-red-500 hover:border-red-200 transition"
                          >
                            إبلاغ عن مشكلة
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              NAV 4: REWARDS & POINTS STORE
          ======================================================== */}
          {activeNav === "rewards" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-sun/40 bg-gradient-to-br from-sun/20 via-cream to-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-black text-ink/60">متجر المكافآت الحصري</span>
                    <h1 className="text-3xl font-black text-ink mt-1">{points} نقطة متاحة</h1>
                    <p className="text-xs text-ink/60 mt-1">
                      كلما أكملت جلسات وقيّمت المدرسين، كلما حصلت على نقاط تستبدلها بخصومات وكورسات مجانية!
                    </p>
                  </div>
                  <div className="text-5xl">🎁</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "كوبون خصم 50 ج.م",
                    desc: "خصم فوري يطبق على جلستك القادمة مع أي مدرس.",
                    cost: 100,
                    icon: "🎟️",
                    tag: "الأكثر طلباً",
                  },
                  {
                    title: "تذكرة ورشة عمل مجانية",
                    desc: "حضور أي ورشة عمل أونلاين لمراجعة ليلة الامتحان.",
                    cost: 150,
                    icon: "📚",
                    tag: "موصى به",
                  },
                  {
                    title: "مراجعة كويز مع مدرس مجاناً",
                    desc: "جلسة سريعة لمدة 20 دقيقة لحل أي نموذج امتحان.",
                    cost: 200,
                    icon: "📝",
                    tag: "VIP",
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-3xl border border-sand bg-white p-5 flex flex-col justify-between space-y-4 shadow-sm">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{item.icon}</span>
                        <span className="rounded-full bg-sun/20 px-2.5 py-0.5 text-[11px] font-black text-ink">
                          {item.tag}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-ink mt-3">{item.title}</h3>
                      <p className="text-xs text-ink/60 mt-1 leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-sand flex items-center justify-between">
                      <span className="text-sm font-black text-coral">{item.cost} نقطة</span>
                      <button
                        onClick={() => handleRedeemReward(item.cost, item.title)}
                        className="rounded-full bg-ink px-4 py-1.5 text-xs font-black text-cream hover:bg-coral transition"
                      >
                        استبدال الآن
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      </div>

      {/* ========================================================
          MODAL: RATE TUTOR & EARN POINTS
      ======================================================== */}
      {ratingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-sand bg-white p-6 shadow-2xl space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sun/20 text-3xl">
              ⭐
            </div>
            <div>
              <h3 className="text-xl font-black text-ink">تقييم الجلسة مع {ratingReq.selectedTutor?.name}</h3>
              <p className="text-xs text-ink/60 mt-1">مادة: {ratingReq.subject}</p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRatingStars(s)}
                  className="text-3xl transition hover:scale-110"
                >
                  <Star className={`h-8 w-8 ${s <= ratingStars ? "fill-sun text-sun" : "text-sand"}`} />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="اكتب رأيك الصادق في أسلوب الشرح والتوضيح (اختياري)..."
              className="w-full rounded-2xl border border-sand p-3 text-xs outline-none focus:border-coral text-right"
            />

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setRatingReq(null)}
                className="rounded-full border border-sand px-5 py-2 text-xs font-bold text-ink/70"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmitReview}
                className="rounded-full bg-coral px-6 py-2 text-xs font-black text-white hover:bg-coralDark shadow-md shadow-coral/30"
              >
                إرسال التقييم واستلام 20 نقطة 🎁
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================
          MODAL: OPEN DISPUTE
      ======================================================== */}
      {disputeReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-sand bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-black text-ink">إبلاغ عن مشكلة بالجلسة</h3>
            </div>
            <p className="text-xs text-ink/60">
              يرجى كتابة المشكلة التي واجهتك (عدم حضور المدرس، انقطاع الاتصال، الخ) لفحصها من قبل الإدارة:
            </p>
            <textarea
              rows={3}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="اكتب تفاصيل الشكوى..."
              className="w-full rounded-2xl border border-sand p-3 text-xs outline-none focus:border-red-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDisputeReq(null)}
                className="rounded-full border border-sand px-4 py-2 text-xs font-bold text-ink/70"
              >
                إلغاء
              </button>
              <button
                onClick={handleOpenDispute}
                className="rounded-full bg-red-500 px-5 py-2 text-xs font-black text-white hover:bg-red-600 shadow"
              >
                إرسال الشكوى للإدارة
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
