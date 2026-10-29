import { Category, CategoryCode } from "@/types";

export const CATEGORIES: Category[] = [
  {
    code: "cse_it",
    name: "Computer Science & Information Technology",
    shortName: "CSE / IT",
    badgeLabel: "CSE Based",
    domainCount: 32,
    examCount: 64,
    description: "Software engineering, cloud architecture, artificial intelligence, cybersecurity, database systems, and modern web applications.",
    iconName: "Code2",
    accentColor: "from-blue-600 to-indigo-600",
  },
  {
    code: "mechanical",
    name: "Mechanical Engineering & Design",
    shortName: "Mechanical",
    badgeLabel: "Mech Based",
    domainCount: 5,
    examCount: 10,
    description: "CAD/CAM modeling, machine design, IC engines, finite element analysis, car styling, and automotive aerodynamics.",
    iconName: "Cog",
    accentColor: "from-slate-600 to-zinc-800",
  },
  {
    code: "ece_eee",
    name: "Electronics, Electrical & Embedded Systems",
    shortName: "ECE / EEE",
    badgeLabel: "ECE & EEE Based",
    domainCount: 8,
    examCount: 16,
    description: "VLSI chip design, embedded systems, microcontrollers, robotics, electric vehicles, and IoT instrumentation.",
    iconName: "Cpu",
    accentColor: "from-amber-500 to-orange-600",
  },
  {
    code: "civil",
    name: "Civil & Infrastructure Engineering",
    shortName: "Civil",
    badgeLabel: "Civil Based",
    domainCount: 1,
    examCount: 2,
    description: "Construction planning, structural analysis, project scheduling, estimation, and material management.",
    iconName: "Building2",
    accentColor: "from-orange-600 to-amber-700",
  },
  {
    code: "chemical",
    name: "Chemical & Process Engineering",
    shortName: "Chemical",
    badgeLabel: "Chemical Based",
    domainCount: 2,
    examCount: 4,
    description: "Process thermodynamics, Aspen Plus simulation, reaction kinetics, and chemical plant unit operations.",
    iconName: "FlaskConical",
    accentColor: "from-emerald-500 to-teal-700",
  },
  {
    code: "management",
    name: "Management, Finance & Business Systems",
    shortName: "Management",
    badgeLabel: "Management Based",
    domainCount: 17,
    examCount: 34,
    description: "Corporate finance, SAP ERP, business analytics, digital marketing, operations management, and human resources.",
    iconName: "BarChart3",
    accentColor: "from-teal-600 to-cyan-700",
  },
  {
    code: "med_pharma_bio",
    name: "Medical, Pharmaceutical & Biological Sciences",
    shortName: "Medical & Biology",
    badgeLabel: "Bio & Medical Based",
    domainCount: 7,
    examCount: 14,
    description: "Bioinformatics, clinical SAS analytics, molecular biology, genetic engineering, and biostatistical modeling.",
    iconName: "Dna",
    accentColor: "from-rose-500 to-pink-600",
  },
];

export function getCategoryByCode(code: string): Category | undefined {
  return CATEGORIES.find(c => c.code === code);
}

export function getAllExamCategories(): Category[] {
  return CATEGORIES;
}
