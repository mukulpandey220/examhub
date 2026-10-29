"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  History,
  BarChart3,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { FullscreenButton } from "./FullscreenButton";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/assessments/exams", label: "Exams" },
  { href: "/assessments/domains", label: "Domains" },
  { href: "/leaderboard", label: "Rankings" },
  { href: "/deadlines", label: "Deadlines" },
  { href: "/institution", label: "Colleges" },
  { href: "/pricing", label: "Pricing" },
];

/** Shared brand mark. */
function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`brand-mark ${className}`}
    >
      <GraduationCap className="h-5 w-5" />
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function loadUser() {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("campus_radar_user");
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          if (pathname.startsWith("/admin")) {
            setCurrentUser({ name: "Admin Nyeras", role: "admin", email: "admin@nyeras.com" });
          } else if (pathname.startsWith("/dashboard")) {
            setCurrentUser({ name: "Ramkumar Malothu", role: "student", email: "ramkumar.malothu@nyeras.com" });
          }
        }
      }
    }
    loadUser();
  }, [pathname]);

  // Close menus whenever the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Lift the bar slightly once the page scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the profile menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen && !mobileMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMenuOpen(false); setMobileMenuOpen(false); }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, mobileMenuOpen]);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("campus_radar_user");
    }
    setCurrentUser(null);
    setMenuOpen(false);
    setMobileMenuOpen(false);
    router.push("/login");
  };

  // The live exam screen has its own full-screen chrome
  if (pathname.includes("/attempt")) {
    return null;
  }

  const isAdmin = currentUser && (currentUser.role === "admin" || currentUser.role === "exam_admin" || currentUser.role === "super_admin");
  const initial = currentUser?.name ? String(currentUser.name).charAt(0).toUpperCase() : "U";

  const menuItems = isAdmin
    ? [{ href: "/admin", label: "Admin console", icon: ShieldCheck }]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/assessments/history", label: "Exam history", icon: History },
        { href: "/assessments/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const avatarTone = isAdmin ? "bg-clay-500" : "bg-electric-500";

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div
        className="nav-inner"
      >
        <div className="nav-row">
          {/* Brand */}
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-lg font-semibold tracking-tight text-slate-900">
              Nyeras <span className="text-electric-500">Nxtmove</span>
            </span>
          </Link>

          {/* Primary navigation */}
          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="nav-link"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right toolbar */}
          <div className="flex items-center gap-1.5">
            <div className="hidden items-center gap-0.5 sm:flex">
              <FullscreenButton variant="navbar" className="!h-9 !w-9 !justify-center !space-x-0 !p-0" />
              <ThemeToggle />
            </div>

            {currentUser ? (
              <div className="relative hidden xl:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="btn-secondary flex items-center gap-2 rounded-xl py-1 pl-1 pr-2.5"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold text-white ${avatarTone}`}
                  >
                    {initial}
                  </span>
                  <span className="max-w-[120px] truncate text-sm font-medium text-slate-800">
                    {currentUser.name || "Account"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-3 w-64 animate-slide-down overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-soft-xl"
                  >
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white ${avatarTone}`}
                      >
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{currentUser.name}</p>
                        {currentUser.email && (
                          <p className="truncate text-xs text-slate-500">{currentUser.email}</p>
                        )}
                        <span className={`badge mt-1 ${isAdmin ? "bg-clay-100 text-clay-700" : "badge-blue"}`}>
                          {String(currentUser.role || "student").replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="py-1.5">
                      {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-electric-500/[0.08] hover:text-slate-900"
                          >
                            <Icon className="h-4 w-4 text-slate-400" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 pt-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-1.5 xl:flex">
                <Link href="/login" className="btn btn-ghost btn-sm !px-3.5 !py-2 text-sm">
                  Sign in
                </Link>
                <Link href="/signup" className="btn btn-primary btn-sm !px-3.5 !py-2 text-sm">
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-electric-500/[0.08] hover:text-slate-900 xl:hidden"
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
              aria-controls="mobile-navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav animate-slide-down space-y-3 xl:hidden">
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-electric-500/10 text-electric-700"
                    : "text-slate-700 hover:bg-electric-500/[0.07]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/70 pt-3">
            <span className="px-1 text-sm text-slate-500">Display</span>
            <div className="flex items-center gap-1">
              <FullscreenButton variant="navbar" className="!h-9 !w-9 !justify-center !space-x-0 !p-0" />
              <ThemeToggle />
            </div>
          </div>

          {currentUser ? (
            <div className="space-y-1.5 border-t border-slate-200/70 pt-3">
              <div className="flex items-center gap-3 px-1">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-white ${avatarTone}`}
                >
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{currentUser.name}</p>
                  <p className="truncate text-xs capitalize text-slate-500">
                    {String(currentUser.role || "student").replace("_", " ")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-electric-500/[0.07]"
                    >
                      <Icon className="h-4 w-4 text-slate-400" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 border-t border-slate-200/70 pt-3">
              <Link href="/login" className="btn btn-secondary">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Get started
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
