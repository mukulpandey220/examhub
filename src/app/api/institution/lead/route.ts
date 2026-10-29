import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const leads = db.getInstitutionalLeads();
    const diagnostics = db.getInstitutionalDiagnostics();
    return NextResponse.json({ leads, diagnostics });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      collegeName,
      universityAffiliation,
      city,
      state,
      spocName,
      spocDesignation,
      spocEmail,
      spocPhone,
      studentCohortSize,
      preferredExamWindow,
      labFacilityAvailable,
    } = body;

    if (!collegeName || !spocName || !spocEmail) {
      return NextResponse.json(
        { error: "College name, SPOC coordinator name, and official email are required." },
        { status: 400 }
      );
    }

    const lead = db.submitInstitutionalLead({
      collegeName: String(collegeName).trim(),
      universityAffiliation: universityAffiliation ? String(universityAffiliation).trim() : "Affiliated University",
      city: city ? String(city).trim() : "City",
      state: state ? String(state).trim() : "State",
      spocName: String(spocName).trim(),
      spocDesignation: spocDesignation ? String(spocDesignation).trim() : "TPO / Faculty SPOC",
      spocEmail: String(spocEmail).trim().toLowerCase(),
      spocPhone: spocPhone ? String(spocPhone).trim() : "+91 98000 00000",
      studentCohortSize: Number(studentCohortSize) || 300,
      preferredExamWindow: preferredExamWindow ? String(preferredExamWindow).trim() : "Upcoming Examination Cycle",
      labFacilityAvailable: Boolean(labFacilityAvailable),
    });

    return NextResponse.json({
      success: true,
      message: "Institutional partnership request registered successfully. Our academic liaison will connect within 24 hours.",
      lead,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
