import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Momento",
    short_name: "Momento",
    description: "A digital memory book. Your moments, told like a story.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfbf8",
    theme_color: "#fdfbf8",
  };
}
