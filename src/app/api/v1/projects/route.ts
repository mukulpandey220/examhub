import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { ProjectSubmission } from "@/types";

// Persisted in-memory cache for project submissions
const projectSubmissionsStore: ProjectSubmission[] = [
  {
    id: "proj-nxt-01",
    teamName: "Neural Circuitry",
    leadUserId: "user-student-ramkumar",
    members: [
      { userId: "user-student-ramkumar", name: "Ramkumar Malothu", email: "ramkumar.malothu@nyeras.com" },
      { userId: "user-student-demo", name: "Arjun Sharma", email: "student@campusradar.edu.in" },
    ],
    projectTitle: "Distributed Microservices Benchmark Engine for Campus Radar",
    domainSlug: "dsa-system-design",
    description: "An ultra-low latency event-driven microservices architecture handling 10,000 requests per second with Redis and Docker.",
    repositoryUrl: "https://github.com/nyeras/distributed-benchmark-engine",
    demoUrl: "https://benchmark.nyeras.com",
    attachments: [
      { name: "architecture_whitepaper.pdf", fileUrl: "/attachments/architecture_whitepaper.pdf", sizeBytes: 1048576, mimeType: "application/pdf" },
      { name: "load_test_results.png", fileUrl: "/attachments/load_test_results.png", sizeBytes: 524288, mimeType: "image/png" },
    ],
    status: "judged",
    scorecards: [
      {
        judgeId: "judge-01",
        judgeName: "Dr. K. R. Suresh",
        criteriaScores: { innovation: 24, architecture: 25, execution: 23, presentation: 24 },
        totalScore: 96,
        feedback: "Exceptional system design and robust fault-tolerance mechanisms demonstrated under stress conditions.",
        scoredAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    finalScore: 96,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const domainSlug = searchParams.get("domain");

    let list = [...projectSubmissionsStore];
    if (userId) {
      list = list.filter(p => p.leadUserId === userId || p.members.some(m => m.userId === userId));
    }
    if (domainSlug) {
      list = list.filter(p => p.domainSlug === domainSlug);
    }

    return NextResponse.json({
      success: true,
      projects: list,
      count: list.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    const body = await req.json();
    const { 
      teamName, 
      projectTitle, 
      domainSlug, 
      description, 
      repositoryUrl, 
      demoUrl, 
      attachments = [], 
      members = [] 
    } = body;

    if (!projectTitle || !repositoryUrl || !description) {
      return NextResponse.json({ error: "projectTitle, repositoryUrl, and description are required" }, { status: 400 });
    }

    const leadUser = {
      userId: auth?.userId || "user-student-ramkumar",
      name: auth?.name || "Ramkumar Malothu",
      email: auth?.email || "ramkumar.malothu@nyeras.com",
    };

    const allMembers = [
      leadUser,
      ...members.filter((m: any) => m.email && m.email !== leadUser.email),
    ];

    const newProject: ProjectSubmission = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teamName: teamName || `${leadUser.name}'s Project Team`,
      leadUserId: leadUser.userId,
      members: allMembers,
      projectTitle: projectTitle.trim(),
      domainSlug: domainSlug || "dsa-system-design",
      description: description.trim(),
      repositoryUrl: repositoryUrl.trim(),
      demoUrl: demoUrl ? demoUrl.trim() : undefined,
      attachments,
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    projectSubmissionsStore.unshift(newProject);

    return NextResponse.json({
      success: true,
      project: newProject,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit project" }, { status: 500 });
  }
}
