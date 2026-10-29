"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, GraduationCap } from "lucide-react";

const COLUMNS = [
  { title: "Explore", links: [
    { href: "/assessments/exams", label: "Exams" },
    { href: "/assessments/domains", label: "Domains" },
    { href: "/leaderboard", label: "Rankings" },
    { href: "/deadlines", label: "Deadlines" },
    { href: "/verify", label: "Verify certificate" },
  ] },
  { title: "For institutions", links: [
    { href: "/institution", label: "Partner with us" },
    { href: "/institution/dashboard", label: "College dashboard" },
    { href: "/pricing", label: "Plans & pricing" },
  ] },
  { title: "Support", links: [
    { href: "/contact", label: "Contact the team" },
    { href: "/privacy", label: "Privacy policy" },
    { href: "/terms", label: "Terms of service" },
    { href: "/refund-policy", label: "Refund policy" },
  ] },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname?.includes("/attempt")) return null;
  return (
    <footer className="site-footer">
      <div className="page-container">
        <div className="footer-top"><h2>Turn your potential into<br />your next opportunity.</h2><Link href="/signup" className="btn btn-light">Get started with Nxtmove <ArrowUpRight size={18} /></Link></div>
        <div className="footer-grid">
          <div className="footer-about">
            <Link href="/" className="footer-brand"><span className="brand-mark h-10 w-10"><GraduationCap size={23} /></span>Nyeras Nxtmove<span className="sr-only"> home</span></Link>
            <p className="footer-description">Skills that matter. Progress you can measure. A national assessment platform for your next chapter.</p>
          </div>
          {COLUMNS.map((column) => <div key={column.title} className="footer-column"><h3>{column.title}</h3><ul>{column.links.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></div>)}
        </div>
        <div className="footer-bottom"><p>© {new Date().getFullYear()} Nyeras Nxtmove. All rights reserved.</p><p>Learn. Benchmark. Move forward.</p></div>
        <div className="footer-wordmark" aria-hidden="true">{"NXTMOVE".split("").map((letter, i) => <span key={i}>{letter}</span>)}</div>
      </div>
    </footer>
  );
}
