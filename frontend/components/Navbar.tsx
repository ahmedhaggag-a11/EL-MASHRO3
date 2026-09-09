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
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-coralDark shadow-lg shadow-coral/30 overflow-hidden">
            {/* Sparkle decorative element */}
            <div className="absolute -top-1 -right-1 text-sun opacity-80 group-hover:animate-spin">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            {/* Main Logo icon: An interlocking lifesaver / puzzle */}
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M15.536 8.464a5 5 0 0 1 0 7.072M8.464 15.536a5 5 0 0 1 0-7.072"/>
              <path d="m4.929 4.929 3.536 3.536"/>
              <path d="m15.536 15.536 3.536 3.536"/>
              <path d="m4.929 19.071 3.536-3.536"/>
              <path d="m15.536 8.464 3.536-3.536"/>
            </svg>
          </div>
          <div className="leading-none">
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
