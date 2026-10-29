"use client";

import React, { useState } from "react";
import { Mail, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function ContactHelpdeskPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex-1 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 sm:px-6">
        <h1 className="page-title">Contact</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-4">
            <div className="card-hover flex items-center gap-4 p-5">
              <span className="tile h-11 w-11">
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900">Email</h2>
                <p className="truncate text-sm text-slate-500">support@campusradar.edu.in</p>
              </div>
            </div>

            <div className="card-hover flex items-center gap-4 p-5">
              <span className="tile h-11 w-11">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Office</h2>
                <p className="text-sm text-slate-500">Bangalore, India</p>
              </div>
            </div>
          </div>

          <div className="glass p-6 sm:p-8 md:col-span-2">
            {submitted ? (
              <div className="space-y-3 py-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="font-display text-xl font-semibold text-slate-900">Message sent</h3>
                <p className="text-sm text-slate-500">We'll reply to {formData.email} shortly.</p>
                <button onClick={() => setSubmitted(false)} className="btn btn-secondary btn-sm">
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-slate-700">Subject</label>
                  <input
                    id="contact-subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-slate-700">Message</label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input"
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full py-3">
                  <Send className="h-4 w-4" />
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
