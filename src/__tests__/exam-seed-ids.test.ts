import { describe, it, expect } from "vitest";
import { INITIAL_EXAMS } from "@/data/exams";
import { DOMAINS } from "@/data/domains";
import questionsData from "@/data/questions.json";

/*
  `src/data/exams.ts` is imported by client pages, so it derives question ids from a naming pattern
  instead of importing the 4 MB question bank. These tests keep that shortcut honest: the ids it
  produces must be exactly what the real bank would have given (same ids, same order).
  This file only reads static data; it never touches the `.data` store.
*/
describe("Exam seed question ids", () => {
  const bankByDomain = new Map<string, string[]>();
  for (const q of questionsData as { id: string; domainSlug: string }[]) {
    if (!bankByDomain.has(q.domainSlug)) bankByDomain.set(q.domainSlug, []);
    bankByDomain.get(q.domainSlug)!.push(q.id);
  }

  it("covers every domain with a benchmark exam and a practice sprint", () => {
    expect(INITIAL_EXAMS).toHaveLength(DOMAINS.length * 2);
  });

  it("benchmark exams use the first 25 questions of the real bank, in order", () => {
    for (const domain of DOMAINS) {
      const exam = INITIAL_EXAMS.find((e) => e.id === `exam-${domain.slug}-mock-01`)!;
      expect(exam.questionIds, domain.slug).toEqual(bankByDomain.get(domain.slug)!.slice(0, 25));
    }
  });

  it("practice sprints use questions 26-40 of the real bank, in order", () => {
    for (const domain of DOMAINS) {
      const exam = INITIAL_EXAMS.find((e) => e.id === `exam-${domain.slug}-practice-01`)!;
      expect(exam.questionIds, domain.slug).toEqual(bankByDomain.get(domain.slug)!.slice(25, 40));
    }
  });

  it("splits the benchmark into sections of 6 / 13 / 6 questions", () => {
    const sections = INITIAL_EXAMS[0].sections!;
    expect(sections.map((s) => s.questionIds.length)).toEqual([6, 13, 6]);
  });
});
