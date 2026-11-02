import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Paisaan by CapitalSense",
    short_name: "Paisaan",
    description: "Clear, beautifully designed financial decisions for the life you are building.",
    id: "/",
    scope: "/",
    start_url: "/",
    prefer_related_applications: false,
    display: "standalone",
    background_color: "#0b121d",
    theme_color: "#173b75",
    icons: [
      { src: "/icons/paisaan-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/paisaan-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/paisaan-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
