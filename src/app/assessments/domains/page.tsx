"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { DOMAINS } from "@/data/domains";
import { categoryIcon } from "@/lib/category-icons";

export default function DomainExplorerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredDomains = useMemo(() => {
    return DOMAINS.filter(d => {
      const matchesCategory = selectedCategory === "all" || d.categoryCode === selectedCategory;
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.subjects.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const chip = (active: boolean) => `chip ${active ? "btn-primary" : "btn-secondary"}`;

  return (
    <div className="flex-1 py-10 sm:py-14">
      <div className="page-container space-y-8">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="page-title">Domains</h1>
          <Link
            href={selectedCategory === "all" ? "/assessments/exams" : `/assessments/exams?category=${selectedCategory}`}
            className="btn btn-secondary group shrink-0"
          >
            Browse exams
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Search & stream filter */}
        <div className="glass space-y-4 p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search domains or topics"
              aria-label="Search domains"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedCategory("all")} className={chip(selectedCategory === "all")}>
              All <span className="text-xs opacity-70">{DOMAINS.length}</span>
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.code}
                onClick={() => setSelectedCategory(cat.code)}
                className={chip(selectedCategory === cat.code)}
              >
                {cat.shortName} <span className="text-xs opacity-70">{cat.domainCount}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="px-1 text-sm text-slate-500">
          <strong className="font-semibold text-slate-900">{filteredDomains.length}</strong>{" "}
          {filteredDomains.length === 1 ? "domain" : "domains"}
        </p>

        {/* Domain grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredDomains.map(domain => {
            const Icon = categoryIcon(domain.categoryCode);
            return (
              <Link
                key={domain.slug}
                href={`/assessments/domains/${domain.slug}`}
                prefetch={false}
                className="glass-flat defer-paint [--card-h:250px] group flex flex-col gap-4 p-5 sm:p-6"
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <span className="tile h-7 w-7 !rounded-lg">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {domain.categoryName.split(" ")[0]}
                </span>

                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-slate-900">{domain.name}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{domain.description}</p>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-slate-200/70 pt-4 text-sm">
                  <span className="text-slate-500">
                    {domain.subjects.length} {domain.subjects.length === 1 ? "subject" : "subjects"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-electric-600 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
