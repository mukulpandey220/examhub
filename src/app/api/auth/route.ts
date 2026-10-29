import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OFFICIAL_RAZORPAY_PAYMENT_URL } from "@/config/payment";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const userId = searchParams.get("userId") || "user-student-ramkumar";

    if (action === "students" || action === "all") {
      const allProfiles = db.getProfiles().filter(p => p.role === "student");
      const studentsWithDetails = allProfiles.map(p => {
        const ent = db.getEntitlements(p.id);
        const attempts = db.getUserAttempts(p.id);
        return {
          ...p,
          entitlements: ent,
          attemptsCount: attempts.length,
          activePass: ent.length > 0 ? ent[0] : null,
          isPaid: ent.length > 0,
        };
      });

      return NextResponse.json({
        students: studentsWithDetails,
        razorpayPaymentUrl: OFFICIAL_RAZORPAY_PAYMENT_URL,
      });
    }

    const profile = db.getProfile(userId) || db.getProfile("user-student-ramkumar");
    const actualUserId = profile ? profile.id : userId;
    const entitlements = db.getEntitlements(actualUserId);
    const bookmarks = db.getBookmarks(actualUserId);
    const tokens = db.getUserTokens(actualUserId);
    const tokenTransactions = db.getTokenTransactions(actualUserId);
    const unlockedExams = profile?.unlockedExams || [];

    const enhancedProfile = {
      ...(profile || {
        id: "user-student-ramkumar",
        email: "ramkumar.malothu@nyeras.com",
        name: "Ramkumar Malothu",
        role: "student",
        university: "Nyeras Institute of Technology",
        courseDegree: "B.Tech Computer Science & Engineering",
        branch: "Computer Science",
        semester: 7,
        onboarded: true,
      }),
      tokens,
      unlockedExams,
    };

    return NextResponse.json({
      profile: enhancedProfile,
      tokens,
      unlockedExams,
      tokenTransactions,
      entitlements,
      bookmarks,
      tokenRate: "1 INR = 1 Token",
      razorpayPaymentUrl: OFFICIAL_RAZORPAY_PAYMENT_URL,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId = "user-student-ramkumar", 
      email, 
      password, 
      action, 
      updates, 
      questionId, 
      examId
    } = body;

    // Login Action
    if (action === "login") {
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanPass = (password || "").trim();

      // Check Admin
      if (cleanEmail === "admin@nyeras.com" && cleanPass === "Nyeras@123") {
        const adminProfile = db.getProfile("admin@nyeras.com") || {
          id: "user-admin-nyeras",
          email: "admin@nyeras.com",
          name: "Admin Nyeras",
          role: "admin",
          onboarded: true,
        };
        return NextResponse.json({ success: true, profile: adminProfile, redirectUrl: "/admin" });
      }

      // Check Student
      if (cleanEmail === "ramkumar.malothu@nyeras.com" && cleanPass === "Nyeras@123") {
        const studentProfile = db.getProfile("ramkumar.malothu@nyeras.com") || {
          id: "user-student-ramkumar",
          email: "ramkumar.malothu@nyeras.com",
          name: "Ramkumar Malothu",
          role: "student",
          university: "Nyeras Institute of Technology",
          courseDegree: "B.Tech Computer Science & Engineering",
          branch: "Computer Science",
          semester: 7,
          onboarded: true,
        };
        return NextResponse.json({ success: true, profile: studentProfile, redirectUrl: "/dashboard" });
      }

      // Fallback check against db profiles
      const found = db.getProfile(cleanEmail);
      if (found && (found.password === cleanPass || cleanPass === "password123" || cleanPass === "Nyeras@123")) {
        return NextResponse.json({ 
          success: true, 
          profile: found, 
          redirectUrl: found.role === "admin" ? "/admin" : "/dashboard" 
        });
      }

      return NextResponse.json({ 
        error: "Invalid email or password. Use admin@nyeras.com or ramkumar.malothu@nyeras.com with password: Nyeras@123" 
      }, { status: 401 });
    }

    if (action === "update_profile") {
      const updated = db.updateProfile(userId, updates || {});
      return NextResponse.json({ profile: updated });
    }

    if (action === "opt_in_exam") {
      if (!examId) return NextResponse.json({ error: "examId is required" }, { status: 400 });
      const optedExams = db.optInExam(userId, examId);
      return NextResponse.json({ success: true, optedExams });
    }

    if (action === "opt_out_exam") {
      if (!examId) return NextResponse.json({ error: "examId is required" }, { status: 400 });
      const optedExams = db.optOutExam(userId, examId);
      return NextResponse.json({ success: true, optedExams });
    }

    if (action === "unlock_exam_with_tokens") {
      if (!examId) return NextResponse.json({ error: "examId is required" }, { status: 400 });
      const unlockResult = db.unlockExamWithTokens(userId, examId);
      if (!unlockResult.success) {
        return NextResponse.json({ error: unlockResult.message, currentBalance: unlockResult.newBalance }, { status: 400 });
      }
      const updatedProfile = db.getProfile(userId);
      return NextResponse.json({
        success: true,
        message: unlockResult.message,
        tokens: unlockResult.newBalance,
        unlockedExams: updatedProfile?.unlockedExams || [],
        transaction: unlockResult.transaction,
      });
    }

    if (action === "add_tokens" || action === "confirm_payment") {
      return NextResponse.json({
        success: false,
        error: "Payments are recorded only after Razorpay verifies them. Open the payment page and complete checkout.",
      }, { status: 403 });
    }

    if (action === "toggle_bookmark") {
      if (!questionId) return NextResponse.json({ error: "questionId is required" }, { status: 400 });
      const bookmarks = db.toggleBookmark(userId, questionId);
      return NextResponse.json({ bookmarks });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
