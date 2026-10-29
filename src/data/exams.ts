import { Examination } from "@/types";
import { DOMAINS } from "./domains";

/*
  This module is imported by client pages (exam catalogue, dashboard, exam instructions, admin),
  so it must NOT import `questions.json`: doing so ships all 3,600 questions, answer keys included,
  to every visitor as a ~4 MB script. Exams only need question *ids*, and the seed bank names them
  `q-<domainSlug>-001` … `q-<domainSlug>-050` in order. `src/__tests__/exam-seed-ids.test.ts`
  checks this against the real question bank, so a generator change that breaks the pattern fails a test.
*/
function seedQuestionId(domainSlug: string, position: number): string {
  return `q-${domainSlug}-${String(position).padStart(3, "0")}`;
}

/** Ids of the seed questions at positions [from, to] (1-based, inclusive) for a domain. */
function seedQuestionIds(domainSlug: string, from: number, to: number): string[] {
  const ids: string[] = [];
  for (let position = from; position <= to; position++) ids.push(seedQuestionId(domainSlug, position));
  return ids;
}

// Helper to get the first `count` seed question ids for a domain
function getDomainQuestionIds(domainSlug: string, count: number): string[] {
  return seedQuestionIds(domainSlug, 1, count);
}

export function generateInitialExams(): Examination[] {
  const exams: Examination[] = [];

  for (const domain of DOMAINS) {
    // 1. Timed Full-Length Assessment
    const qIds25 = getDomainQuestionIds(domain.slug, 25);
    const hasCoding = domain.hasCoding;

    exams.push({
      id: `exam-${domain.slug}-mock-01`,
      slug: `${domain.slug}-benchmark-mock`,
      title: `${domain.name} National Talent & Benchmark Exam (NTCRA)`,
      domainSlug: domain.slug,
      domainName: domain.name,
      categoryCode: domain.categoryCode,
      categoryName: domain.categoryName,
      description: `All-India National Benchmark Examination in ${domain.name}. 3-Section proctored evaluation: Section A (25% Analytical Aptitude), Section B (50% Domain Technical Core), and Section C (25% Workplace Readiness).`,
      durationMinutes: 60,
      totalMarks: 50,
      passingMarks: 25,
      passingPercentage: 50,
      negativeMarkingPerWrong: 0.25,
      attemptLimit: 3,
      isPublished: true,
      isProctored: true,
      sections: [
        {
          id: "section_a",
          name: "Section A: Analytical Aptitude",
          weightPercentage: 25,
          description: "Quantitative problem solving and logical reasoning (25% weight).",
          questionIds: qIds25.slice(0, 6),
        },
        {
          id: "section_b",
          name: "Section B: Domain Technical Core",
          weightPercentage: 50,
          description: "Discipline-specific scenario questions and technical logic (50% weight).",
          questionIds: qIds25.slice(6, 19),
        },
        {
          id: "section_c",
          name: "Section C: Workplace Readiness",
          weightPercentage: 25,
          description: "Professional communication and workplace ethics (25% weight).",
          questionIds: qIds25.slice(19, 25),
        },
      ],
      isFreeSample: ["dotnet", "ai-ml", "vlsi", "machine-design", "aspen-plus", "construction-planning", "finance", "bioinformatics"].includes(domain.slug),
      requiredTier: ["dotnet", "ai-ml", "vlsi", "machine-design", "aspen-plus", "construction-planning", "finance", "bioinformatics"].includes(domain.slug) ? "free" : "seven_day",
      feeRupees: ["dotnet", "ai-ml", "vlsi", "machine-design", "aspen-plus", "construction-planning", "finance", "bioinformatics"].includes(domain.slug) ? 0 : 99,
      tokenFee: ["dotnet", "ai-ml", "vlsi", "machine-design", "aspen-plus", "construction-planning", "finance", "bioinformatics"].includes(domain.slug) ? 0 : 99,
      mode: "timed",
      format: hasCoding ? "hybrid" : "mcq",
      questionCount: qIds25.length,
      questionIds: qIds25,
      difficultyBreakdown: {
        basic: 5,
        intermediate: 8,
        advanced: 8,
        professional: 4,
      },
      allowedResources: ["Non-programmable calculator permitted", "Standard scratch paper provided"],
      resultReleasePolicy: "immediate",
    });

    // 2. Practice & Topic Mastery Sprint
    const qIds15 = seedQuestionIds(domain.slug, 26, 40);
    exams.push({
      id: `exam-${domain.slug}-practice-01`,
      slug: `${domain.slug}-mastery-sprint`,
      title: `${domain.name} Rapid Topic Mastery Sprint`,
      domainSlug: domain.slug,
      domainName: domain.name,
      categoryCode: domain.categoryCode,
      categoryName: domain.categoryName,
      description: `Interactive 15-question sprint for ${domain.name} with instant step-by-step solutions, conceptual hints, and rubric review.`,
      durationMinutes: 20,
      totalMarks: 30,
      passingMarks: 15,
      passingPercentage: 50,
      negativeMarkingPerWrong: 0,
      attemptLimit: 99,
      isPublished: true,
      isFreeSample: true,
      requiredTier: "free",
      mode: "practice",
      format: "mcq",
      questionCount: qIds15.length,
      questionIds: qIds15,
      difficultyBreakdown: {
        basic: 5,
        intermediate: 7,
        advanced: 3,
        professional: 0,
      },
      allowedResources: ["Open reference documentation"],
      resultReleasePolicy: "immediate",
    });
  }

  return exams;
}

export const INITIAL_EXAMS: Examination[] = generateInitialExams();

export function getExamById(id: string): Examination | undefined {
  return INITIAL_EXAMS.find(e => e.id === id || e.slug === id);
}

export function getExamsByDomain(domainSlug: string): Examination[] {
  return INITIAL_EXAMS.filter(e => e.domainSlug.toLowerCase() === domainSlug.toLowerCase());
}

export function getExamsByCategory(categoryCode: string): Examination[] {
  if (categoryCode === "all" || !categoryCode) return INITIAL_EXAMS;
  return INITIAL_EXAMS.filter(e => e.categoryCode === categoryCode);
}
