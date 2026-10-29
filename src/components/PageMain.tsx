"use client";

import React from "react";
import { usePathname } from "next/navigation";

/** Keep shared page presentation separate from the live exam surface. */
export function PageMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExam = pathname?.includes("/attempt");

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`flex-1 flex flex-col ${isExam ? "" : "page-enter"}`}
      {...(isExam ? { "data-exam": "" } : {})}
    >
      {children}
    </main>
  );
}
