import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Paisaan by CapitalSense",
    short_name: "Paisaan",
    description: "Clear, beautifully designed financial decisions for the life you are building.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b121d",
    theme_color: "#173b75",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
