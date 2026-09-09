"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  FileWarning,
  Settings as SettingsIcon,
  Shield,
  LogOut,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  HelpCircle,
  ChevronDown,
  RefreshCw,
  Video,
  Sparkles,
  Brain,
} from "lucide-react";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/theme/ThemeToggle";

interface TeacherApp {
  id: string;
  name: string;
  email: string;
  phone: string;
  university: string;
  faculty: string;
  experience: string;
  introVideoUrl?: string;
  preferredMode: "ONLINE" | "IN_PERSON" | "BOTH";
  status: "PENDING" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "ACCEPTED" | "REJECTED";
  statusLabel: string;
  submittedAt: string;
}

interface StudentReq {
  id: string;
  studentName: string;
  studentEmail: string;
  university: string;
  faculty: string;
  subject: string;
  topic: string;
  description: string;
  mode: "ONLINE" | "IN_PERSON";
  budget: number;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "ASAP";
  status: "DRAFT" | "PUBLISHED" | "MATCHING" | "TUTOR_SELECTED" | "PAYMENT_PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "STUDENT_RATED" | "DISPUTED" | "CANCELLED";
  selectedTutor?: string;
  createdAt: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "STUDENT" | "TUTOR" | "ADMIN";
  isActive: boolean;
  joinedAt: string;
}

interface PayoutItem {
  id: string;
  tutorName: string;
  tutorEmail: string;
  amountEGP: number;
  paymentMethod: string;
  accountDetails: string;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  createdAt: string;
}

const INITIAL_APPS: TeacherApp[] = [];
const INITIAL_REQUESTS: StudentReq[] = [];
const INITIAL_USERS: UserItem[] = [];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "tutor-apps" | "requests" | "users" | "disputes" | "settings" | "workshops" | "payouts">("overview");
  const [apps, setApps] = useState<TeacherApp[]>(INITIAL_APPS);
  const [requests, setRequests] = useState<StudentReq[]>(INITIAL_REQUESTS);
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);

  // Filter states
  const [appFilter, setAppFilter] = useState<string>("ALL");
  const [reqStatusFilter, setReqStatusFilter] = useState<string>("ALL");
  const [reqSearch, setReqSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");

  // Modals & Inspect
  const [selectedApp, setSelectedApp] = useState<TeacherApp | null>(null);
  const [rejectionModalApp, setRejectionModalApp] = useState<TeacherApp | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedReq, setSelectedReq] = useState<StudentReq | null>(null);

  // Settings state
  const [commissionPct, setCommissionPct] = useState(15);
  const [inPersonSurcharge, setInPersonSurcharge] = useState(5);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  function triggerToast(msg: string) {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3000);
  }

  useEffect(() => {
    async function loadAdminData() {
      const token = localStorage.getItem("fz_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
      const headers = { Authorization: `Bearer ${token}` };
      const get = (path: string) =>
        fetch(`${apiBase}/api/v1/admin/${path}`, { headers }).then(async (response) => {
          if (!response.ok) throw new Error(`Admin request failed: ${path}`);
          return response.json();
        });

      try {
        const [applications, allRequests, allUsers, disputes, commission, payoutRequests] = await Promise.all([
          get("tutor-applications"),
          get("requests"),
          get("users"),
          get("disputes"),
          get("settings/commission"),
          fetch(`${apiBase}/api/v1/payouts`, { headers }).then(async (response) => {
            if (!response.ok) throw new Error("Admin payouts request failed");
            return response.json();
          }),
        ]);

        setApps(applications.map((application: any): TeacherApp => ({
          id: application.id,
          name: application.user?.fullName ?? "مدرس بدون اسم",
          email: application.user?.email ?? "",
          phone: application.user?.phone ?? "",
          university: application.universityName ?? "غير محدد",
          faculty: application.facultyName ?? "غير محدد",
          experience: application.experienceSummary ?? "لم يضف خبرة بعد",
          introVideoUrl: application.introVideoUrl ?? undefined,
          preferredMode: application.preferredMode,
          status: application.status,
          statusLabel: application.status === "PENDING"
            ? "قيد المراجعة"
            : application.status === "UNDER_REVIEW"
              ? "تحت المراجعة"
              : application.status === "ACCEPTED"
                ? "مقبول ومعتمد"
                : application.status === "REJECTED"
                  ? "مرفوض"
                  : "يحتاج تعديلات",
          submittedAt: new Date(application.createdAt).toLocaleString("ar-EG"),
        })));

        setRequests(allRequests.map((request: any): StudentReq => ({
          id: request.id,
          studentName: request.student?.fullName ?? "طالب غير معروف",
          studentEmail: request.student?.email ?? "",
          university: request.university?.name ?? "غير محددة",
          faculty: request.faculty?.name ?? "غير محددة",
          subject: request.subject?.name ?? "مادة غير محددة",
          topic: request.topic?.name ?? "موضوع غير محدد",
          description: request.description,
          mode: request.teachingMode,
          budget: request.budgetEGP ?? 0,
          urgency: request.urgency,
          status: request.status,
          selectedTutor: request.booking?.tutor?.user?.fullName,
          createdAt: new Date(request.createdAt).toLocaleString("ar-EG"),
        })));

        setUsers(allUsers.map((user: any): UserItem => {
          const roles = user.roles?.map((item: any) => item.role) ?? [];
          const role = roles.includes("ADMIN") ? "ADMIN" : roles.includes("TUTOR") ? "TUTOR" : "STUDENT";
          return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            phone: user.phone ?? "",
            role,
            isActive: user.isActive,
            joinedAt: new Date(user.createdAt).toLocaleString("ar-EG"),
          };
        }));

        setPayouts(payoutRequests.map((payout: any): PayoutItem => ({
          id: payout.id,
          tutorName: payout.tutor?.fullName ?? "مدرس غير معروف",
          tutorEmail: payout.tutor?.email ?? "",
          amountEGP: payout.amountEGP,
          paymentMethod: payout.paymentMethod,
          accountDetails: payout.accountDetails,
          status: payout.status,
          createdAt: new Date(payout.createdAt).toLocaleString("ar-EG"),
        })));

        setCommissionPct(commission.commissionPercent ?? 15);
        setInPersonSurcharge(commission.inPersonSurchargePct ?? 5);
        if (disputes.length > 0) {
          setRequests((current) => {
            const disputeIds = new Set(disputes.map((item: any) => item.id));
            return current.map((request) => disputeIds.has(request.id)
              ? { ...request, status: "DISPUTED" }
              : request);
          });
        }
      } catch {
        triggerToast("تعذر تحميل بيانات الإدارة من السيرفر");
      }
    }

    loadAdminData();
  }, []);

  async function updatePayoutStatus(id: string, status: "APPROVED" | "REJECTED") {
    const token = localStorage.getItem("fz_token");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/v1/payouts/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      triggerToast("تعذر تحديث حالة الفاتورة");
      return;
    }

    setPayouts((current) => current.map((payout) => payout.id === id ? { ...payout, status } : payout));
    triggerToast(status === "APPROVED" ? "✅ تمت الموافقة على فاتورة المدرس" : "تم رفض فاتورة المدرس");
  }

  // Teacher application actions
  function handleAcceptTeacher(appId: string) {
    setApps((prev) =>
      prev.map((a) =>
        a.id === appId
          ? { ...a, status: "ACCEPTED", statusLabel: "مقبول ومعتمد" }
          : a
      )
    );
    // Grant role in users state if exists
    const app = apps.find((a) => a.id === appId);
    if (app) {
      setUsers((prev) => {
        const found = prev.find((u) => u.email === app.email);
        if (found) {
          return prev.map((u) => (u.id === found.id ? { ...u, role: "TUTOR" } : u));
        } else {
          return [
            ...prev,
            {
              id: `USR-${Date.now().toString().slice(-3)}`,
              name: app.name,
              email: app.email,
              phone: app.phone,
              role: "TUTOR",
              isActive: true,
              joinedAt: new Date().toISOString().slice(0, 10),
            },
          ];
        }
      });
    }
    triggerToast(`✅ تم قبول المدرس وتفعيل حسابه ومنحه رول TUTOR بنجاح!`);
    setSelectedApp(null);
  }

  function handleRejectTeacher(appId: string, reason: string) {
    setApps((prev) =>
      prev.map((a) =>
        a.id === appId
          ? { ...a, status: "REJECTED", statusLabel: `مرفوض: ${reason || "عدم استيفاء الشروط"}` }
          : a
      )
    );
    triggerToast(`❌ تم رفض طلب الانضمام وإرسال الملاحظات للمتقدم.`);
    setRejectionModalApp(null);
    setRejectionReason("");
    setSelectedApp(null);
  }

  function handleRequestChanges(appId: string) {
    setApps((prev) =>
      prev.map((a) =>
        a.id === appId
          ? { ...a, status: "CHANGES_REQUESTED", statusLabel: "مطلوب تعديلات وإثبات إضافي" }
          : a
      )
    );
    triggerToast(`⚠️ تم إرسال إشعار للمدرس لطلب تعديل وتوضيح مستندات الخبرة.`);
    setSelectedApp(null);
  }

  // Request status override
  function handleOverrideRequestStatus(reqId: string, newStatus: StudentReq["status"]) {
    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r))
    );
    triggerToast(`🔄 تم تعديل حالة الطلب ${reqId} إلى ${newStatus}`);
    if (selectedReq?.id === reqId) {
      setSelectedReq((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  }

  // User actions
  function handleToggleUserActive(userId: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
    const u = users.find((x) => x.id === userId);
    triggerToast(
      u?.isActive
        ? `⛔ تم تجميد حساب المستخدم ${u.name}`
        : `✅ تم إعادة تنشيط حساب ${u?.name}`
    );
  }

  function handleChangeUserRole(userId: string, newRole: "STUDENT" | "TUTOR" | "ADMIN") {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    triggerToast(`👑 تم تغيير رول المستخدم إلى ${newRole}`);
  }

  // Dispute resolution
  function handleResolveDispute(reqId: string, resolution: "REFUND" | "PAY_TUTOR" | "SPLIT") {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? { ...r, status: resolution === "REFUND" ? "CANCELLED" : "COMPLETED" }
          : r
      )
    );
    const labels = {
      REFUND: "تم رد المبلغ كاملاً لحساب الطالب وإلغاء الجلسة.",
      PAY_TUTOR: "تم تحويل المستحقات كاملة للمدرس وإغلاق النزاع.",
      SPLIT: "تمت التسوية بنسبة 50/50 بين الطرفين بنجاح.",
    };
    triggerToast(`⚖️ ${labels[resolution]}`);
  }

  // Filtered queries
  const filteredApps = apps.filter((a) => {
    if (appFilter === "ALL") return true;
    return a.status === appFilter;
  });

  const filteredRequests = requests.filter((r) => {
    const matchStatus = reqStatusFilter === "ALL" || r.status === reqStatusFilter;
    const matchSearch =
      !reqSearch ||
      r.subject.toLowerCase().includes(reqSearch.toLowerCase()) ||
      r.studentName.toLowerCase().includes(reqSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(reqSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredUsers = users.filter((u) => {
    const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
    const matchSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch);
    return matchRole && matchSearch;
  });

  const disputedRequests = requests.filter((r) => r.status === "DISPUTED");

  return (
    <main className="min-h-screen bg-cream font-arabic text-ink">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-2xl bg-ink px-5 py-3.5 text-sm font-bold text-cream shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-sun" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Top Demo Bar / Persona Switcher */}
      <header className="border-b border-sand bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-lilac to-indigo-700 text-xl text-white shadow-md">
                👑
              </div>
              <div>
                <span className="text-base font-black text-ink">فك زنقة</span>
                <span className="mr-2 rounded-md bg-lilac/15 px-2 py-0.5 text-[11px] font-black text-lilac">
                  بوابة الإدارة الشاملة (Admin Portal)
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
              <div className="mb-3 px-3 pt-2 text-xs font-bold text-ink/40">أقسام لوحة التحكم</div>
              <nav className="space-y-1">
                {[
                  { id: "overview", label: "نظرة عامة وإحصائيات", icon: LayoutDashboard, count: null },
                                    { id: "tutor-apps", label: "طلبات المدرسين (قبول/رفض)", icon: FileCheck2, count: apps.filter(a => a.status === "PENDING" || a.status === "UNDER_REVIEW").length },
                  { id: "requests", label: "كل طلبات الطلاب", icon: Search, count: requests.length },
                  { id: "users", label: "إدارة وصلاحيات المستخدمين", icon: Users, count: users.length },
                  { id: "disputes", label: "النزاعات والشكاوى", icon: FileWarning, count: disputedRequests.length },
                  { id: "workshops", label: "إدارة ورش العمل", icon: Video, count: null },
                  { id: "payouts", label: "فواتير المدرسين (السحب)", icon: DollarSign, count: null },
                  { id: "settings", label: "إعدادات المنصة والعمولة", icon: SettingsIcon, count: null },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={
                      "flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-right text-sm font-bold transition " +
                      (activeTab === item.id
                        ? "bg-lilac text-white shadow-md shadow-lilac/30"
                        : "text-ink/70 hover:bg-ink/5")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== null && item.count > 0 && (
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[11px] font-black " +
                          (activeTab === item.id ? "bg-white/20 text-white" : "bg-coral text-white")
                        }
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="rounded-3xl border border-mint/30 bg-mint/10 p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-mint" />
                <div>
                  <div className="text-xs font-black text-mint">صلاحيات كاملة مفعلة</div>
                  <div className="text-[11px] text-ink/60">أدمن المنصة · Super Admin</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 space-y-6">
          {/* ========================================================
              TAB 1: OVERVIEW & STATS
          ======================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <div>
                  <span className="rounded-full bg-lilac/15 px-3 py-1 text-xs font-black text-lilac">
                    لوحة المراقبة الحية 🚀
                  </span>
                  <h1 className="mt-2 text-2xl font-black text-ink">مرحباً بك في غرفة عمليات فك زنقة</h1>
                  <p className="mt-1 text-sm text-ink/60">
                    متابعة شاملة لطلبات انضمام المدرسين، طلبات الطلاب المفتوحة، النزاعات والعمليات المالية.
                  </p>
                </div>
                <button
                  onClick={() => triggerToast("تم تحديث البيانات لحظياً!")}
                  className="inline-flex items-center gap-2 rounded-full border border-sand bg-cream px-4 py-2.5 text-xs font-bold text-ink transition hover:bg-sand"
                >
                  <RefreshCw className="h-4 w-4" />
                  تحديث فوري
                </button>
              </div>

              {/* Stat Tiles */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "طلبات مدرسين بانتظار القرار", value: apps.filter(a => a.status === "PENDING" || a.status === "UNDER_REVIEW").length, icon: FileCheck2, color: "from-sun to-orange-500", onClick: () => setActiveTab("tutor-apps") },
                  { label: "طلبات طلاب نشطة حالياً", value: requests.filter(r => r.status !== "COMPLETED" && r.status !== "CANCELLED").length, icon: TrendingUp, color: "from-coral to-coralDark", onClick: () => setActiveTab("requests") },
                  { label: "إجمالي المستخدمين المسجلين", value: users.length, icon: Users, color: "from-lilac to-indigo-700", onClick: () => setActiveTab("users") },
                  { label: "نزاعات تحتاج تدخلك", value: disputedRequests.length, icon: AlertTriangle, color: "from-red-500 to-red-700", onClick: () => setActiveTab("disputes") },
                ].map((s, i) => (
                  <div
                    key={i}
                    onClick={s.onClick}
                    className="cursor-pointer rounded-3xl border border-sand bg-white p-5 shadow-sm transition hover:shadow-md hover:border-lilac/40"
                  >
                    <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-md`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div className="text-3xl font-black text-ink">{s.value}</div>
                    <div className="mt-1 text-xs font-bold text-ink/60">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Applications Card */}
                <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-black text-ink">📬 أحدث طلبات المدرسين</h2>
                    <button onClick={() => setActiveTab("tutor-apps")} className="text-xs font-bold text-lilac hover:underline">
                      عرض الكل ({apps.length}) ←
                    </button>
                  </div>
                  <div className="space-y-3">
                    {apps.slice(0, 3).map((app) => (
                      <div key={app.id} className="flex items-center justify-between rounded-2xl border border-sand/60 bg-cream/30 p-3.5">
                        <div>
                          <div className="font-bold text-ink">{app.name}</div>
                          <div className="text-xs text-ink/50">{app.faculty}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={"rounded-full px-2.5 py-1 text-[11px] font-black " + (
                            app.status === "ACCEPTED" ? "bg-mint/20 text-mint" :
                            app.status === "REJECTED" ? "bg-red-100 text-red-600" :
                            app.status === "CHANGES_REQUESTED" ? "bg-coral/20 text-coral" : "bg-sun/20 text-sun"
                          )}>
                            {app.statusLabel}
                          </span>
                          <button
                            onClick={() => { setSelectedApp(app); setActiveTab("tutor-apps"); }}
                            className="rounded-full bg-ink/5 p-2 text-ink hover:bg-lilac/10 hover:text-lilac"
                            title="فحص الطلب"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Student Requests Card */}
                <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-black text-ink">🚨 أحدث طلبات الطلاب (الزنقات)</h2>
                    <button onClick={() => setActiveTab("requests")} className="text-xs font-bold text-coral hover:underline">
                      عرض الكل ({requests.length}) ←
                    </button>
                  </div>
                  <div className="space-y-3">
                    {requests.slice(0, 3).map((req) => (
                      <div key={req.id} className="flex items-center justify-between rounded-2xl border border-sand/60 bg-cream/30 p-3.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink">{req.subject}</span>
                            {req.urgency === "ASAP" && (
                              <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">عاجل 🚨</span>
                            )}
                          </div>
                          <div className="text-xs text-ink/50">{req.studentName} · {req.budget} ج.م</div>
                        </div>
                        <button
                          onClick={() => { setSelectedReq(req); setActiveTab("requests"); }}
                          className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-bold text-ink/70 hover:bg-coral/10 hover:text-coral"
                        >
                          إدارة الطلب
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: TEACHER APPLICATIONS (ACCEPT / REJECT)
          ======================================================== */}
          {activeTab === "tutor-apps" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <div>
                  <h1 className="text-2xl font-black text-ink">👨‍🏫 مراجعة واعتماد طلبات المدرسين</h1>
                  <p className="text-sm text-ink/60">
                    يمكنك قبول المعلم، رفض الطلب مع توضيح السبب، أو طلب مستندات وفيديو شرح إضافي.
                  </p>
                </div>
                {/* Filter tabs */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "ALL", label: "الكل" },
                    { id: "PENDING", label: "معلقة" },
                    { id: "UNDER_REVIEW", label: "تحت المراجعة" },
                    { id: "ACCEPTED", label: "مقبولة" },
                    { id: "CHANGES_REQUESTED", label: "مطلوب تعديل" },
                    { id: "REJECTED", label: "مرفوضة" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setAppFilter(f.id)}
                      className={
                        "rounded-full px-3.5 py-1.5 text-xs font-bold transition " +
                        (appFilter === f.id
                          ? "bg-lilac text-white shadow-sm"
                          : "border border-sand bg-white text-ink/70 hover:bg-cream")
                      }
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Applications Table */}
              <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sand text-right text-xs font-black text-ink/50">
                      <th className="py-3 pr-2">المعرف</th>
                      <th className="py-3 pr-2">المدرس والمعلومات</th>
                      <th className="py-3 pr-2">الجامعة والكلية</th>
                      <th className="py-3 pr-2">الخبرة ونمط التدريس</th>
                      <th className="py-3 pr-2">الحالة</th>
                      <th className="py-3 pl-2 text-center">الإجراءات والقرار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="border-b border-sand/60 last:border-0 hover:bg-cream/20 transition">
                        <td className="py-3.5 pr-2 font-mono text-xs font-bold text-ink/50">{app.id}</td>
                        <td className="py-3.5 pr-2">
                          <div className="font-bold text-ink">{app.name}</div>
                          <div className="text-[11px] text-ink/50">{app.email} · {app.phone}</div>
                        </td>
                        <td className="py-3.5 pr-2 text-ink/80 text-xs">
                          <div className="font-bold">{app.university}</div>
                          <div className="text-ink/60">{app.faculty}</div>
                        </td>
                        <td className="py-3.5 pr-2 max-w-xs text-xs text-ink/70">
                          <div className="truncate font-semibold">{app.experience}</div>
                          <span className="inline-block mt-1 rounded bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/60">
                            {app.preferredMode === "ONLINE" ? "💻 أونلاين فقط" : app.preferredMode === "IN_PERSON" ? "🏫 حضوري فقط" : "🔄 أونلاين وحضوري"}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2">
                          <span
                            className={
                              "inline-flex rounded-full px-3 py-1 text-xs font-black " +
                              (app.status === "ACCEPTED"
                                ? "bg-mint/20 text-mint"
                                : app.status === "REJECTED"
                                ? "bg-red-100 text-red-600"
                                : app.status === "CHANGES_REQUESTED"
                                ? "bg-coral/20 text-coral"
                                : "bg-sun/25 text-orange-700")
                            }
                          >
                            {app.statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 pl-2">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Inspect */}
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="flex items-center gap-1 rounded-xl bg-ink/5 px-2.5 py-1.5 text-xs font-bold text-ink/70 hover:bg-lilac/15 hover:text-lilac transition"
                              title="معاينة الملف الكامل"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              فحص
                            </button>

                            {/* Accept Button */}
                            {app.status !== "ACCEPTED" && (
                              <button
                                onClick={() => handleAcceptTeacher(app.id)}
                                className="flex items-center gap-1 rounded-xl bg-mint/15 px-2.5 py-1.5 text-xs font-black text-mint hover:bg-mint hover:text-white transition"
                                title="قبول ومنح رول TUTOR"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                قبول
                              </button>
                            )}

                            {/* Reject Button */}
                            {app.status !== "REJECTED" && (
                              <button
                                onClick={() => setRejectionModalApp(app)}
                                className="flex items-center gap-1 rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-black text-red-600 hover:bg-red-500 hover:text-white transition"
                                title="رفض الطلب"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                رفض
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: ALL STUDENT REQUESTS (SHOWED & MANAGEABLE)
          ======================================================== */}
          {activeTab === "requests" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <div>
                  <h1 className="text-2xl font-black text-ink">📋 جميع طلبات واستغاثات الطلاب</h1>
                  <p className="text-sm text-ink/60">
                    متابعة حية لجميع الطلبات على مستوى كل الجامعات والتخصصات وإمكانية التدخل المباشر.
                  </p>
                </div>
                {/* Search Bar */}
                <div className="relative min-w-[260px]">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
                  <input
                    type="text"
                    placeholder="ابحث بالمادة، الطالب، أو الكود..."
                    value={reqSearch}
                    onChange={(e) => setReqSearch(e.target.value)}
                    className="w-full rounded-full border border-sand bg-cream/40 py-2.5 pr-10 pl-4 text-xs font-semibold outline-none focus:border-lilac"
                  />
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "ALL", label: "جميع الطلبات" },
                  { id: "MATCHING", label: "🔄 جاري المطابقة" },
                  { id: "CONFIRMED", label: "✅ مؤكدة" },
                  { id: "IN_PROGRESS", label: "⏳ قيد التنفيذ" },
                  { id: "COMPLETED", label: "🎉 مكتملة" },
                  { id: "DISPUTED", label: "⚠️ في نزاع" },
                  { id: "CANCELLED", label: "❌ ملغاة" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setReqStatusFilter(st.id)}
                    className={
                      "rounded-full px-4 py-2 text-xs font-bold transition " +
                      (reqStatusFilter === st.id
                        ? "bg-coral text-white shadow-sm"
                        : "border border-sand bg-white text-ink/70 hover:bg-cream")
                    }
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Requests List */}
              <div className="space-y-3">
                {filteredRequests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-3xl border border-sand bg-white p-5 shadow-sm transition hover:border-lilac/50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-[280px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="rounded-lg bg-ink/5 px-2.5 py-1 font-mono text-xs font-bold text-ink">
                            {r.id}
                          </code>
                          <span className="text-xs font-bold text-ink/40">{r.createdAt}</span>
                          <span
                            className={
                              "rounded-full px-3 py-0.5 text-xs font-black " +
                              (r.urgency === "ASAP"
                                ? "bg-red-500 text-white"
                                : r.urgency === "HIGH"
                                ? "bg-orange-500 text-white"
                                : "bg-sun/20 text-sun")
                            }
                          >
                            أولوية: {r.urgency}
                          </span>
                          <span
                            className={
                              "rounded-full px-3 py-0.5 text-xs font-black " +
                              (r.status === "COMPLETED"
                                ? "bg-mint/20 text-mint"
                                : r.status === "DISPUTED"
                                ? "bg-red-100 text-red-600"
                                : r.status === "CONFIRMED"
                                ? "bg-lilac/20 text-lilac"
                                : "bg-sun/20 text-sun")
                            }
                          >
                            حالة: {r.status}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-ink">
                          {r.subject} · <span className="text-coral font-bold">{r.topic}</span>
                        </h3>
                        <p className="text-xs text-ink/70 leading-relaxed max-w-3xl">
                          {r.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-ink/60">
                          <span>🎓 الطالب: <strong className="text-ink">{r.studentName}</strong> ({r.university} — {r.faculty})</span>
                          {r.selectedTutor && (
                            <span>👨‍🏫 المدرس المختار: <strong className="text-mint">{r.selectedTutor}</strong></span>
                          )}
                          <span>💵 الميزانية: <strong className="text-ink">{r.budget} ج.م</strong></span>
                          <span>📍 النمط: <strong>{r.mode === "ONLINE" ? "أونلاين" : "حضوري"}</strong></span>
                        </div>
                      </div>

                      {/* Admin Override Controls */}
                      <div className="flex flex-col gap-2 shrink-0">
                        <div className="text-[11px] font-bold text-ink/40">تعديل الحالة يدوياً:</div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => handleOverrideRequestStatus(r.id, "CONFIRMED")}
                            className="rounded-xl border border-sand bg-cream/50 px-3 py-1.5 text-xs font-bold text-lilac hover:bg-lilac hover:text-white transition"
                          >
                            تأكيد الطلب
                          </button>
                          <button
                            onClick={() => handleOverrideRequestStatus(r.id, "COMPLETED")}
                            className="rounded-xl border border-sand bg-cream/50 px-3 py-1.5 text-xs font-bold text-mint hover:bg-mint hover:text-white transition"
                          >
                            إكمال الجلسة
                          </button>
                          <button
                            onClick={() => handleOverrideRequestStatus(r.id, "CANCELLED")}
                            className="rounded-xl border border-sand bg-cream/50 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: USERS & PERMISSIONS MANAGEMENT
          ======================================================== */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <div>
                  <h1 className="text-2xl font-black text-ink">👥 إدارة المستخدمين والصلاحيات</h1>
                  <p className="text-sm text-ink/60">
                    التحكم في أدوار الحسابات (طالب / مدرس / أدمن) وتجميد أو إعادة تنشيط المستخدمين.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="بحث بالاسم أو البريد..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="rounded-full border border-sand bg-cream/40 py-2 px-4 text-xs font-semibold outline-none focus:border-lilac"
                  />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="rounded-full border border-sand bg-white py-2 px-3 text-xs font-bold text-ink outline-none"
                  >
                    <option value="ALL">كل الأدوار</option>
                    <option value="STUDENT">طلاب</option>
                    <option value="TUTOR">مدرسين</option>
                    <option value="ADMIN">أدمن</option>
                  </select>
                </div>
              </div>

              <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sand text-right text-xs font-black text-ink/50">
                      <th className="py-3 pr-2">المستخدم</th>
                      <th className="py-3 pr-2">الرول الحالي</th>
                      <th className="py-3 pr-2">تاريخ الانضمام</th>
                      <th className="py-3 pr-2">الحالة</th>
                      <th className="py-3 pl-2 text-center">تغيير الصلاحيات والحساب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-sand/60 last:border-0 hover:bg-cream/20">
                        <td className="py-3.5 pr-2">
                          <div className="font-bold text-ink">{u.name}</div>
                          <div className="text-[11px] text-ink/50">{u.email} · {u.phone}</div>
                        </td>
                        <td className="py-3.5 pr-2">
                          <span
                            className={
                              "rounded-full px-3 py-1 text-xs font-black " +
                              (u.role === "ADMIN"
                                ? "bg-lilac text-white"
                                : u.role === "TUTOR"
                                ? "bg-mint/20 text-mint"
                                : "bg-coral/20 text-coral")
                            }
                          >
                            {u.role === "ADMIN" ? "👑 أدمن" : u.role === "TUTOR" ? "👨‍🏫 مدرس" : "🎓 طالب"}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 text-xs text-ink/60">{u.joinedAt}</td>
                        <td className="py-3.5 pr-2">
                          <span
                            className={
                              "rounded-full px-2.5 py-1 text-[11px] font-black " +
                              (u.isActive ? "bg-mint/15 text-mint" : "bg-red-100 text-red-600")
                            }
                          >
                            {u.isActive ? "نشط" : "مجمد"}
                          </span>
                        </td>
                        <td className="py-3.5 pl-2">
                          <div className="flex items-center justify-center gap-2">
                            {/* Role Switcher */}
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value as any)}
                              className="rounded-xl border border-sand bg-cream/40 px-2.5 py-1 text-xs font-bold text-ink outline-none"
                            >
                              <option value="STUDENT">طالب (Student)</option>
                              <option value="TUTOR">مدرس (Tutor)</option>
                              <option value="ADMIN">أدمن (Admin)</option>
                            </select>

                            {/* Freeze/Active Toggle */}
                            <button
                              onClick={() => handleToggleUserActive(u.id)}
                              className={
                                "rounded-xl px-3 py-1 text-xs font-bold transition " +
                                (u.isActive
                                  ? "bg-red-50 text-red-600 hover:bg-red-500 hover:text-white"
                                  : "bg-mint/15 text-mint hover:bg-mint hover:text-white")
                              }
                            >
                              {u.isActive ? "تجميد الحساب" : "تنشيط"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: DISPUTES & CLAIMS
          ======================================================== */}
          {activeTab === "disputes" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 via-cream to-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl text-red-600">
                    <FileWarning className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-ink">⚠️ مركز فض النزاعات وحماية الحقوق</h1>
                    <p className="text-sm text-ink/60">
                      مراجعة الجلسات التي أبلغ عنها أحد الطرفين واتخاذ القرار النهائي (رد للطالب / صرف للمدرس / تسوية مشتركة).
                    </p>
                  </div>
                </div>
              </div>

              {disputedRequests.length === 0 ? (
                <div className="rounded-3xl border border-sand bg-white p-12 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-mint mb-3" />
                  <h3 className="text-lg font-black text-ink">لا توجد أي نزاعات مفتوحة حالياً!</h3>
                  <p className="text-sm text-ink/50">جميع الجلسات والمدفوعات تسير بسلاسة تامة.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disputedRequests.map((d) => (
                    <div key={d.id} className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
                        <div>
                          <span className="rounded-lg bg-red-100 px-2.5 py-1 font-mono text-xs font-bold text-red-700">
                            نزاع: {d.id}
                          </span>
                          <h3 className="mt-2 text-lg font-black text-ink">{d.subject} — {d.topic}</h3>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-ink/40">قيمة المعاملة المعلقة</div>
                          <div className="text-xl font-black text-coral">{d.budget} ج.م</div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 text-xs bg-cream/40 p-4 rounded-2xl">
                        <div>
                          <strong className="block text-ink font-bold mb-1">بيانات الطالب المشتكي:</strong>
                          <p>{d.studentName} ({d.studentEmail})</p>
                          <p className="mt-2 text-ink/70"><strong>الشكوى:</strong> {d.description}</p>
                        </div>
                        <div>
                          <strong className="block text-ink font-bold mb-1">المدرس المعني:</strong>
                          <p>{d.selectedTutor ?? "غير محدد"}</p>
                          <p className="mt-2 text-ink/70"><strong>النمط:</strong> {d.mode === "ONLINE" ? "أونلاين" : "حضوري"}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        <span className="text-xs font-bold text-ink/50">اختر قرار الإدارة النهائي:</span>
                        <button
                          onClick={() => handleResolveDispute(d.id, "REFUND")}
                          className="rounded-full bg-red-500 px-5 py-2 text-xs font-black text-white hover:bg-red-600 transition shadow"
                        >
                          رد كامل المبلغ للطالب 💸
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d.id, "PAY_TUTOR")}
                          className="rounded-full bg-mint px-5 py-2 text-xs font-black text-white hover:bg-green-600 transition shadow"
                        >
                          صرف كامل المبلغ للمدرس ✅
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d.id, "SPLIT")}
                          className="rounded-full bg-lilac px-5 py-2 text-xs font-black text-white hover:bg-indigo-700 transition shadow"
                        >
                          تسوية بنسبة 50/50 ⚖️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "payouts" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-black text-ink">💸 فواتير المدرسين (السحب)</h1>
                <p className="mt-1 text-sm text-ink/60">راجع طلبات سحب الأرباح ووافق عليها أو ارفضها.</p>
              </div>

              {payouts.length === 0 ? (
                <div className="rounded-3xl border border-sand bg-white p-10 text-center text-sm font-bold text-ink/50">
                  لا توجد فواتير سحب حتى الآن.
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-black text-ink">{payout.tutorName}</h2>
                          <p className="text-xs text-ink/50">{payout.tutorEmail} · {payout.createdAt}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${
                          payout.status === "PENDING" ? "bg-sun/20 text-orange-700" :
                          payout.status === "APPROVED" || payout.status === "PAID" ? "bg-mint/15 text-mint" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {payout.status === "PENDING" ? "بانتظار المراجعة" : payout.status === "APPROVED" ? "تمت الموافقة" : payout.status === "PAID" ? "تم الصرف" : "مرفوضة"}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded-2xl bg-cream p-4">
                          <div className="text-xs text-ink/50">المبلغ</div>
                          <div className="mt-1 text-xl font-black text-mint">{payout.amountEGP} ج.م</div>
                        </div>
                        <div className="rounded-2xl bg-cream p-4">
                          <div className="text-xs text-ink/50">طريقة التحويل</div>
                          <div className="mt-1 font-black text-ink">{payout.paymentMethod}</div>
                        </div>
                        <div className="rounded-2xl bg-cream p-4">
                          <div className="text-xs text-ink/50">بيانات الحساب</div>
                          <div className="mt-1 break-all font-black text-ink">{payout.accountDetails}</div>
                        </div>
                      </div>

                      {payout.status === "PENDING" && (
                        <div className="mt-5 flex flex-wrap gap-2 border-t border-sand pt-4">
                          <button onClick={() => updatePayoutStatus(payout.id, "APPROVED")} className="rounded-full bg-mint px-5 py-2 text-xs font-black text-white hover:bg-green-700">
                            الموافقة على السحب ✓
                          </button>
                          <button onClick={() => updatePayoutStatus(payout.id, "REJECTED")} className="rounded-full bg-red-600 px-5 py-2 text-xs font-black text-white hover:bg-red-700">
                            رفض الفاتورة ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 6: PLATFORM SETTINGS & COMMISSION
          ======================================================== */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-black text-ink">⚙️ إعدادات المنصة وعمولة الأرباح</h1>
                <p className="text-sm text-ink/60">
                  تعديل نسب العمولة، أسعار الجلسات، وقواعد نظام النقاط والمكافآت التلقائية.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-black text-ink flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-coral" />
                    النسب المالية والعمولات
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      نسبة عمولة المنصة (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={commissionPct}
                        onChange={(e) => setCommissionPct(Number(e.target.value))}
                        className="w-28 rounded-2xl border border-sand p-3 text-lg font-black text-coral outline-none focus:border-coral"
                      />
                      <span className="text-xs text-ink/50">
                        تُخصم من إجمالي قيمة الجلسة ويحصل المعلم على الباقي تلقائياً.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      رسوم الجلسات الحضورية الإضافية (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={inPersonSurcharge}
                        onChange={(e) => setInPersonSurcharge(Number(e.target.value))}
                        className="w-28 rounded-2xl border border-sand p-3 text-lg font-black text-sun outline-none focus:border-sun"
                      />
                      <span className="text-xs text-ink/50">
                        تُضاف لتغطية تكلفة الانتقال والأماكن.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerToast("✅ تم حفظ الإعدادات المالية وتطبيقها على كافة المعاملات")}
                    className="mt-4 rounded-full bg-ink px-6 py-2.5 text-xs font-black text-cream hover:bg-ink/90"
                  >
                    حفظ التغييرات المالية
                  </button>
                </div>

                <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-black text-ink flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-sun" />
                    قواعد النقاط والمكافآت التلقائية
                  </h3>

                  <ul className="space-y-3 text-xs">
                    <li className="flex items-center justify-between rounded-2xl bg-cream/50 p-3">
                      <span>نقاط نشر أول طلب للطالب الجديد:</span>
                      <strong className="text-sm font-black text-coral">+100 نقطة</strong>
                    </li>
                    <li className="flex items-center justify-between rounded-2xl bg-cream/50 p-3">
                      <span>نقاط إتمام جلسة بنجاح:</span>
                      <strong className="text-sm font-black text-mint">+50 نقطة</strong>
                    </li>
                    <li className="flex items-center justify-between rounded-2xl bg-cream/50 p-3">
                      <span>نقاط كتابة تقييم صادق للمعلم:</span>
                      <strong className="text-sm font-black text-lilac">+20 نقطة</strong>
                    </li>
                  </ul>

                  <p className="text-xs text-ink/50 leading-relaxed">
                    يتم استبدال كل 200 نقطة بكوبون خصم 50 ج.م على الجلسة القادمة أو ورشة عمل مجانية.
                  </p>
                </div>
              </div>
            </div>
          )}


        </section>
      </div>

      {/* ========================================================
          MODAL: INSPECT TEACHER APPLICATION (DETAILS & VIDEO)
      ======================================================== */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-sand bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sand pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/15 text-2xl text-mint">
                  👨‍🏫
                </div>
                <div>
                  <h3 className="text-xl font-black text-ink">{selectedApp.name}</h3>
                  <p className="text-xs text-ink/50">{selectedApp.email} · {selectedApp.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="rounded-full bg-ink/5 p-2 text-ink/60 hover:bg-ink/10"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-2xl bg-cream/50 p-3.5 space-y-1">
                <span className="font-bold text-ink/50">الجامعة والكلية:</span>
                <p className="text-sm font-black text-ink">{selectedApp.university}</p>
                <p className="text-ink/70 font-semibold">{selectedApp.faculty}</p>
              </div>
              <div className="rounded-2xl bg-cream/50 p-3.5 space-y-1">
                <span className="font-bold text-ink/50">طريقة التدريس المفضلة:</span>
                <p className="text-sm font-black text-lilac">
                  {selectedApp.preferredMode === "ONLINE" ? "💻 أونلاين فقط" : selectedApp.preferredMode === "IN_PERSON" ? "🏫 حضوري فقط" : "🔄 أونلاين وحضوري"}
                </p>
                <p className="text-ink/50">تاريخ التقديم: {selectedApp.submittedAt}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-sand/80 bg-cream/30 p-4 space-y-2">
              <span className="text-xs font-black text-ink">ملخص الخبرة الأكاديمية والتجربة:</span>
              <p className="text-sm text-ink/80 leading-relaxed font-semibold">
                {selectedApp.experience}
              </p>
            </div>

            {selectedApp.introVideoUrl && (
              <div className="rounded-2xl border border-lilac/30 bg-lilac/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-6 w-6 text-lilac" />
                  <div>
                    <div className="text-xs font-black text-ink">فيديو التعريف والشرح التجريبي</div>
                    <div className="text-[11px] text-ink/50 truncate max-w-xs">{selectedApp.introVideoUrl}</div>
                  </div>
                </div>
                <a
                  href={selectedApp.introVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-lilac px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  مشاهدة الفيديو ↗
                </a>
              </div>
            )}

            {/* Decision Footer */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-sand pt-4">
              <button
                onClick={() => handleRequestChanges(selectedApp.id)}
                className="rounded-full border border-coral text-coral px-4 py-2 text-xs font-bold hover:bg-coral/10"
              >
                طلب تعديلات ومستندات ⚠️
              </button>
              <button
                onClick={() => {
                  setRejectionModalApp(selectedApp);
                  setSelectedApp(null);
                }}
                className="rounded-full bg-red-50 text-red-600 px-5 py-2 text-xs font-black hover:bg-red-500 hover:text-white"
              >
                رفض الطلب ✕
              </button>
              <button
                onClick={() => handleAcceptTeacher(selectedApp.id)}
                className="rounded-full bg-mint text-white px-6 py-2 text-xs font-black hover:brightness-95 shadow-md shadow-mint/20"
              >
                اعتماد وقبول المعلم فوراً ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REJECTION REASON DIALOG
      ======================================================== */}
      {rejectionModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-sand bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-ink">تأكيد رفض طلب {rejectionModalApp.name}</h3>
            <p className="text-xs text-ink/60">
              يرجى كتابة سبب الرفض لتوضيحه للمتقدم في الإشعار والبريد الإلكتروني:
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: لم يتم استيفاء سنوات الخبرة المطلوبة أو التخصص غير مطابق لاحتياجات المنصة الحالية."
              className="w-full rounded-2xl border border-sand p-3 text-xs outline-none focus:border-red-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalApp(null)}
                className="rounded-full border border-sand px-4 py-2 text-xs font-bold text-ink/70 hover:bg-cream"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleRejectTeacher(rejectionModalApp.id, rejectionReason)}
                className="rounded-full bg-red-500 px-5 py-2 text-xs font-black text-white hover:bg-red-600 shadow"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
