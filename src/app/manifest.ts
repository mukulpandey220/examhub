import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Exam Hub | Campus Assessment Hub & Deadline Radar",
    short_name: "Exam Hub",
    description: "National proctored examination, practice test, and academic deadline platform.",
    start_url: "/",
    display: "fullscreen",
    display_override: ["fullscreen", "standalone", "window-controls-overlay"],
    background_color: "#ffffff",
    theme_color: "#0066FF",
    orientation: "any",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
