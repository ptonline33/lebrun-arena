import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lebrun Arena — Félix & Alexis Lebrun | Full Matches 2025–26",
    short_name: "Lebrun Arena",
    description:
      "Every 2025–26 ping pong match featuring Félix Lebrun or Alexis Lebrun from the WTT Global YouTube channel.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#04050d",
    theme_color: "#04050d",
    categories: ["sports", "entertainment"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}