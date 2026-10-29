import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import twColors from "tailwindcss/colors";

/* Shared indigo/lavender palette. Semantic success and error colors stay distinct. */
type Palette = Record<string, string>;
type RGB = [number, number, number];
type Kind = "bg" | "tx" | "bd";

const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

const BRAND = {
  black: "#13122b",
  teal: "#25226e",
  mint: "#f3f2fd",
  clay: "#6f6bea",
  taupe: "#ba6f50",
};

const rgbOf = (hex: string): RGB => {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
};
const hexOf = (c: RGB) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
const triplet = (c: RGB) => c.join(" ");
const mix = (fg: RGB, bg: RGB, a: number): RGB =>
  [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a))) as RGB;

/* Build a full 50-950 scale from one brand color (500 is the color itself):
   lighter shades blend toward white, darker shades toward the brand black. */
const WHITE_RGB: RGB = [255, 255, 255];
const BLACK_RGB = rgbOf(BRAND.black);
const LIGHTEN: Record<string, number> = { 50: 0.92, 100: 0.84, 200: 0.68, 300: 0.5, 400: 0.28 };
const DARKEN: Record<string, number> = { 600: 0.16, 700: 0.32, 800: 0.48, 900: 0.64, 950: 0.8 };

function scaleFrom(base: string): Palette {
  const b = rgbOf(base);
  const out: Palette = { 500: base };
  for (const [shade, t] of Object.entries(LIGHTEN)) out[shade] = hexOf(mix(WHITE_RGB, b, t));
  for (const [shade, t] of Object.entries(DARKEN)) out[shade] = hexOf(mix(BLACK_RGB, b, t));
  return out;
}

const electric = scaleFrom(BRAND.teal); // primary (also exposed as `brand`)
const clay = scaleFrom(BRAND.clay);
const taupe = scaleFrom(BRAND.taupe);

/* Neutrals: a lavender-to-ink ramp so greys stay in the palette's family */
const slate: Palette = {
  50: BRAND.mint,
  100: "#eeedf8",
  200: "#e7e6f2",
  300: "#c9c7dd",
  400: "#9693af",
  500: "#6a6984",
  600: "#55536e",
  700: "#3d3a58",
  800: "#252241",
  900: "#13122b",
  950: BRAND.black,
};

const pal = (p: unknown) => p as Palette;

/* Every hue family is folded into the brand palette: cool hues -> teal,
   purple-ish hues -> clay, warm hues -> taupe. Green and red stay as
   they are because they signal success / danger. */
const FAMILIES: Record<string, Palette> = {
  slate,
  gray: slate,
  zinc: slate,
  neutral: slate,
  stone: slate,
  red: pal(twColors.red),
  rose: pal(twColors.rose),
  green: pal(twColors.green),
  emerald: pal(twColors.emerald),
  orange: taupe,
  amber: taupe,
  yellow: taupe,
  lime: taupe,
  teal: electric,
  cyan: electric,
  sky: electric,
  blue: electric,
  indigo: electric,
  violet: clay,
  purple: clay,
  fuchsia: clay,
  pink: clay,
  electric,
  brand: electric,
  clay,
  taupe,
};

const NEUTRALS = new Set(["slate", "gray", "zinc", "neutral", "stone"]);

/* Dark surfaces: true black page, near-black cards, neutral greys (no tint) */
const PAGE = "#000000";
const CARD = "#0a0a0a";
const CARD_RGB = rgbOf(CARD);

/* Neutral dark values per utility kind. Text is white-based. */
const NEUTRAL_DARK: Record<Kind, Record<string, string>> = {
  bg: {
    50: PAGE,
    100: "#111111",
    200: "#1a1a1a",
    300: "#262626",
    700: "#3a3a3a",
    800: "#262626",
    900: "#141414",
    950: CARD,
  },
  tx: {
    400: "#9090a0",
    500: "#a8a8b4",
    600: "#c8c8d0",
    700: "#e0e0e6",
    800: "#f2f2f5",
    900: "#ffffff",
    950: "#ffffff",
  },
  bd: {
    50: CARD,
    100: "#171717",
    200: "#262626",
    300: "#333333",
    400: "#4a4a4a",
  },
};

/* The brand indigo is too dark to read as a solid fill or border on a black
   page, so the brand scale gets lighter values in dark mode only. */
const BRAND_DARK: Record<Kind, Record<string, string>> = {
  bg: { 500: "#5a54d8", 600: "#6b66e6", 700: "#4943c2", 800: "#3b36a0", 900: "#2f2b80" },
  tx: { 400: "#9b97ff", 500: "#a5a1ff", 600: "#a5a1ff", 700: "#bdbaff", 800: "#d3d1ff", 900: "#e6e5ff" },
  bd: { 400: "#6f6bea", 500: "#6f6bea", 600: "#8b87f2" },
};

/* Tint strength for chromatic light fills/borders (blended over CARD) */
const TINT_BG: Record<string, number> = { 50: 0.1, 100: 0.16, 200: 0.24, 300: 0.34 };
const TINT_BD: Record<string, number> = { 50: 0.14, 100: 0.22, 200: 0.3, 300: 0.4 };
/* Chromatic text: darker shades become lighter on dark surfaces */
const TEXT_SHIFT: Record<string, string> = {
  500: "400",
  600: "400",
  700: "300",
  800: "200",
  900: "100",
  950: "50",
};

function darkValue(kind: Kind, family: string, shade: string, p: Palette): RGB | null {
  if (NEUTRALS.has(family)) {
    const hex = NEUTRAL_DARK[kind][shade];
    return hex ? rgbOf(hex) : null;
  }
  if (p === electric && BRAND_DARK[kind][shade]) return rgbOf(BRAND_DARK[kind][shade]);
  if (kind === "tx") {
    const to = TEXT_SHIFT[shade];
    return to ? rgbOf(p[to]) : null;
  }
  const table = kind === "bg" ? TINT_BG : TINT_BD;
  const a = table[shade];
  return a === undefined ? null : mix(rgbOf(p["500"]), CARD_RGB, a);
}

const lightVars: Record<string, string> = {
  "--surface-white": "255 255 255",
};
const darkVars: Record<string, string> = {
  "--surface-white": triplet(CARD_RGB),
};

function buildScale(kind: Kind) {
  const out: Record<string, Record<string, string>> = {};
  for (const [family, p] of Object.entries(FAMILIES)) {
    out[family] = {};
    for (const shade of SHADES) {
      const light = rgbOf(p[shade]);
      const dark = darkValue(kind, family, shade, p);
      if (!dark || triplet(dark) === triplet(light)) {
        out[family][shade] = `rgb(${triplet(light)} / <alpha-value>)`;
      } else {
        const name = `--${kind}-${family}-${shade}`;
        lightVars[name] = triplet(light);
        darkVars[name] = triplet(dark);
        out[family][shade] = `rgb(var(${name}) / <alpha-value>)`;
      }
    }
  }
  return out;
}

/* `bg-white` follows the card surface; low-alpha white (glass overlays on
   dark panels, e.g. bg-white/10) stays white in both themes. */
const surfaceWhite = ({ opacityValue }: { opacityValue?: string }) => {
  if (opacityValue === undefined) return "rgb(var(--surface-white))";
  const n = Number(opacityValue);
  if (Number.isNaN(n)) return `rgb(var(--surface-white) / ${opacityValue})`; // var(--tw-*-opacity)
  return n >= 0.5 ? `rgb(var(--surface-white) / ${n})` : `rgb(255 255 255 / ${n})`;
};

// Tailwind accepts color functions at runtime but its typings do not model them.
const bgScale = { ...buildScale("bg"), white: surfaceWhite } as unknown as Record<string, string>;
const txScale = buildScale("tx");
const bdScale = buildScale("bd");

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  /* `.dark` is toggled at runtime (ThemeToggle + the inline init script),
     so Tailwind must never purge the rules that hang off it. */
  safelist: ["dark"],
  theme: {
    extend: {
      /* Static (light-value) palettes so utilities that are not themed per
         mode (shadow-*, decoration-*, accent-*) still resolve to the brand. */
      colors: {
        ...FAMILIES,
        mint: BRAND.mint,
        ink: BRAND.black,
      },
      backgroundColor: bgScale,
      gradientColorStops: bgScale,
      textColor: txScale,
      placeholderColor: txScale,
      fill: txScale,
      stroke: txScale,
      borderColor: bdScale,
      divideColor: bdScale,
      ringColor: bdScale,
      outlineColor: bdScale,
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      /* Lighter weights read cleaner and calmer in a daily-use UI */
      fontWeight: {
        bold: "600",
        extrabold: "700",
        black: "700",
      },
      /* Slightly larger small-text sizes for readability */
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.2rem" }],
        sm: ["0.9rem", { lineHeight: "1.4rem" }],
      },
      borderRadius: {
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      /* Shadows are driven by CSS variables so they soften on the
         pitch-black dark theme instead of disappearing into it. */
      boxShadow: {
        "soft-sm": "var(--shadow-sm)",
        "soft-md": "var(--shadow-md)",
        "soft-lg": "var(--shadow-lg)",
        "soft-xl": "var(--shadow-xl)",
        electric: "0 6px 16px -4px rgba(0, 121, 140, 0.45)",
        "electric-lg": "0 10px 26px -6px rgba(0, 121, 140, 0.55)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "none" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "none" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-6px) scale(0.98)" },
          to: { opacity: "1", transform: "none" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards",
        "fade-in": "fade-in 0.5s ease-out backwards",
        "scale-in": "scale-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) backwards",
        "slide-down": "slide-down 0.18s ease-out backwards",
        blink: "blink 1s step-end infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": lightVars,
        ".dark": darkVars,
      });
    }),
  ],
};
export default config;
