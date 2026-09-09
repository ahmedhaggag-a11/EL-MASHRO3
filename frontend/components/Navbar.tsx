"use client";

import Link from "next/link";
import { useState } from "react";
import { Moon, Sparkles, User, Shield, ChevronDown, Check } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

const NAV_LINKS = [
  { label: "الرئيسية", href: "#", active: true },
  { label: "إزاي نشتغل؟", href: "#how-it-works" },
  { label: "ورش العمل", href: "#workshops" },
  { label: "الأسئلة الشائعة", href: "#faq" },
  { label: "من نحن", href: "#about" },
];

export default function Navbar() {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-sand/60 bg-white/80 backdrop-blur-md sticky top-0 z-40 font-arabic">
      {/* Top Demo Bar */}
      <div className="bg-ink px-4 py-1.5 text-center text-xs font-bold text-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-mint animate-pulse" />
            <span className="text-[11px] text-cream/80">منصة إيه اللي زانقك التعليمية — شغالة في جميع الجامعات المصرية 🇪🇬</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-cream/60 hidden sm:inline">جرّب الواجهات:</span>
            <Link
              href="/dashboard/student"
              className="rounded-md bg-coral/20 px-2 py-0.5 text-[11px] font-bold text-coral hover:bg-coral hover:text-white transition"
            >
              🎓 واجهة الطالب
            </Link>
            <Link
              href="/dashboard/tutor"
              className="rounded-md bg-mint/20 px-2 py-0.5 text-[11px] font-bold text-mint hover:bg-mint hover:text-white transition"
            >
              👨‍🏫 واجهة المدرس
            </Link>
            <Link
              href="/dashboard/admin"
              className="rounded-md bg-lilac/20 px-2 py-0.5 text-[11px] font-bold text-lilac hover:bg-lilac hover:text-white transition"
            >
              👑 لوحة تحكم الأدمن
            </Link>
          </div>
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform group">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm overflow-hidden border border-sand">
            <img src="/logo.png" alt="Fok Zanka Logo" className="h-full w-full object-cover" />
          </div>
          <div className="leading-none hidden sm:block">
            <div className="text-xl font-black text-ink tracking-tight">إيه اللي زانقك</div>
            <div className="text-[12px] font-bold text-ink/60 mt-1">إحنا معاك لحد ما تفهم</div>
          </div>
        </Link>

        {/* Center links */}
        <ul className="hidden items-center gap-7 text-xs font-bold text-ink/70 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className={
                  link.active
                    ? "rounded-full bg-coral/10 px-3.5 py-1.5 text-coral font-black"
                    : "transition hover:text-coral"
                }
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/requests/new"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-coral/10 border border-coral/30 px-4 py-2 text-xs font-black text-coral hover:bg-coral hover:text-white transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            انشر زنقتك
          </Link>

          <Link
            href="/register"
            className="hidden rounded-full border border-sand bg-white px-4 py-2 text-xs font-bold text-ink transition hover:bg-cream dark:hover:bg-slate-800 sm:block"
          >
            انضم كمعلم 👨‍🏫
          </Link>

          <Link
            href="/login"
            className="rounded-full bg-ink px-5 py-2.5 text-xs font-black text-cream transition hover:bg-ink/90 shadow-sm"
          >
            تسجيل الدخول
          </Link>
        </div>
      </nav>
    </header>
  );
}
