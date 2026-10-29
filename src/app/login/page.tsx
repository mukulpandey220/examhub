"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Lock,
  Mail,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("ramkumar.malothu@nyeras.com");
  const [password, setPassword] = useState("Nyeras@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectRole = (selectedRole: "student" | "admin") => {
    setRole(selectedRole);
    setError("");
    if (selectedRole === "student") {
      setEmail("ramkumar.malothu@nyeras.com");
      setPassword("Nyeras@123");
    } else {
      setEmail("admin@nyeras.com");
      setPassword("Nyeras@123");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      if (typeof window !== "undefined" && data.profile) {
        localStorage.setItem("campus_radar_user", JSON.stringify(data.profile));
      }

      const destination = data.redirectUrl || (data.profile.role === "admin" ? "/admin" : "/dashboard");
      router.push(destination);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="anim-rise glass w-full max-w-md space-y-6 !rounded-3xl p-8 sm:p-10">
        <h1 className="text-center font-display text-3xl font-semibold tracking-tight text-slate-900">Sign in</h1>

        {/* Account type */}
        <div className="seg grid grid-cols-2">
          <button
            type="button"
            data-active={role === "student"}
            onClick={() => selectRole("student")}
            className="seg-item flex items-center justify-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Student
          </button>
          <button
            type="button"
            data-active={role === "admin"}
            onClick={() => selectRole("admin")}
            className="seg-item flex items-center justify-center gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin
          </button>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary group w-full py-3">
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-electric-600 hover:text-electric-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
