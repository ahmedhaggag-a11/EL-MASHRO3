"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle2, Clock, AlertTriangle, Video, MapPin, DollarSign } from "lucide-react";

import { useSearchParams } from "next/navigation";

const SUBJECTS = [
  "الكيمياء العضوية",
  "الفيزياء الهندسية",
  "الرياضيات التطبيقية",
  "خوارزميات وبرمجة",
  "علم الأدوية (فارما)",
  "المحاسبة والمالية",
  "علم التشريح (Anatomy)",
  "مادة أخرى",
];

const UNIVERSITIES = [
  "جامعة القاهرة",
  "جامعة عين شمس",
  "جامعة الإسكندرية",
  "جامعة حلوان",
  "جامعة المنصورة",
  "جامعة أسيوط",
  "جامعة خاصة / أهلية",
];

export default function NewRequestPage() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialSubject = searchParams?.get("subject") || SUBJECTS[0];
  const initialDesc = searchParams?.get("desc") || "";
  const initialBudget = Number(searchParams?.get("budget")) || 300;

  const [university, setUniversity] = useState("جامعة القاهرة");
  const [faculty, setFaculty] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [customSubject, setCustomSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState(initialDesc);
  const [mode, setMode] = useState<"ONLINE" | "IN_PERSON">("ONLINE");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH" | "ASAP">("ASAP");
  const [budget, setBudget] = useState(initialBudget);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("fz_token") : null;
      if (!token) {
        window.location.href = "/login";
        return;
      }

      // POST /api/v1/requests
      const reqPayload = {
        description: `(${topic}) ${description}`,
        teachingMode: mode,
        budgetEGP: budget,
        urgency: urgency,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/v1/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reqPayload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "حدث خطأ أثناء إنشاء الطلب");
        setSubmitting(false);
        return;
      }

      const created = await res.json();

      // PATCH /api/v1/requests/:id/publish
      const pubRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/v1/requests/${created.id}/publish`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (pubRes.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/dashboard/student";
        }, 1500);
      } else {
        alert("فشل في نشر الطلب");
        setSubmitting(false);
      }
    } catch (err) {
      alert("حدث خطأ في الاتصال بالخادم");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-10 sm:px-6 lg:px-8 font-arabic">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-2 text-xs font-bold text-ink/60 hover:text-coral transition"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة للوحة تحكم الطالب
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-coral/15 px-3 py-1 text-xs font-black text-coral">
              نموذج الاستغاثة الأكاديمية 🚨
            </span>
            <h1 className="mt-2 text-3xl font-black text-ink">قولنا إيه اللي مزنقك بالضبط؟</h1>
            <p className="mt-1 text-xs sm:text-sm text-ink/60">
              هنحلل مشكلتك ونرشحلك أفضل 3 مدرسين متخصصين في تخصصك خلال دقائق.
            </p>
          </div>
        </div>

        {success ? (
          <div className="rounded-3xl border border-mint/40 bg-white p-10 text-center space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mint/20 text-3xl text-mint">
              🎉
            </div>
            <h2 className="text-2xl font-black text-ink">تم نشر زنقتك وبدء المطابقة!</h2>
            <p className="text-sm text-ink/60 max-w-md mx-auto">
              جاري توجيهك إلى لوحة التحكم لاختيار المدرس من بين أفضل 3 مرشحين متاحين الآن...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-sand bg-white p-6 sm:p-8 shadow-sm">
            {/* University & Faculty */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">الجامعة</label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full rounded-2xl border border-sand p-3.5 text-xs font-bold text-ink outline-none focus:border-coral"
                >
                  {UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">الكلية أو القسم</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كلية العلوم — قسم الكيمياء"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full rounded-2xl border border-sand p-3.5 text-xs font-bold text-ink outline-none focus:border-coral"
                />
              </div>
            </div>

            {/* Subject Picker */}
            <div>
              <label className="block text-xs font-bold text-ink mb-2">المادة الدراسية</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSubject(s)}
                    className={
                      "rounded-full px-4 py-2 text-xs font-bold transition " +
                      (selectedSubject === s
                        ? "bg-coral text-white shadow-md shadow-coral/25"
                        : "border border-sand bg-white text-ink/70 hover:bg-cream")
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
              {selectedSubject === "مادة أخرى" && (
                <input
                  type="text"
                  required
                  placeholder="اكتب اسم المادة..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="mt-3 w-full rounded-2xl border border-sand p-3.5 text-xs font-bold outline-none focus:border-coral"
                />
              )}
            </div>

            {/* Topic & Specific problem */}
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                اسم الشابتر / الموضوع بالظبط
              </label>
              <input
                type="text"
                required
                placeholder="مثال: تفاعلات الألكينات وميكانيكية الرنين، أو شيت 3 كيرشوف"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-2xl border border-sand p-3.5 text-xs font-bold text-ink outline-none focus:border-coral"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                احكيلنا المشكلة بالتفصيل ومحتاج إيه من المدرس
              </label>
              <textarea
                required
                minLength={15}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: عندي امتحان ميدتيرم بعد بكره، مش فاهم المسائل رقم 4 و 7 في الشيت ومحتاج المدرس يحلها معايا خطوة بخطوة ويوضح الفكرة."
                className="w-full rounded-2xl border border-sand p-4 text-xs font-semibold text-ink leading-relaxed outline-none focus:border-coral"
              />
            </div>

            {/* Teaching Mode & Urgency */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">نمط الشرح المفضل</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("ONLINE")}
                    className={
                      "flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition " +
                      (mode === "ONLINE"
                        ? "border-coral bg-coral/10 text-coral font-black"
                        : "border-sand text-ink/70 hover:bg-cream")
                    }
                  >
                    <Video className="h-4 w-4" />
                    أونلاين (قاعة فيديو)
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("IN_PERSON")}
                    className={
                      "flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition " +
                      (mode === "IN_PERSON"
                        ? "border-coral bg-coral/10 text-coral font-black"
                        : "border-sand text-ink/70 hover:bg-cream")
                    }
                  >
                    <MapPin className="h-4 w-4" />
                    حضوري (في الجامعة)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">مستوى العجلة والوقت</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "LOW", label: "هادي" },
                    { id: "MEDIUM", label: "متوسط" },
                    { id: "HIGH", label: "سريع" },
                    { id: "ASAP", label: "عاجل 🚨" },
                  ].map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUrgency(u.id as any)}
                      className={
                        "rounded-xl border py-3 text-center text-xs font-bold transition " +
                        (urgency === u.id
                          ? "border-coral bg-coral text-white font-black shadow-sm"
                          : "border-sand text-ink/70 hover:bg-cream")
                      }
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Budget Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="budget-input" className="text-xs font-bold text-ink">الميزانية المقترحة للجلسة (ج.م)</label>
              </div>
              <input
                id="budget-input"
                type="number"
                min="50"
                step="10"
                required
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                placeholder="مثال: 200"
                className="w-full rounded-2xl border border-sand p-3.5 text-xs font-bold outline-none focus:border-coral"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-coral py-4 text-sm font-black text-white shadow-lg shadow-coral/30 hover:bg-coralDark transition disabled:opacity-60"
            >
              <Sparkles className="h-5 w-5" />
              {submitting ? "جاري البحث ومطابقة أفضل 3 مدرسين..." : "انشر زنقتك ودورلي على مدرس الآن"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
