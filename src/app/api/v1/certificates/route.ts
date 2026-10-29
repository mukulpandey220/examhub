import { NextRequest, NextResponse } from "next/server";
import { resolveCertificateRecord } from "@/lib/certificates";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Support ?id=..., ?q=..., or ?certificateId=...
    const certificateId =
      searchParams.get("id") ||
      searchParams.get("q") ||
      searchParams.get("certificateId");

    if (!certificateId) {
      return NextResponse.json(
        { error: "Certificate ID parameter ('id' or 'q') is required" },
        { status: 400 }
      );
    }

    const cert = resolveCertificateRecord(certificateId);

    if (!cert) {
      return NextResponse.json(
        { error: "Certificate not found or invalid certificate ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate: cert,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to verify certificate" },
      { status: 500 }
    );
  }
}
