import type React from "react";
import { Layers, Code2, Cog, Cpu, Building2, FlaskConical, BarChart3, Dna } from "lucide-react";

/** One icon per exam stream, shared by the home, exams and domains pages. */
export const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  cse_it: Code2,
  mechanical: Cog,
  ece_eee: Cpu,
  civil: Building2,
  chemical: FlaskConical,
  management: BarChart3,
  med_pharma_bio: Dna,
};

export const categoryIcon = (code: string): React.ElementType => CATEGORY_ICON_MAP[code] || Layers;
