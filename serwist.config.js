// @ts-check
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { serwist } from "@serwist/next/config";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  randomUUID();

export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  globDirectory: "public",
  globPatterns: ["**/*.{ico,png,svg,json}"],
  globIgnores: ["icons/*.png", "lebrun-icon.svg"],
  globStrict: false,
  additionalPrecacheEntries: [
    { url: "/", revision },
    { url: "/~offline", revision },
  ],
});